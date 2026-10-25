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

    public void sendVerificationEmail(User user, String origin) {
        try {
            // Il link apre la pagina /verify del frontend, che chiama GET /api/v1/auth/verify?token=...
            String verifyLink = frontendBase(origin) + "/verify?token=" + user.getVerificationToken();

            // Template HTML in stile J.A.I.R.V.I.S. con i colori Marvel (resources/templates/email)
            String htmlContent = VERIFICATION_TEMPLATE.getContentAsString(StandardCharsets.UTF_8)
                    .replace("{{name}}", HtmlUtils.htmlEscape(user.getName()))
                    .replace("{{link}}", HtmlUtils.htmlEscape(verifyLink))
                    .replace("{{hours}}", String.valueOf(verificationExpirationHours));

            // Logo allegato inline: i client email non mostrano gli SVG, quindi usiamo il PNG
            String logo = Base64.getEncoder().encodeToString(LOGO.getContentAsByteArray());

            Map<String, Object> body = Map.of(
                    "secret", relaySecret,
                    "to", user.getEmail(),
                    "subject", "Protocollo MARVEList: Verifica Identità",
                    "html", htmlContent,
                    "logo", logo
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.postForEntity(relayUrl, new HttpEntity<>(body, headers), String.class);
            URI resultUrl = response.getHeaders().getLocation();
            Map<?, ?> result = resultUrl != null ? restTemplate.getForObject(resultUrl, Map.class) : null;

            if (result == null || !Boolean.TRUE.equals(result.get("ok"))) {
                throw new RestClientException("Invio non confermato dal relay: " + result);
            }

        } catch (RestClientException | IOException e) {
            // Relay irraggiungibile, chiave errata, limite di Gmail raggiunto, ecc.: la registrazione viene annullata
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Non siamo riusciti a inviare la mail di conferma. Riprova tra qualche minuto.", e);
        }
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
