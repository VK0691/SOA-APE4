package ec.edu.uta.notificaciones.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import ec.edu.uta.notificaciones.dto.AvisoVentaEvento;
import ec.edu.uta.notificaciones.service.NotificacionStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class RabbitMQVentasListener {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQVentasListener.class);

    private final NotificacionStorage storage;
    private final ObjectMapper objectMapper;

    public RabbitMQVentasListener(NotificacionStorage storage, ObjectMapper objectMapper) {
        this.storage = storage;
        this.objectMapper = objectMapper;
    }

    @RabbitListener(queues = "${app.rabbitmq.queue.ventas:notificaciones.ventas}")
    public void recibirEventoVenta(Message message) {
        String mensajeJson = new String(message.getBody(), StandardCharsets.UTF_8);
        log.info("Mensaje AMQP recibido desde RabbitMQ: {}", mensajeJson);
        try {
            AvisoVentaEvento evento = objectMapper.readValue(mensajeJson, AvisoVentaEvento.class);
            boolean nuevo = storage.registrarEvento(evento);
            if (nuevo) {
                log.info("Notificacion procesada exitosamente para la venta ID={}", evento.ventaId());
            } else {
                log.warn("Evento ignorado por ser duplicado: eventoId={}", evento.eventoId());
            }
        } catch (Exception ex) {
            log.error("Error al procesar el mensaje JSON recibido de RabbitMQ: {}", ex.getMessage(), ex);
        }
    }
}
