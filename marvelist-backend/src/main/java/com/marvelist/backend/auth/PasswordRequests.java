package com.marvelist.backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class PasswordRequests {

    private PasswordRequests() {}

    // "Password dimenticata?": email a cui mandare il link
    public record Forgot(@NotBlank(message = "Inserisci la tua email") String email) {}

    // Nuova password scelta dalla pagina aperta dal link nella mail
    public record Reset(
            @NotBlank(message = "Link non valido") String token,
            @NotBlank(message = "La password è obbligatoria")
            @Pattern(regexp = PasswordRules.REGEX, message = PasswordRules.MESSAGE) String password
    ) {}

    // Cambio dal profilo, da loggati: serve la password attuale
    public record Change(
            @NotBlank(message = "Inserisci la password attuale") String currentPassword,
            @NotBlank(message = "La nuova password è obbligatoria")
            @Pattern(regexp = PasswordRules.REGEX, message = PasswordRules.MESSAGE) String newPassword
    ) {}
}
