package com.enigma.protocol;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String token) {
        String subject = "ENIGMA PROTOCOL - Autoryzacja Konta";
        String confirmationUrl = "https://wsproject.pl/api/auth/verify?token=" + token;
        
        String htmlMessage = "<div style=\"font-family: Arial, sans-serif; background-color: #020a14; color: #c8d8f0; padding: 40px 20px; text-align: center;\">"
                + "<div style=\"max-width: 600px; margin: 0 auto; background-color: #00101e; border: 1px solid #00f5ff; padding: 30px; border-radius: 8px;\">"
                + "<h2 style=\"color: #00f5ff; letter-spacing: 2px; font-family: monospace;\">ENIGMA PROTOCOL</h2>"
                + "<p style=\"font-size: 16px; margin-bottom: 20px;\">Witaj Agencie,</p>"
                + "<p style=\"font-size: 14px; margin-bottom: 30px; line-height: 1.6;\">Została rozpoczęta procedura rejestracji konta w systemie.<br>Aby ukończyć rejestrację i aktywować konto, kliknij w poniższy przycisk:</p>"
                + "<a href=\"" + confirmationUrl + "\" style=\"display: inline-block; background-color: #00f5ff; color: #020a14; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 4px; font-size: 16px; letter-spacing: 1px; margin-bottom: 20px;\">AUTORYZUJ KONTO</a>"
                + "<p style=\"font-size: 12px; margin-top: 20px; color: #88aacc;\">Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br><br><a href=\"" + confirmationUrl + "\" style=\"color: #00f5ff; word-break: break-all;\">" + confirmationUrl + "</a></p>"
                + "<hr style=\"border: none; border-top: 1px solid rgba(0, 245, 255, 0.2); margin: 30px 0;\">"
                + "<p style=\"font-size: 11px; color: #446688;\">Jeśli to nie Ty zgłosiłeś prośbę, zignoruj tę wiadomość.<br><br>=== TRANSMISJA SZYFROWANA ===</p>"
                + "</div></div>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("wsproject@wsproject.pl");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlMessage, true);

            mailSender.send(message);
            System.out.println("E-mail weryfikacyjny wysłany na adres: " + toEmail);
        } catch (Exception e) {
            System.err.println("Błąd podczas wysyłania e-maila (sprawdź konfigurację SMTP): " + e.getMessage());
            System.out.println("UWAGA: Tryb offline. Link aktywacyjny: " + confirmationUrl);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String subject = "ENIGMA PROTOCOL - Reset Hasła";
        String resetUrl = "https://wsproject.pl/api/auth/reset-password?token=" + token;
        
        String htmlMessage = "<div style=\"font-family: Arial, sans-serif; background-color: #020a14; color: #c8d8f0; padding: 40px 20px; text-align: center;\">"
                + "<div style=\"max-width: 600px; margin: 0 auto; background-color: #00101e; border: 1px solid #ff2a2a; padding: 30px; border-radius: 8px;\">"
                + "<h2 style=\"color: #ff2a2a; letter-spacing: 2px; font-family: monospace;\">ZMIANA HASŁA DOSTĘPOWEGO</h2>"
                + "<p style=\"font-size: 16px; margin-bottom: 20px;\">Witaj Agencie,</p>"
                + "<p style=\"font-size: 14px; margin-bottom: 30px; line-height: 1.6;\">Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta w systemie ENIGMA PROTOCOL.<br>Kliknij poniższy przycisk, aby wygenerować nowe hasło:</p>"
                + "<a href=\"" + resetUrl + "\" style=\"display: inline-block; background-color: #ff2a2a; color: #fff; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 4px; font-size: 16px; letter-spacing: 1px; margin-bottom: 20px;\">ZRESETUJ HASŁO</a>"
                + "<p style=\"font-size: 12px; margin-top: 20px; color: #88aacc;\">Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br><br><a href=\"" + resetUrl + "\" style=\"color: #ff2a2a; word-break: break-all;\">" + resetUrl + "</a></p>"
                + "<hr style=\"border: none; border-top: 1px solid rgba(255, 42, 42, 0.2); margin: 30px 0;\">"
                + "<p style=\"font-size: 11px; color: #446688;\">Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość - Twoje konto jest bezpieczne.<br><br>=== TRANSMISJA SZYFROWANA ===</p>"
                + "</div></div>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("wsproject@wsproject.pl");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlMessage, true);

            mailSender.send(message);
            System.out.println("E-mail resetu hasła wysłany na adres: " + toEmail);
        } catch (Exception e) {
            System.err.println("Błąd podczas wysyłania e-maila: " + e.getMessage());
            System.out.println("UWAGA: Tryb offline. Link resetu hasła: " + resetUrl);
        }
    }
}
