package ec.edu.uta.notificaciones.service;

import ec.edu.uta.notificaciones.dto.AvisoVentaEvento;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificacionStorage {

    private static final Logger log = LoggerFactory.getLogger(NotificacionStorage.class);

    // Registro en memoria de avisos recibidos
    private final List<AvisoVentaEvento> historial = new CopyOnWriteArrayList<>();

    // Conjunto concurrente para desduplicacion por eventoId (Prueba P22)
    private final Set<String> eventosProcesados = ConcurrentHashMap.newKeySet();

    /**
     * Registra un evento recibido desde RabbitMQ garantizando idempotencia.
     * @return true si el evento es nuevo y fue registrado; false si ya habia sido procesado.
     */
    public boolean registrarEvento(AvisoVentaEvento evento) {
        if (evento == null) {
            return false;
        }

        String eventoId = evento.eventoId();
        if (eventoId == null || eventoId.isBlank()) {
            eventoId = UUID.randomUUID().toString();
        }

        // Si ya fue procesado, se descarta para evitar duplicados en la UI y el historial
        if (!eventosProcesados.add(eventoId)) {
            log.warn("Evento duplicado detectado y omitido: eventoId={}, ventaId={}", eventoId, evento.ventaId());
            return false;
        }

        historial.add(0, evento); // Insertar al inicio para que el mas reciente aparezca primero
        log.info("Aviso de venta registrado exitosamente: eventoId={}, ventaId={}, vehiculoId={}",
                eventoId, evento.ventaId(), evento.vehiculoId());
        return true;
    }

    /**
     * Devuelve la lista completa de notificaciones para el cliente JavaFX.
     */
    public List<AvisoVentaEvento> listarHistorial() {
        return Collections.unmodifiableList(new ArrayList<>(historial));
    }

    /**
     * Permite registrar tambien eventos recibidos por el canal HTTP POST tradicional.
     */
    public void registrarDesdeHttp(Integer vehiculoId, String tipo, String destinatario, String mensaje) {
        String eventoId = UUID.randomUUID().toString();
        AvisoVentaEvento aviso = new AvisoVentaEvento(
                eventoId,
                tipo != null ? tipo : "HTTP_AVISO",
                null,
                mensaje,
                vehiculoId,
                null,
                null,
                null,
                Instant.now().toString()
        );
        eventosProcesados.add(eventoId);
        historial.add(0, aviso);
    }
}
