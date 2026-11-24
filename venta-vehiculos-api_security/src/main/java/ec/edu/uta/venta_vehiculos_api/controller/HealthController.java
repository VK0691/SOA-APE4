package ec.edu.uta.venta_vehiculos_api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @Value("${server.port:8081}")
    private String serverPort;

    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "venta-vehiculos-api",
                "instancia", "127.0.0.1:" + serverPort,
                "timestamp", Instant.now().toString()
        ));
    }
}
