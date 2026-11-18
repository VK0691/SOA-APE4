import logging
from uuid import uuid4

from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

from app.context import correlation_id_ctx
from app.errors import instalar
from app.routers.ventas import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

app = FastAPI(title="API de ventas de vehículos", version="1.0.0")

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        cid = request.headers.get("X-Correlation-Id")
        if not cid or not cid.strip():
            cid = str(uuid4())
        else:
            cid = cid.strip()

        token = correlation_id_ctx.set(cid)
        logging.info("[Correlation-ID: %s] Entrada %s %s", cid, request.method, request.url.path)
        try:
            response = await call_next(request)
            response.headers["X-Correlation-Id"] = cid
            logging.info("[Correlation-ID: %s] Salida %s %s -> %s", cid, request.method, request.url.path, response.status_code)
            return response
        finally:
            correlation_id_ctx.reset(token)

app.add_middleware(CorrelationIdMiddleware)

instalar(app)

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "UP"}
