package ec.edu.uta.venta_vehiculos_api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.edu.uta.venta_vehiculos_api.model.HistorialPrecio;

public interface HistorialPrecioRepository extends JpaRepository<HistorialPrecio, Integer> {

    List<HistorialPrecio> findByIdVehiculoOrderByFechaDesc(Integer idVehiculo);

}

