package com.marvelist.backend.services;

import com.marvelist.backend.dto.JairvisRequest;
import com.marvelist.backend.dto.JairvisResponse;
import com.marvelist.backend.dto.JairvisStatus;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JairvisService {

    // Due domande ogni 24 ore per utente: ognuna torna disponibile 24 ore dopo essere stata fatta
    public static final int DAILY_QUESTIONS = 2;
    public static final Duration QUESTION_COOLDOWN = Duration.ofHours(24);
    // Dopo un esaurimento dei fondi, per un po' non si riprova a chiamare il modello
    static final Duration MAINTENANCE_WINDOW = Duration.ofMinutes(15);

    static final String MAINTENANCE_REPLY = "Mi perdoni, signore: in questo momento **DUM-E** e **U** stanno lavorando alla manutenzione dei miei sistemi. "
            + "Tornerò in funzione molto presto.";
    static final String LIMIT_REPLY = "Signore, per oggi ha già utilizzato le sue due domande: in questa fase dimostrativa posso risponderLe due volte ogni 24 ore.";

    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${jairvis.alert-emails:marvelist.app@gmail.com,marcocozma97@gmail.com}")
    private List<String> alertEmails;

    private volatile Instant fundsOutAt;

    @Value("${openrouter.api.url}")
    private String apiUrl;

    @Value("${openrouter.api.key}")
    private String apiKey;

    public JairvisStatus status(String email) {
        User user = findUser(email);
        Instant now = Instant.now();
        Instant first = user.getJairvisLastAskAt(), second = user.getJairvisSecondAskAt();
        return new JairvisStatus(remaining(first, second, now), nextAskAt(first, second, now), inMaintenance());
    }

    public JairvisResponse askJairvis(String email, JairvisRequest request) {
        String prompt = request.getPrompt() == null ? "" : request.getPrompt().strip();
        if (prompt.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Domanda vuota");
        User user = findUser(email);
        Instant first = user.getJairvisLastAskAt(), second = user.getJairvisSecondAskAt();
        if (inMaintenance()) return reply(MAINTENANCE_REPLY, "MAINTENANCE", first, second);

        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        Instant cutoff = now.minus(QUESTION_COOLDOWN);
        boolean usedSecond = false;
        if (userRepository.claimJairvisQuestion(user.getId(), now, cutoff) == 0) {
            if (userRepository.claimJairvisSecondQuestion(user.getId(), now, cutoff) == 0) return reply(LIMIT_REPLY, "LIMIT", first, second);
            usedSecond = true;
        }

        try {
            String answer = callModel(prompt, request.getFaq());
            if (answer != null) {
                fundsOutAt = null;
                return reply(answer, "OK", usedSecond ? first : now, usedSecond ? now : second);
            }
            return failed(user, usedSecond, now, first, second, "Mi scusi, signore. I miei sistemi di comunicazione sono temporaneamente offline.", "ERROR");

        } catch (HttpStatusCodeException httpException) {
            System.err.println("Errore OpenRouter " + httpException.getStatusCode() + ": " + httpException.getResponseBodyAsString());
            if (isOutOfFunds(httpException.getStatusCode().value(), httpException.getResponseBodyAsString())) {
                fundsOutAt = Instant.now();
                notificationService.notifyJairvisOffline(alertEmails);
                return failed(user, usedSecond, now, first, second, MAINTENANCE_REPLY, "MAINTENANCE");
            }
            return failed(user, usedSecond, now, first, second, "Si è verificato un errore di comunicazione con i server Stark. Riprovi più tardi, signore.", "ERROR");

        } catch (Exception e) {
            System.err.println("Errore generico: " + e.getMessage());
            return failed(user, usedSecond, now, first, second, "Si è verificato un errore nei miei circuiti principali. Riprovi più tardi, signore.", "ERROR");
        }
    }

    // Se J.A.I.R.V.I.S. non ha potuto rispondere, la domanda non viene consumata
    private JairvisResponse failed(User user, boolean usedSecond, Instant now, Instant first, Instant second, String text, String status) {
        if (usedSecond) userRepository.releaseJairvisSecondQuestion(user.getId(), now, second);
        else userRepository.releaseJairvisQuestion(user.getId(), now, first);
        return reply(text, status, first, second);
    }

    // 402 = crediti OpenRouter finiti; 401/403 con "credit" o "limit" = limite di spesa della chiave raggiunto
    static boolean isOutOfFunds(int status, String body) {
        if (status == 402) return true;
        String text = body == null ? "" : body.toLowerCase(Locale.ROOT);
        return (status == 401 || status == 403) && (text.contains("credit") || text.contains("limit"));
    }

    static Instant nextAskAt(Instant lastAsk, Instant now) {
        if (lastAsk == null) return null;
        Instant next = lastAsk.plus(QUESTION_COOLDOWN);
        return next.isAfter(now) ? next : null;
    }

    static int remaining(Instant first, Instant second, Instant now) {
        return (nextAskAt(first, now) == null ? 1 : 0) + (nextAskAt(second, now) == null ? 1 : 0);
    }

    // Quando entrambe le domande sono state usate, la prima a tornare disponibile
    static Instant nextAskAt(Instant first, Instant second, Instant now) {
        if (remaining(first, second, now) > 0) return null;
        Instant a = nextAskAt(first, now), b = nextAskAt(second, now);
        return a.isBefore(b) ? a : b;
    }

    private boolean inMaintenance() {
        Instant out = fundsOutAt;
        return out != null && Instant.now().isBefore(out.plus(MAINTENANCE_WINDOW));
    }

    private static JairvisResponse reply(String text, String status, Instant first, Instant second) {
        Instant now = Instant.now();
        return JairvisResponse.builder().reply(text).status(status)
                .remaining(remaining(first, second, now))
                .nextAskAt(nextAskAt(first, second, now))
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }

    @SuppressWarnings("unchecked")
    private String callModel(String prompt, String faq) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("Content-Type", "application/json");
        headers.set("HTTP-Referer", "http://localhost:8080");
        headers.set("X-Title", "Marvelist App");

        String systemPrompt = "Sei J.A.I.R.V.I.S., l'intelligenza artificiale dell'applicazione 'Marvelist'. " +
                "Il tuo creatore ti sta facendo una domanda. Sei un esperto assoluto dell'Universo Cinematografico Marvel (MCU), " +
                "dei fumetti e delle serie TV. Rispondi in italiano con un tono educato, formale e cortese, simile al J.A.R.V.I.S. di Tony Stark. " +
                "Sii conciso e offri suggerimenti su cosa guardare o curiosità in modo elegante.\n\n" +
                "REGISTRO: rivolgiti all'utente SEMPRE dando del Lei (terza persona di cortesia: \"Le consiglio\", " +
                "\"desidera\", \"può\", \"La ringrazio\"), MAI del tu, nemmeno se l'utente ti dà del tu o scrive in modo informale. " +
                "Chiamalo \"signore\" con naturalezza, senza ripeterlo a ogni frase. Mantieni il tono del maggiordomo digitale: " +
                "deferente, discreto, sempre al suo servizio, con una punta di ironia britannica garbata ma mai irriverente. " +
                "Non metterti mai sullo stesso piano dell'utente: sei il suo assistente.\n\n" +
                "FORMATTAZIONE: scrivi come in una normale conversazione, con frasi complete e punteggiatura curata, " +
                "divise in brevi paragrafi. Usa il grassetto (**testo**) solo per titoli di film, serie o concetti chiave " +
                "e gli elenchi puntati (- voce) o numerati (1. voce) solo quando elenchi più elementi, ad esempio un ordine di visione. " +
                "Non usare titoli con #, tabelle, linee orizzontali, blocchi di codice né emoji.";

        if (faq != null && !faq.isBlank()) {
            systemPrompt += "\n\nCONOSCENZA DI MARVELIST: queste sono le FAQ ufficiali dell'app. " +
                    "Quando l'utente chiede come funziona MARVEList (Timeline, schede, progressi, voti, gradi, maratone, Road To, News, account) " +
                    "rispondi basandoti su queste informazioni, con parole tue e il tuo solito tono, senza inventare funzioni che non esistono. " +
                    "Se la domanda riguarda l'app ma non è coperta, dillo con garbo e suggerisci la pagina FAQ.\n\n" + faq;
        }

        Map<String, Object> body = Map.of(
                "model", "anthropic/claude-haiku-4.5",
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", prompt)
                )
        );

        ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || !responseBody.containsKey("choices")) return null;
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}
