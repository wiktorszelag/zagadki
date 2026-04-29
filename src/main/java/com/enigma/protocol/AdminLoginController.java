package com.enigma.protocol;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serwuje stronę logowania dla panelu admin.
 * Sama weryfikacja hasła odbywa się w AdminAuthFilter (POST /admin-login).
 */
@Controller
public class AdminLoginController {

    @GetMapping("/admin-login")
    public String adminLogin() {
        return "forward:/admin-login.html";
    }
}
