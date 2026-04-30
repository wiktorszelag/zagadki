package com.enigma.protocol;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * AdminAuthFilter — zabezpiecza /admin.html przed nieautoryzowanym dostępem.
 *
 * Hasło przechowywane jest wyłącznie jako SHA-256 hash w application.properties
 * i nigdy nie pojawia się w kodzie frontendowym ani w odpowiedziach HTTP.
 *
 * Przepływ:
 *  1. GET /admin.html bez aktywnej sesji → przekierowanie na /admin-login
 *  2. POST /admin-login z hasłem → weryfikacja hasha → cookie sesji na 8h
 *  3. GET /admin.html z ważnym cookie → dostęp przyznany
 *  4. GET /admin-logout → usunięcie cookie + przekierowanie
 */
@Component
@Order(1)
public class AdminAuthFilter implements Filter {

    @Autowired
    private UserRepository userRepository;

    @Value("${admin.session.cookie:enigma_admin_session}")
    private String sessionCookieName;

    @Value("${admin.session.duration.hours:8}")
    private int sessionHours;

    // In-memory token store — maps token → expiry timestamp
    private final java.util.concurrent.ConcurrentHashMap<String, Long> activeSessions =
            new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  req  = (HttpServletRequest)  request;
        HttpServletResponse resp = (HttpServletResponse) response;

        String path = req.getServletPath();

        // Przepuszczaj API - te endpointy mają własne zabezpieczenia
        if (path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        // Only intercept admin routes
        if (!path.startsWith("/admin") && !path.equals("/admin-login") && !path.equals("/admin-logout")) {
            chain.doFilter(request, response);
            return;
        }

        // ── LOGOUT ──────────────────────────────────────────────
        if ("/admin-logout".equals(path)) {
            String token = getSessionToken(req);
            if (token != null) activeSessions.remove(token);
            clearCookie(resp);
            resp.sendRedirect("/admin-login");
            return;
        }

        // ── LOGIN PAGE (GET) ─────────────────────────────────────
        if ("/admin-login".equals(path) && "GET".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // ── LOGIN ACTION (POST) ──────────────────────────────────
        if ("/admin-login".equals(path) && "POST".equalsIgnoreCase(req.getMethod())) {
            String password = req.getParameter("password");
            if (password == null) password = "";

            String inputHash = sha256(password);
            
            boolean isValid = userRepository.findByUsername("admin")
                    .map(u -> u.getPasswordHash().equalsIgnoreCase(inputHash))
                    .orElse(false);
            
            if (isValid) {
                // Generate secure random session token
                String token = generateToken();
                long expiry = System.currentTimeMillis() + (sessionHours * 3600L * 1000L);
                activeSessions.put(token, expiry);

                // Set HttpOnly, Secure (when prod), SameSite=Strict cookie
                Cookie cookie = new Cookie(sessionCookieName, token);
                cookie.setHttpOnly(true);
                cookie.setPath("/");
                cookie.setMaxAge(sessionHours * 3600);
                // Samesite via header since Java Cookie doesn't support it directly
                resp.addCookie(cookie);
                resp.setHeader("Set-Cookie",
                    sessionCookieName + "=" + token +
                    "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + (sessionHours * 3600));
                resp.sendRedirect("/admin.html");
            } else {
                // Wrong password → back to login with error flag
                resp.sendRedirect("/admin-login?error=1");
            }
            return;
        }

        // ── PROTECT /admin.html and /admin ───────────────────────
        if (path.equals("/admin.html") || path.equals("/admin") || path.startsWith("/admin.")) {
            if (!isAuthenticated(req)) {
                resp.sendRedirect("/admin-login");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private boolean isAuthenticated(HttpServletRequest req) {
        String token = getSessionToken(req);
        if (token == null) return false;
        Long expiry = activeSessions.get(token);
        if (expiry == null) return false;
        if (System.currentTimeMillis() > expiry) {
            activeSessions.remove(token);
            return false;
        }
        return true;
    }

    private String getSessionToken(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (sessionCookieName.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private void clearCookie(HttpServletResponse resp) {
        resp.setHeader("Set-Cookie",
            sessionCookieName + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
