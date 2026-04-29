package com.enigma.protocol;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String token) {
        String subject = "ENIGMA PROTOCOL - Autoryzacja Konta";
        String confirmationUrl = "https://wsproject.pl/api/auth/verify?token=" + token;
        
        String message = "Witaj Agencie,\n\n"
                + "Została rozpoczęta procedura rejestracji konta w systemie ENIGMA PROTOCOL.\n"
                + "Aby ukończyć rejestrację i aktywować konto, kliknij w poniższy link autoryzacyjny:\n\n"
                + confirmationUrl + "\n\n"
                + "Jeśli to nie Ty zgłosiłeś prośbę, zignoruj tę wiadomość.\n\n"
                + "=== TRANSMISJA SZYFROWANA ===";

        SimpleMailMessage email = new SimpleMailMessage();
        email.setTo(toEmail);
        email.setSubject(subject);
        email.setText(message);
        
        // Zabezpieczenie na wypadek braku konfiguracji SMTP podczas dewelopmentu
        try {
            mailSender.send(email);
            System.out.println("E-mail weryfikacyjny wysłany na adres: " + toEmail);
        } catch (Exception e) {
            System.err.println("Błąd podczas wysyłania e-maila (sprawdź konfigurację SMTP): " + e.getMessage());
            System.out.println("UWAGA: Tryb offline. Link aktywacyjny: " + confirmationUrl);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String subject = "ENIGMA PROTOCOL - Reset Hasła";
        String resetUrl = "https://wsproject.pl/api/auth/reset-password?token=" + token;
        
        String message = "Witaj Agencie,\n\n"
                + "Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta.\n"
                + "Kliknij poniższy link, aby wygenerować nowe hasło dostępowe:\n\n"
                + resetUrl + "\n\n"
                + "Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość - Twoje konto jest bezpieczne.\n\n"
                + "=== TRANSMISJA SZYFROWANA ===";

        SimpleMailMessage email = new SimpleMailMessage();
        email.setTo(toEmail);
        email.setSubject(subject);
        email.setText(message);
        
        try {
            mailSender.send(email);
            System.out.println("E-mail resetu hasła wysłany na adres: " + toEmail);
        } catch (Exception e) {
            System.err.println("Błąd podczas wysyłania e-maila: " + e.getMessage());
            System.out.println("UWAGA: Tryb offline. Link resetu hasła: " + resetUrl);
        }
    }
}
