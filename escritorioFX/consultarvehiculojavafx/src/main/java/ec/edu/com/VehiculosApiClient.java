package ec.edu.com;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

public final class VehiculosApiClient {
    private static final String URL_API = "http://127.0.0.1:8081/api/vehiculos";

    private final HttpClient clienteHttp = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public CompletableFuture<ResultadoConsulta> consultarVehiculos(String jwt) {
        HttpRequest solicitud = HttpRequest.newBuilder(URI.create(URL_API))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + jwt)
                .header("Accept", "application/json")
                .GET()
                .build();

        return clienteHttp.sendAsync(solicitud, HttpResponse.BodyHandlers.ofString())
                .thenApply(respuesta -> {
                    int codigo = respuesta.statusCode();
                    if (codigo != 200) {
                        return new ResultadoConsulta(codigo, List.of());
                    }

                    try {
                        List<Vehiculo> vehiculos = mapper.readValue(
                                respuesta.body(),
                                new TypeReference<List<Vehiculo>>() {}
                        );
                        return new ResultadoConsulta(codigo, vehiculos);
                    } catch (JsonProcessingException ex) {
                        throw new CompletionException(ex);
                    }
                });
    }

    public record ResultadoConsulta(int codigoHttp, List<Vehiculo> vehiculos) {
    }
}


