package com.marvelist.backend.config;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

// Gli errori "previsti" (dati non validi, maratona senza tempo materiale, ecc.) arrivano al frontend
// come {status, message}: il messaggio in italiano viene mostrato così com'è all'utente.
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handle(ResponseStatusException e) {
        String message = e.getReason() != null ? e.getReason() : "Richiesta non valida";
        return body(e.getStatusCode(), message);
    }

    // @Valid fallito: si mostra il primo messaggio dei vincoli (es. password troppo debole)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handle(MethodArgumentNotValidException e) {
        var error = e.getBindingResult().getFieldError();
        return body(HttpStatus.BAD_REQUEST, error != null ? error.getDefaultMessage() : "Dati non validi");
    }

    // Login di un account che non ha ancora confermato la mail
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handle(DisabledException e) {
        return body(HttpStatus.FORBIDDEN, "Account non ancora attivo: conferma la registrazione dal link che ti abbiamo inviato per email. "
                + "Non la trovi (nemmeno nello spam)? Registrati di nuovo con la stessa email per riceverne un'altra.");
    }

    // Database irraggiungibile o sovraccarico: al posto di un 403/500 generico un messaggio chiaro
    // (anche durante il login, dove Spring Security lo avvolge in InternalAuthenticationServiceException)
    @ExceptionHandler({DataAccessException.class, CannotCreateTransactionException.class, InternalAuthenticationServiceException.class})
    public ResponseEntity<Map<String, Object>> handleUnavailable(Exception e) {
        System.err.println("Database non disponibile: " + e.getMessage());
        return body(HttpStatus.SERVICE_UNAVAILABLE, "Servizio momentaneamente non disponibile: riprova tra qualche minuto.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handle(BadCredentialsException e) {
        return body(HttpStatus.UNAUTHORIZED, "Credenziali non valide. Riprova.");
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatusCode status, String message) {
        return ResponseEntity.status(status).body(Map.of("status", status.value(), "message", message));
    }
}
