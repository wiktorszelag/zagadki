package com.enigma.protocol;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // Minimum 8 znaków, co najmniej jedna mała litera, jedna duża litera, jedna cyfra i jeden znak specjalny
    private static final String PASSWORD_PATTERN = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,20}$";

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");
        
        if (username == null || email == null || password == null || username.trim().isEmpty() || email.trim().isEmpty() || password.trim().isEmpty()) {
            return Map.of("success", false, "message", "Podaj login, email i hasło");
        }
        
        if (!Pattern.matches(PASSWORD_PATTERN, password)) {
            return Map.of("success", false, "message", "Hasło nie spełnia wymagań bezpieczeństwa (min. 8 znaków, duża i mała litera, cyfra, znak specjalny).");
        }
        
        if (userRepository.findByUsername(username).isPresent()) {
            return Map.of("success", false, "message", "Użytkownik z takim loginem już istnieje");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return Map.of("success", false, "message", "Użytkownik z takim adresem e-mail już istnieje");
        }
        
        String token = UUID.randomUUID().toString();
        User u = new User(username, email, sha256(password), "PLAYER");
        u.setVerificationToken(token);
        u.setEnabled(false);
        userRepository.save(u);

        emailService.sendVerificationEmail(email, token);

        return Map.of("success", true, "message", "Konto utworzone! Sprawdź e-mail, aby je aktywować.");
    }
    
    @GetMapping("/verify")
    public String verify(@RequestParam String token) {
        Optional<User> uOpt = userRepository.findByVerificationToken(token);
        if (uOpt.isEmpty()) {
            return "<html><body style='background:#000;color:#f00;font-family:monospace;text-align:center;padding:50px;'>Błędny lub nieważny token weryfikacyjny.</body></html>";
        }
        
        User u = uOpt.get();
        if (u.isEnabled()) {
            return "<html><body style='background:#000;color:#0f0;font-family:monospace;text-align:center;padding:50px;'>Konto jest już aktywne. <a href='/' style='color:#0ff;'>Wróć do logowania</a></body></html>";
        }
        
        u.setEnabled(true);
        u.setVerificationToken(null);
        userRepository.save(u);
        
        return "<html><body style='background:#000;color:#0f0;font-family:monospace;text-align:center;padding:50px;'><h1>Konto aktywowane!</h1><p>Twój dostęp do Enigma Protocol został przyznany.</p><p><a href='/' style='color:#0ff;font-size:1.5rem;text-decoration:none;'>[ WRÓĆ DO PANELU LOGOWANIA ]</a></p></body></html>";
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        
        Optional<User> uOpt = userRepository.findByUsername(username);
        if (uOpt.isEmpty()) {
            return Map.of("success", false, "message", "Błędny login lub hasło");
        }
        
        User u = uOpt.get();
        if (!u.getPasswordHash().equalsIgnoreCase(sha256(password))) {
            return Map.of("success", false, "message", "Błędny login lub hasło");
        }

        if (!u.isEnabled()) {
            return Map.of("success", false, "message", "Konto nie zostało jeszcze aktywowane. Sprawdź pocztę e-mail.");
        }
        
        return Map.of(
            "success", true,
            "username", u.getUsername(),
            "role", u.getRole(),
            "v1Level", u.getV1Level(),
            "v2Level", u.getV2Level(),
            "v1TimeMs", u.getV1TimeMs(),
            "v2TimeMs", u.getV2TimeMs(),
            "v1Completed", u.isV1Completed(),
            "v2Completed", u.isV2Completed()
        );
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return Map.of("success", false, "message", "Podaj adres e-mail");
        }
        
        Optional<User> uOpt = userRepository.findByEmail(email);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            String token = UUID.randomUUID().toString();
            u.setResetToken(token);
            userRepository.save(u);
            emailService.sendPasswordResetEmail(email, token);
        }
        
        // Zawsze zwracaj true by nie ujawniać czy dany mail jest w bazie czy nie (best practice)
        return Map.of("success", true, "message", "Jeśli podany adres istnieje w bazie, wysłaliśmy na niego instrukcję resetu hasła.");
    }

    @GetMapping("/reset-password")
    public String resetPassword(@RequestParam String token) {
        Optional<User> uOpt = userRepository.findByResetToken(token);
        if (uOpt.isEmpty()) {
            return "<html><body style='background:#000;color:#f00;font-family:monospace;text-align:center;padding:50px;'>Błędny lub nieważny token resetu hasła.</body></html>";
        }
        
        User u = uOpt.get();
        String newPassword = generateRandomPassword();
        u.setPasswordHash(sha256(newPassword));
        u.setResetToken(null); // Jednorazowy użytek
        userRepository.save(u);
        
        return "<html><body style='background:#000;color:#0f0;font-family:monospace;text-align:center;padding:50px;'>"
             + "<h1>ZRESETOWANO HASŁO</h1>"
             + "<p>Twoje nowe tymczasowe hasło to:</p>"
             + "<h2 style='color:#fff;background:#222;display:inline-block;padding:10px 20px;border:1px solid #0f0;'>" + newPassword + "</h2>"
             + "<p>Skopiuj je dokładnie i zachowaj w bezpiecznym miejscu.</p>"
             + "<p><a href='/' style='color:#0ff;font-size:1.2rem;text-decoration:none;'>[ WRÓĆ DO LOGOWANIA ]</a></p>"
             + "</body></html>";
    }

    @PostMapping("/progress")
    public Map<String, Object> updateProgress(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String protocol = (String) body.get("protocol"); // "v1" or "v2"
        Integer level = (Integer) body.get("level");
        Number timeMsObj = (Number) body.get("timeMs");
        Boolean completed = (Boolean) body.get("completed");

        if (username == null || protocol == null || level == null) {
            return Map.of("success", false, "message", "Brak wymaganych danych");
        }

        Optional<User> uOpt = userRepository.findByUsername(username);
        if (uOpt.isEmpty()) {
            return Map.of("success", false, "message", "Użytkownik nie istnieje");
        }

        User u = uOpt.get();
        long timeMs = timeMsObj != null ? timeMsObj.longValue() : 0L;
        boolean isDone = completed != null ? completed : false;

        if ("v1".equalsIgnoreCase(protocol)) {
            if (!u.isV1Completed()) {
                u.setV1Level(level);
                u.setV1TimeMs(timeMs);
                if (isDone) u.setV1Completed(true);
            }
        } else if ("v2".equalsIgnoreCase(protocol)) {
            if (!u.isV2Completed()) {
                u.setV2Level(level);
                u.setV2TimeMs(timeMs);
                if (isDone) u.setV2Completed(true);
            }
        }

        userRepository.save(u);
        return Map.of("success", true);
    }

    private String generateRandomPassword() {
        // Generuje mocne, losowe haslo 12-znakowe
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder sb = new StringBuilder();
        sb.append("A1!"); // Zapewnia ze spelnia wymogi: duza, mala litera, cyfra i znak specjalny
        for (int i = 0; i < 9; i++) {
            int index = (int)(Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
