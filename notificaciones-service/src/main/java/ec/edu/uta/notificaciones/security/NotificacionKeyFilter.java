package ec.edu.uta.notificaciones.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class NotificacionKeyFilter extends OncePerRequestFilter {

    private final List<String> validKeys;

    public NotificacionKeyFilter(@Value("${app.notificacion-key}") String keys) {
        if (keys == null || keys.trim().isEmpty()) {
            throw new IllegalArgumentException("app.notificacion-key no puede estar vacía");
        }
        this.validKeys = Arrays.stream(keys.split(","))
                .map(String::trim)
                .filter(k -> !k.isEmpty())
                .toList();

        for (String k : this.validKeys) {
            if (k.length() < 32) {
                throw new IllegalArgumentException("Clave no cumple los 32 caracteres: " + k);
            }
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws IOException, ServletException {

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        String path = req.getRequestURI();
        if (path.startsWith("/error") || path.startsWith("/actuator") || ("GET".equalsIgnoreCase(req.getMethod()) && path.startsWith("/api/notificaciones"))) {
            chain.doFilter(req, res);
            return;
        }

        // Acepta tanto X-Notification-Key como X-Notificacion-Key
        String h = req.getHeader("X-Notification-Key");
        if (h == null || h.isBlank()) {
            h = req.getHeader("X-Notificacion-Key");
        }

        boolean valid = false;
        if (h != null) {
            byte[] headerBytes = h.getBytes(StandardCharsets.UTF_8);
            for (String key : validKeys) {
                if (MessageDigest.isEqual(key.getBytes(StandardCharsets.UTF_8), headerBytes)) {
                    valid = true;
                    break;
                }
            }
        }

        if (!valid) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/problem+json");
            res.setCharacterEncoding(StandardCharsets.UTF_8.name());
            res.getWriter().write("{\"status\":401,\"title\":\"Clave no valida\"}");
            return;
        }

        chain.doFilter(req, res);
    }
}
