package com.marvelist.backend.services;

import com.marvelist.backend.dto.JairvisRequest;
import com.marvelist.backend.dto.JairvisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JairvisService {

    private final RestTemplate restTemplate;

    @Value("${openrouter.api.url}")
    private String apiUrl;

    @Value("${openrouter.api.key}")
    private String apiKey;

    public JairvisResponse askJairvis(JairvisRequest request) {
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

        if (request.getFaq() != null && !request.getFaq().isBlank()) {
            systemPrompt += "\n\nCONOSCENZA DI MARVELIST: queste sono le FAQ ufficiali dell'app. " +
                    "Quando l'utente chiede come funziona MARVEList (Timeline, schede, progressi, voti, gradi, maratone, Road To, News, account) " +
                    "rispondi basandoti su queste informazioni, con parole tue e il tuo solito tono, senza inventare funzioni che non esistono. " +
                    "Se la domanda riguarda l'app ma non è coperta, dillo con garbo e suggerisci la pagina FAQ.\n\n" + request.getFaq();
        }

        Map<String, Object> body = Map.of(
                "model", "anthropic/claude-haiku-4.5",
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", request.getPrompt())
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                String replyText = (String) message.get("content");

                return JairvisResponse.builder().reply(replyText).build();
            }

            return JairvisResponse.builder().reply("Mi scusi, signore. I miei sistemi di comunicazione sono temporaneamente offline.").build();

        } catch (HttpStatusCodeException httpException) {
            System.err.println("Errore OpenRouter " + httpException.getStatusCode() + ": " + httpException.getResponseBodyAsString());
            return JairvisResponse.builder().reply("Si è verificato un errore di comunicazione. Le suggerisco di controllare la console di IntelliJ, signore.").build();

        } catch (Exception e) {
            System.err.println("Errore generico: " + e.getMessage());
            return JairvisResponse.builder().reply("Si è verificato un errore nei miei circuiti principali. Riprovi più tardi, signore.").build();
        }
    }
}