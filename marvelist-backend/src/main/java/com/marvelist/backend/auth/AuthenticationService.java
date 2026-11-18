package com.marvelist.backend.auth;

import com.marvelist.backend.entities.Role;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.security.JwtService;
import com.marvelist.backend.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${application.verification.expiration-hours}")
    private long verificationExpirationHours;

    @Value("${application.security.jwt.refresh-grace-days:30}")
    private long refreshGraceDays;

    // Se l'invio della mail fallisce la transazione viene annullata: l'utente non resta "a metà"
    @Transactional
    public String register(RegisterRequest request, String origin) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        var existing = repository.findByEmailForLogin(email);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.isEnabled()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email già in uso");
            }
            // Registrato ma mai confermato: valgono i dati dell'ultima registrazione,
            // altrimenti dopo la conferma la nuova password verrebbe rifiutata
            user.setName(request.getName().trim());
            user.setSurname(request.getSurname().trim());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            sendVerification(user, origin);
            return "Questa email è già registrata ma non ancora confermata: ti abbiamo inviato un nuovo link a " + email
                    + " (controlla anche la cartella spam)";
        }

        // Creazione del nuovo utente, disattivato finché non conferma la mail
        var user = User.builder()
                .name(request.getName().trim())
                .surname(request.getSurname().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .enabled(false)
                .build();

        sendVerification(user, origin);
        return "Ti abbiamo inviato una mail a " + email + ": clicca sul link per attivare l'account (controlla anche la cartella spam)";
    }

    // Conferma la registrazione dal link della mail. Il token non viene cancellato subito:
    // aprire il link una seconda volta risponde "già attivo" invece di dare errore.
    @Transactional
    public String verify(String token) {
        User user = repository.findByVerificationToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link di conferma non valido"));

        if (user.isEnabled()) {
            return "Il tuo account è già attivo: puoi accedere";
        }
        if (user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE,
                    "Il link di conferma è scaduto: registrati di nuovo con la stessa email per riceverne uno nuovo");
        }

        user.setEnabled(true);
        repository.save(user);
        return "Registrazione confermata! Il tuo account è attivo: ora puoi accedere";
    }

    // Un link ancora valido viene riusato: chi si registra due volte può cliccare indifferentemente
    // la prima o la seconda mail (prima la seconda invalidava la prima, che spesso arriva per ultima)
    private void sendVerification(User user, String origin) {
        boolean stillValid = user.getVerificationToken() != null && user.getVerificationTokenExpiresAt() != null
                && user.getVerificationTokenExpiresAt().isAfter(LocalDateTime.now());
        if (!stillValid) {
            user.setVerificationToken(UUID.randomUUID().toString());
        }
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(verificationExpirationHours));
        repository.save(user);
        emailService.sendVerificationEmail(user, origin);
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();

        // Verifica delle credenziali in automatico (account non confermato -> DisabledException)
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        // L'utente è quello trovato dal login, con l'email salvata (che può avere maiuscole diverse da quella digitata)
        var user = (User) authentication.getPrincipal();

        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    // Rinnovo della sessione dal minigioco: un token scaduto ma autentico diventa un nuovo token da 24 ore
    public AuthenticationResponse refresh(String expiredToken) {
        String email = expiredToken == null ? null
                : jwtService.extractUsernameForRefresh(expiredToken, java.time.Duration.ofDays(refreshGraceDays));
        var user = email == null ? null : repository.findByEmail(email).orElse(null);
        if (user == null || !user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessione scaduta da troppo tempo: accedi di nuovo.");
        }
        return AuthenticationResponse.builder()
                .token(jwtService.generateToken(user))
                .build();
    }
}
