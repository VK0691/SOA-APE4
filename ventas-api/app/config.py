import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

def requerido(nombre):
    valor = os.environ.get(nombre, "")
    if not valor:
        raise RuntimeError(f"Falta configurar {nombre}")
    return valor

JAVA_URL = requerido("JAVA_URL").rstrip("/")
SERVICE_KEY = requerido("VENTAS_SERVICE_KEY")
NOTIF_URL = requerido("NOTIFICACIONES_URL").rstrip("/")
NOTIF_KEY = requerido("NOTIFICACIONES_KEY")

if min(len(SERVICE_KEY), len(NOTIF_KEY)) < 32:
    raise RuntimeError("Claves de servicio de al menos 32 caracteres")

if SERVICE_KEY.startswith("COLOCA_") or NOTIF_KEY.startswith("COLOCA_"):
    raise RuntimeError("Reemplaza las claves de ejemplo en el archivo .env")

# Configuracion de RabbitMQ (APE 4 - Actividad 8)
RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "127.0.0.1")
RABBITMQ_PORT = int(os.environ.get("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.environ.get("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.environ.get("RABBITMQ_PASS", "guest")
RABBITMQ_QUEUE_VENTAS = os.environ.get("RABBITMQ_QUEUE_VENTAS", "notificaciones.ventas")
