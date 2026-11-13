package com.marvelist.backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

// Il piano free di Render spegne il backend dopo 15 minuti senza richieste e riaccenderlo richiede minuti.
// Ogni 10 minuti il backend chiama il proprio indirizzo pubblico, così risulta sempre attivo.
// Il ping non tocca il database: Neon si risveglia in meno di un secondo e così non consuma le ore gratuite.
@Service
@RequiredArgsConstructor
public class KeepAliveService {

    private final RestTemplate restTemplate;

    // Su Render RENDER_EXTERNAL_URL è impostata in automatico; in locale è vuota e il ping è spento
    @Value("${keepalive.url:}")
    private String baseUrl;

    @Scheduled(initialDelayString = "PT1M", fixedDelayString = "PT10M")
    public void ping() {
        if (baseUrl == null || baseUrl.isBlank()) return;
        try {
            restTemplate.getForObject(baseUrl.replaceAll("/+$", "") + "/api/v1/ping", String.class);
        } catch (Exception e) {
            System.err.println("Keep-alive non riuscito: " + e.getMessage());
        }
    }
}
