import logging
import httpx

from app.config import JAVA_URL, SERVICE_KEY
from app.context import correlation_id_ctx

class FalloRemoto(Exception):
    def __init__(self, status, detalle):
        self.status, self.detalle = status, detalle

class VehiculosClient:
    def llamar(self, metodo, ruta, **kwargs):
        cid = correlation_id_ctx.get()
        headers = kwargs.pop("headers", {})
        headers["X-Service-Key"] = SERVICE_KEY
        if cid:
            headers["X-Correlation-Id"] = cid
            logging.info("[Correlation-ID: %s] Llamando a Java %s %s", cid, metodo, ruta)

        try:
            r = httpx.request(
                metodo,
                JAVA_URL + ruta,
                headers=headers,
                timeout=httpx.Timeout(5, connect=2),
                **kwargs
            )
        except httpx.RequestError:
            if cid:
                logging.warning("[Correlation-ID: %s] Timeout o fallo de conexión con Java en %s %s", cid, metodo, ruta)
            raise FalloRemoto(503, "Resultado remoto desconocido")

        if r.status_code >= 400:
            if cid:
                logging.warning("[Correlation-ID: %s] Java respondió rechazo %s en %s", cid, r.status_code, ruta)
            raise FalloRemoto(r.status_code, "Operación Java rechazada")

        try:
            return r.json() if r.content else None
        except ValueError:
            raise FalloRemoto(502, "Respuesta Java ilegible")

    def por_operacion(self, op):
        return self.llamar("GET", "/api/reservas", params={"operacionId": op})

    def reservar(self, vehiculo, op):
        return self.llamar("POST", f"/api/vehiculos/{vehiculo}/reservas", json={"operacionId": op})

    def confirmar(self, reserva):
        return self.llamar("PUT", f"/api/reservas/{reserva}/confirmacion")
