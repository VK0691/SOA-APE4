package ec.edu.uta.notificaciones.controller;

import ec.edu.uta.notificaciones.dto.AvisoVentaEvento;
import ec.edu.uta.notificaciones.dto.NotificacionRequest;
import ec.edu.uta.notificaciones.dto.NotificacionResponse;
import ec.edu.uta.notificaciones.service.NotificacionService;
import ec.edu.uta.notificaciones.service.NotificacionStorage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@CrossOrigin(origins = "*")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final NotificacionStorage notificacionStorage;

    public NotificacionController(
            NotificacionService notificacionService,
            NotificacionStorage notificacionStorage) {
        this.notificacionService = notificacionService;
        this.notificacionStorage = notificacionStorage;
    }

    /**
     * Endpoint consultado por JavaFX para obtener las notificaciones de ventas en tiempo real.
     * Cumple con la APE 4 (Actividades 8 y 9).
     */
    @GetMapping
    public ResponseEntity<List<AvisoVentaEvento>> listarHistorial() {
        List<AvisoVentaEvento> avisos = notificacionStorage.listarHistorial();
        return ResponseEntity.ok(avisos);
    }

    /**
     * Endpoint existente para recibir avisos directos por canal HTTP REST.
     */
    @PostMapping
    public ResponseEntity<NotificacionResponse> crear(
            @RequestBody NotificacionRequest request) {

        NotificacionResponse response = notificacionService.procesar(request);

        // Guardar tambien en el almacenamiento para que JavaFX lo visualice
        notificacionStorage.registrarDesdeHttp(
                request.getVehiculoId(),
                request.getTipo(),
                request.getDestinatario(),
                request.getMensaje()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
