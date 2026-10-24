package com.marvelist.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Il nome è obbligatorio")
    private String name;

    @NotBlank(message = "Il cognome è obbligatorio")
    private String surname;

    // @Email da sola accetta anche "nome@dominio": il pattern richiede anche l'estensione (.it, .com...)
    @NotBlank(message = "L'email è obbligatoria")
    @Email(message = "Inserisci un'email valida")
    @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", message = "Inserisci un'email valida")
    private String email;

    // Almeno 6 caratteri, di cui almeno uno speciale (né lettera, né numero, né spazio)
    @NotBlank(message = "La password è obbligatoria")
    @Pattern(regexp = "^(?=.*[^A-Za-z0-9\\s]).{6,}$",
            message = "La password deve avere almeno 6 caratteri, di cui almeno uno speciale")
    private String password;

}
