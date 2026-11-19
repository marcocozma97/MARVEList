package com.marvelist.backend.services;

import com.marvelist.backend.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final ClassPathResource VERIFICATION_TEMPLATE = new ClassPathResource("templates/email/verification.html");
    private static final ClassPathResource RESET_TEMPLATE = new ClassPathResource("templates/email/password-reset.html");
    private static final ClassPathResource LOGO = new ClassPathResource("static/email/marvelist-logo.png");

    private final RestTemplate restTemplate;

    @Value("${mail.relay.url}")
    private String relayUrl;

    @Value("${mail.relay.secret}")
    private String relaySecret;

    @Value("${application.frontend-url}")
    private String frontendUrl;

    @Value("${application.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${application.verification.expiration-hours}")
    private long verificationExpirationHours;

    // Gli ultimi invii del giorno restano per il recupero password: chi si registra con un dominio noto
    // in quel caso viene attivato senza mail, chi ha dimenticato la password invece non ha alternative
    @Value("${mail.relay.verification-reserve:10}")
    private int verificationReserve;

    public void sendVerificationEmail(User user, String origin) {
        // Il link apre la pagina /verify del frontend, che chiama GET /api/v1/auth/verify?token=...
        String verifyLink = frontendBase(origin) + "/verify?token=" + user.getVerificationToken();
        send(user, "Protocollo MARVEList: Verifica Identità", VERIFICATION_TEMPLATE, verifyLink,
                String.valueOf(verificationExpirationHours), verificationReserve, "di conferma");
    }

    public void sendPasswordResetEmail(User user, String token, String origin, long minutes) {
        // Il link apre la pagina /reset-password del frontend, dove si sceglie la nuova password
        String resetLink = frontendBase(origin) + "/reset-password?token=" + token;
        send(user, "Protocollo MARVEList: Nuova Password", RESET_TEMPLATE, resetLink, String.valueOf(minutes), 0, "di recupero password");
    }

    private void send(User user, String subject, ClassPathResource template, String link, String validity, int reserve, String kind) {
        try {
            // Template HTML in stile J.A.I.R.V.I.S. con i colori Marvel (resources/templates/email)
            String htmlContent = template.getContentAsString(StandardCharsets.UTF_8)
                    .replace("{{name}}", HtmlUtils.htmlEscape(user.getName()))
                    .replace("{{link}}", HtmlUtils.htmlEscape(link))
                    .replace("{{hours}}", validity)
                    .replace("{{minutes}}", validity);

            // Logo allegato inline: i client email non mostrano gli SVG, quindi usiamo il PNG
            String logo = Base64.getEncoder().encodeToString(LOGO.getContentAsByteArray());

            Map<String, Object> body = Map.of(
                    "secret", relaySecret,
                    "to", user.getEmail(),
                    "subject", subject,
                    "html", htmlContent,
                    "logo", logo,
                    "reserve", reserve
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.postForEntity(relayUrl, new HttpEntity<>(body, headers), String.class);
            URI resultUrl = response.getHeaders().getLocation();
            Map<?, ?> result = resultUrl != null ? restTemplate.getForObject(resultUrl, Map.class) : null;

            if (result != null && isQuotaError(String.valueOf(result.get("error")))) {
                System.err.println("Limite giornaliero di Gmail raggiunto: mail " + kind + " non inviata a '" + user.getEmail() + "'");
                throw new EmailQuotaExceededException(String.valueOf(result.get("error")));
            }
            if (result == null || !Boolean.TRUE.equals(result.get("ok"))) {
                throw new RestClientException("Invio non confermato dal relay: " + result);
            }

        } catch (RestClientException | IOException e) {
            // Relay irraggiungibile, chiave errata, ecc.: l'operazione viene annullata
            System.err.println("Invio della mail " + kind + " fallito per '" + user.getEmail() + "': " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Non siamo riusciti a inviare la mail. Riprova tra qualche minuto.", e);
        }
    }

    // Messaggio del relay (docs/mail-relay.gs) o errore di Gmail quando gli invii del giorno sono finiti
    static boolean isQuotaError(String error) {
        return error != null && (error.contains("Limite giornaliero") || error.contains("too many times"));
    }

    // L'Origin arriva dal client e si può falsificare: lo usiamo solo se è tra quelle ammesse dal CORS,
    // altrimenti il link della mail potrebbe portare il token su un sito esterno
    private String frontendBase(String origin) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOriginPatterns(allowedOrigins);
        String allowed = origin == null ? null : cors.checkOrigin(origin);
        return allowed != null ? allowed : frontendUrl;
    }
}
