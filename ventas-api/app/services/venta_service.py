import hashlib
import json
import logging
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timezone, timedelta

import httpx
from sqlalchemy.exc import IntegrityError

from app.db import SessionLocal
from app.models import Venta, Comprador
from app.repositories.venta_repository import VentaRepository
from app.clients.vehiculos_client import VehiculosClient, FalloRemoto
from app.config import NOTIF_URL, NOTIF_KEY
from app.errors import ApiError
from app.security import propietario
from app.context import correlation_id_ctx

remote = VehiculosClient()

ESPERAS_REINTENTO = [10, 30, 60]

def salida(v):
    return {
        "id": v.id,
        "operacionId": v.operacion_id,
        "vehiculoId": v.vehiculo_id,
        "compradorId": v.comprador_id,
        "precioAcordado": str(v.precio_acordado) if v.precio_acordado is not None else None,
        "moneda": v.moneda,
        "estado": v.estado,
        "notificacion": v.notificacion,
        "intentos": v.intentos,
        "proximoReintentoUTC": v.proximo_reintento.isoformat() + "Z" if v.proximo_reintento else None,
        "fechaUTC": v.fecha.isoformat() + "Z"
    }

def crear(datos, clave, usuario):
    cuerpo = json.dumps(datos.model_dump(), sort_keys=True, separators=(",", ":"))
    huella = hashlib.sha256(cuerpo.encode()).hexdigest()
    nueva = False

    with SessionLocal() as db:
        repo = VentaRepository(db)
        v = repo.por_clave(usuario["usuario"], clave)

        if v is None:
            comprador = db.get(Comprador, datos.compradorId)
            if comprador is None:
                raise ApiError(404, "COMPRADOR_NO_EXISTE", "Comprador inexistente")
            propietario(usuario, comprador.usuario)

            v = Venta(
                operacion_id=str(uuid4()),
                usuario=usuario["usuario"],
                vehiculo_id=datos.vehiculoId,
                comprador_id=datos.compradorId,
                idempotency_key=clave,
                request_hash=huella
            )
            db.add(v)
            try:
                db.commit()
                nueva = True
            except IntegrityError:
                db.rollback()
                v = repo.por_clave(usuario["usuario"], clave)
                if v is None:
                    raise

        if v.request_hash != huella:
            raise ApiError(409, "CLAVE_REUTILIZADA", "La misma clave requiere el mismo cuerpo")

        id = v.id

    procesar(id)
    notificar(id)

    with SessionLocal() as db:
        v = db.get(Venta, id)
        if v.estado == "FALLIDA":
            raise ApiError(v.error_status or 409, "VENTA_RECHAZADA",
                           v.error_detalle or "La venta fue rechazada")

        status = (201 if nueva else 200) if v.estado == "COMPLETADA" else 202
        return salida(v), status

def procesar(id):
    with SessionLocal.begin() as db:
        v = VentaRepository(db).bloquear(id)
        if v is None or v.estado in ("COMPLETADA", "FALLIDA"):
            return

        try:
            try:
                r = remote.por_operacion(v.operacion_id)
            except FalloRemoto as ex:
                if ex.status != 404:
                    raise
                try:
                    r = remote.reservar(v.vehiculo_id, v.operacion_id)
                except FalloRemoto as rechazo:
                    if rechazo.status in (404, 409, 422):
                        v.estado = "FALLIDA"
                        v.error_status = rechazo.status
                        v.error_detalle = "Vehículo inexistente o no disponible"
                        v.intentos = 0
                        v.proximo_reintento = None
                        return
                    raise

            v.reserva_id = r["id"]
            v.precio_acordado = Decimal(str(r["precio"]))
            v.moneda = r["moneda"]

            if r["estado"] == "LIBERADA":
                v.estado = "FALLIDA"
                v.error_status = 409
                v.error_detalle = "Reserva liberada"
                v.intentos = 0
                v.proximo_reintento = None
                return

            if r["estado"] == "RESERVADA":
                r = remote.confirmar(r["id"])

            if r["estado"] != "CONFIRMADA":
                raise FalloRemoto(502, "Estado de reserva inesperado")

            v.estado = "COMPLETADA"
            v.error_status = None
            v.error_detalle = None
            v.intentos = 0
            v.proximo_reintento = None

        except (FalloRemoto, ValueError, KeyError) as ex:
            v.estado = "EN_REVISION"
            v.error_detalle = "Pendiente de consultar y conciliar con Java"
            v.intentos = (v.intentos or 0) + 1
            espera = ESPERAS_REINTENTO[min(v.intentos - 1, len(ESPERAS_REINTENTO) - 1)]
            v.proximo_reintento = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=espera)
            logging.warning("Venta %s en revisión (intento %s). Próximo reintento en %ss", v.id, v.intentos, espera)

def notificar(id):
    with SessionLocal.begin() as db:
        v = VentaRepository(db).bloquear(id)
        if v is None or v.estado != "COMPLETADA" or v.notificacion == "ENVIADA":
            return

        cid = correlation_id_ctx.get()
        req_headers = {"X-Notification-Key": NOTIF_KEY}
        if cid:
            req_headers["X-Correlation-Id"] = cid
            logging.info("[Correlation-ID: %s] Enviando aviso notificacion venta %s", cid, v.id)

        try:
            r = httpx.post(
                NOTIF_URL + "/api/notificaciones",
                timeout=3,
                headers=req_headers,
                json={
                    "vehiculoId": v.vehiculo_id,
                    "tipo": "VENTA",
                    "destinatario": v.comprador.correo,
                    "mensaje": f"Venta {v.id} operación {v.operacion_id} completada"
                }
            )

            if 200 <= r.status_code < 300:
                v.notificacion = "ENVIADA"
                v.intentos = 0
                v.proximo_reintento = None
                logging.info("Notificación de venta %s enviada con éxito (HTTP %s)", v.id, r.status_code)
            else:
                v.notificacion = "PENDIENTE"
                v.intentos = (v.intentos or 0) + 1
                espera = ESPERAS_REINTENTO[min(v.intentos - 1, len(ESPERAS_REINTENTO) - 1)]
                v.proximo_reintento = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=espera)
                logging.warning("Fallo al notificar venta %s (HTTP %s). Intento %s, reintento en %ss", v.id, r.status_code, v.intentos, espera)

        except httpx.RequestError as ex:
            v.notificacion = "PENDIENTE"
            v.intentos = (v.intentos or 0) + 1
            espera = ESPERAS_REINTENTO[min(v.intentos - 1, len(ESPERAS_REINTENTO) - 1)]
            v.proximo_reintento = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=espera)
            logging.warning("Error de red al notificar venta %s. Intento %s, reintento en %ss", v.id, v.intentos, espera)
