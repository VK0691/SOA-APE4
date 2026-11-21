import json
import logging
from uuid import uuid4
from datetime import datetime, timezone
import pika

from app.config import (
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASS,
    RABBITMQ_QUEUE_VENTAS
)

logger = logging.getLogger(__name__)

def publicar_evento_venta(venta) -> bool:
    """
    Publica de forma independiente y persistente el evento de venta confirmada
    en la cola durable de RabbitMQ ('notificaciones.ventas').
    Cumple con los requisitos de la APE 4 (Actividad 8).
    """
    mensaje = {
        "eventoId": str(uuid4()),
        "tipo": "VENTA_CONFIRMADA",
        "ventaId": venta.id,
        "operacionId": venta.operacion_id,
        "vehiculoId": venta.vehiculo_id,
        "compradorId": venta.comprador_id,
        "precio": str(venta.precio_acordado) if venta.precio_acordado is not None else None,
        "moneda": venta.moneda,
        "fecha": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }

    try:
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            connection_attempts=3,
            retry_delay=2
        )

        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Asegurar que la cola sea durable
        channel.queue_declare(queue=RABBITMQ_QUEUE_VENTAS, durable=True)

        # Publicar mensaje persistente (delivery_mode=2)
        channel.basic_publish(
            exchange="",
            routing_key=RABBITMQ_QUEUE_VENTAS,
            body=json.dumps(mensaje),
            properties=pika.BasicProperties(
                delivery_mode=pika.DeliveryMode.Persistent,
                content_type="application/json",
                headers={"X-Event-Type": "VENTA_CONFIRMADA"}
            )
        )

        connection.close()
        logger.info(
            "Evento de venta publicado exitosamente en RabbitMQ [Cola: %s, EventoId: %s, VentaId: %s]",
            RABBITMQ_QUEUE_VENTAS,
            mensaje["eventoId"],
            venta.id
        )
        return True

    except Exception as ex:
        logger.error(
            "No se pudo publicar el evento en RabbitMQ para la venta %s: %s",
            venta.id,
            ex
        )
        return False
