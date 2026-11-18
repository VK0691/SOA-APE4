import sys
import time
import logging

from app.db import SessionLocal
from app.repositories.venta_repository import VentaRepository
from app.services.venta_service import procesar, notificar

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def ciclo():
    with SessionLocal() as db:
        ids = VentaRepository(db).pendientes()

    if ids:
        logging.info("Worker ciclo: procesando %s venta(s) elegible(s) para reintento/conciliación", len(ids))

    for id in ids:
        try:
            procesar(id)
            notificar(id)
        except Exception:
            logging.exception("No se pudo conciliar venta %s", id)

if __name__ == "__main__":
    logging.info("Iniciando worker de conciliación y notificaciones...")
    while True:
        try:
            ciclo()
        except Exception:
            logging.exception("Fallo de ciclo de recuperación")

        if "--once" in sys.argv:
            logging.info("Worker finalizado tras ejecución única (--once).")
            break

        time.sleep(10)
