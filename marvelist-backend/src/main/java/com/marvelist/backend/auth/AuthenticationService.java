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
        String email = request.getEmail().trim();

        var existing = repository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.isEnabled()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email già in uso");
            }
            // Registrato ma mai confermato: nuovo link, i dati della prima registrazione restano quelli
            sendVerification(user, origin);
            return "Questa email è già registrata ma non ancora confermata: ti abbiamo inviato un nuovo link a " + email;
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
        return "Ti abbiamo inviato una mail a " + email + ": clicca sul link per attivare l'account";
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

    private void sendVerification(User user, String origin) {
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(verificationExpirationHours));
        repository.save(user);
        emailService.sendVerificationEmail(user, origin);
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // Verifica delle credenziali in automatico (account non confermato -> DisabledException)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(); // Non dovrebbe mai succedere se l'autenticazione passa

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
