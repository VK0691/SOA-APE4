package ec.edu.uta.venta_vehiculos_api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import ec.edu.uta.venta_vehiculos_api.model.HistorialPrecio;

public record HistorialPrecioResponse(
        Integer id,
        Integer idVehiculo,
        BigDecimal precioAnterior,
        BigDecimal precioNuevo,
        LocalDateTime fecha,
        String usuario
) {
    public static HistorialPrecioResponse de(HistorialPrecio h) {
        return new HistorialPrecioResponse(
                h.getId(),
                h.getIdVehiculo(),
                h.getPrecioAnterior(),
                h.getPrecioNuevo(),
                h.getFecha(),
                h.getUsuario()
        );
    }
}

