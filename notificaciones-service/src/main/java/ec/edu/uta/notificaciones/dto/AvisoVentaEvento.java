package ec.edu.uta.notificaciones.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AvisoVentaEvento(
    String eventoId,
    String tipo,
    Integer ventaId,
    String operacionId,
    Integer vehiculoId,
    Integer compradorId,
    String precio,
    String moneda,
    String fecha
) {}
