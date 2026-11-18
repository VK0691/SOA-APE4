from typing import Annotated
from decimal import Decimal

from fastapi import APIRouter, Depends, Header, Response, Query

from app.db import SessionLocal
from app.models import Venta, Comprador
from app.schemas import CrearVenta, CrearComprador, ActualizarComprador
from app.security import identidad, vendedor, propietario
from app.errors import ApiError
from app.services import venta_service as service
from app.repositories.venta_repository import VentaRepository
from app.repositories.comprador_repository import CompradorRepository

router = APIRouter(prefix="/api")

ESTADOS_VENTA_VALIDOS = {"PENDIENTE", "EN_REVISION", "COMPLETADA", "FALLIDA"}

# ============================================================================
# COMPRADORES
# ============================================================================

@router.post("/compradores", status_code=201)
def crear_comprador(d: CrearComprador, u=Depends(identidad)):
    vendedor(u)
    with SessionLocal.begin() as db:
        c = Comprador(usuario=u["usuario"], **d.model_dump())
        db.add(c)
        db.flush()
        return {"id": c.id, "documento": c.documento, "nombre": c.nombre, "correo": c.correo}


@router.get("/compradores")
def listar_compradores(
    buscar: Annotated[str | None, Query(description="Búsqueda parcial por nombre o documento")] = None,
    u=Depends(identidad)
):
    """
    F01: Listar compradores del usuario autenticado.
    D07: Búsqueda opcional parcial por nombre o documento.
    """
    vendedor(u)
    with SessionLocal() as db:
        repo = CompradorRepository(db)
        compradores = repo.listar_por_usuario(u["usuario"], buscar=buscar)
        return [
            {
                "id": c.id,
                "documento": c.documento,
                "nombre": c.nombre,
                "correo": c.correo
            }
            for c in compradores
        ]


@router.get("/compradores/{id}")
def obtener_comprador(id: int, u=Depends(identidad)):
    """
    F02: Consultar un comprador por identificador.
    """
    vendedor(u)
    with SessionLocal() as db:
        repo = CompradorRepository(db)
        c = repo.por_id(id)
        if c is None:
            raise ApiError(404, "COMPRADOR_NO_EXISTE", "Comprador inexistente")
        propietario(u, c.usuario)
        return {
            "id": c.id,
            "documento": c.documento,
            "nombre": c.nombre,
            "correo": c.correo
        }


@router.put("/compradores/{id}")
def actualizar_comprador(id: int, d: ActualizarComprador, u=Depends(identidad)):
    """
    D08: Actualizar comprador sin cambiar documento (inmutable).
    """
    vendedor(u)
    with SessionLocal.begin() as db:
        repo = CompradorRepository(db)
        c = repo.por_id(id)
        if c is None:
            raise ApiError(404, "COMPRADOR_NO_EXISTE", "Comprador inexistente")
        propietario(u, c.usuario)
        c.nombre = d.nombre
        c.correo = d.correo
        return {
            "id": c.id,
            "documento": c.documento,
            "nombre": c.nombre,
            "correo": c.correo
        }


# ============================================================================
# VENTAS
# ============================================================================

@router.post("/ventas")
def crear_venta(
    d: CrearVenta,
    response: Response,
    idempotency_key: Annotated[str, Header(
        min_length=8, max_length=100, pattern=r"^[A-Za-z0-9_-]+$")],
    u=Depends(identidad)
):
    vendedor(u)
    resultado, codigo = service.crear(d, idempotency_key, u)
    response.status_code = codigo
    response.headers["Location"] = f"/api/ventas/{resultado['id']}"
    return resultado


@router.get("/ventas")
def listar_ventas(
    estado: Annotated[str | None, Query(description="Filtro opcional por estado")] = None,
    limit: Annotated[int | None, Query(description="Límite por página (1..50)")] = None,
    offset: Annotated[int | None, Query(description="Desplazamiento")] = None,
    u=Depends(identidad)
):
    """
    F03: Listar ventas propias ordenadas por fecha DESC e ID DESC.
    F04: Filtrar por estado opcional (PENDIENTE, EN_REVISION, COMPLETADA, FALLIDA).
    D06: Paginación cuando se envían limit y/o offset.
    """
    vendedor(u)

    if estado is not None:
        estado_norm = estado.strip().upper()
        if estado_norm not in ESTADOS_VENTA_VALIDOS:
            raise ApiError(
                422,
                "ESTADO_INVALIDO",
                f"Estado inválido: valores admitidos {', '.join(sorted(ESTADOS_VENTA_VALIDOS))}"
            )
        estado = estado_norm

    with SessionLocal() as db:
        repo = VentaRepository(db)

        # Si se solicita paginación (D06)
        if limit is not None or offset is not None:
            l = limit if limit is not None else 10
            o = offset if offset is not None else 0

            if l < 1 or l > 50:
                raise ApiError(422, "LIMITE_INVALIDO", "Limit debe estar entre 1 y 50")
            if o < 0:
                raise ApiError(422, "OFFSET_INVALIDO", "Offset no puede ser negativo")

            total = repo.contar_propias(u["usuario"], estado=estado)
            ventas = repo.listar_propias(u["usuario"], estado=estado, limit=l, offset=o)
            return {
                "items": [service.salida(v) for v in ventas],
                "total": total,
                "limit": l,
                "offset": o
            }

        # Listado plano sin paginación (F03 y F04)
        ventas = repo.listar_propias(u["usuario"], estado=estado)
        return [service.salida(v) for v in ventas]


@router.get("/ventas/resumen")
def resumen_ventas(u=Depends(identidad)):
    """
    D09: Resumen numérico de ventas del usuario.
    """
    vendedor(u)
    with SessionLocal() as db:
        repo = VentaRepository(db)
        ventas = repo.listar_propias(u["usuario"])

        completadas = 0
        total_ingresos = Decimal("0.00")
        pendientes = 0
        en_revision = 0
        fallidas = 0

        for v in ventas:
            if v.estado == "COMPLETADA":
                completadas += 1
                if v.precio_acordado is not None:
                    total_ingresos += v.precio_acordado
            elif v.estado == "PENDIENTE":
                pendientes += 1
            elif v.estado == "EN_REVISION":
                en_revision += 1
            elif v.estado == "FALLIDA":
                fallidas += 1

        return {
            "usuario": u["usuario"],
            "completadas": completadas,
            "totalIngresos": str(total_ingresos),
            "pendientes": pendientes,
            "enRevision": en_revision,
            "fallidas": fallidas,
            "totalVentas": len(ventas)
        }


@router.get("/ventas/incidencias")
def incidencias_ventas(u=Depends(identidad)):
    """
    S12: Panel de incidencias: ventas EN_REVISION y COMPLETADAS con notificación PENDIENTE.
    """
    vendedor(u)
    with SessionLocal() as db:
        repo = VentaRepository(db)
        ventas = repo.listar_propias(u["usuario"])

        en_revision = [
            service.salida(v) for v in ventas if v.estado == "EN_REVISION"
        ]
        aviso_pendiente = [
            service.salida(v) for v in ventas if v.estado == "COMPLETADA" and v.notificacion == "PENDIENTE"
        ]

        return {
            "usuario": u["usuario"],
            "totalIncidencias": len(en_revision) + len(aviso_pendiente),
            "ventasEnRevision": en_revision,
            "notificacionesPendientes": aviso_pendiente
        }


@router.get("/ventas/{id}")
def obtener_venta(id: int, u=Depends(identidad)):
    with SessionLocal() as db:
        v = db.get(Venta, id)
        if v is None:
            raise ApiError(404, "VENTA_NO_EXISTE", "Venta inexistente")
        propietario(u, v.usuario)
        return service.salida(v)


@router.get("/ventas/{id}/comprobante")
def comprobante_venta(id: int, u=Depends(identidad)):
    """
    D10: Emitir comprobante JSON de una venta confirmada.
    """
    vendedor(u)
    with SessionLocal() as db:
        v = db.get(Venta, id)
        if v is None:
            raise ApiError(404, "VENTA_NO_EXISTE", "Venta inexistente")
        propietario(u, v.usuario)

        if v.estado != "COMPLETADA":
            raise ApiError(
                409,
                "VENTA_NO_COMPLETADA",
                f"No se puede emitir comprobante para una venta en estado {v.estado}"
            )

        return {
            "idVenta": v.id,
            "operacionId": v.operacion_id,
            "fecha": v.fecha.isoformat() + "Z",
            "comprador": {
                "id": v.comprador.id,
                "documento": v.comprador.documento,
                "nombre": v.comprador.nombre,
                "correo": v.comprador.correo
            },
            "vehiculoId": v.vehiculo_id,
            "precioConfirmado": str(v.precio_acordado) if v.precio_acordado is not None else None,
            "moneda": v.moneda,
            "estado": v.estado
        }


@router.post("/ventas/{id}/conciliar")
def conciliar_venta(id: int, response: Response, u=Depends(identidad)):
    """
    S15: Conciliación manual de una venta en revisión por operador o administrador.
    """
    vendedor(u)
    with SessionLocal() as db:
        v = db.get(Venta, id)
        if v is None:
            raise ApiError(404, "VENTA_NO_EXISTE", "Venta inexistente")
        propietario(u, v.usuario)

        if v.estado in ("COMPLETADA", "FALLIDA"):
            raise ApiError(
                409,
                "ESTADO_NO_CONCILIABLE",
                f"La venta se encuentra en estado terminal {v.estado} y no requiere conciliación"
            )

    # Invocar proceso de recuperación y notificación
    service.procesar(id)

    with SessionLocal() as db:
        v_res = db.get(Venta, id)
        if v_res.estado == "COMPLETADA":
            service.notificar(id)
            db.refresh(v_res)
            response.status_code = 200
            return service.salida(v_res)
        elif v_res.estado == "FALLIDA":
            response.status_code = 200
            return service.salida(v_res)
        else:
            response.status_code = 202
            return service.salida(v_res)

