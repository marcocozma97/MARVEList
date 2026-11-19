package com.marvelist.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    // Tempi massimi per le chiamate esterne (relay delle mail, J.A.I.R.V.I.S., TMDB, notizie):
    // senza limiti una chiamata bloccata teneva occupata per sempre una connessione al database
    // (registrazione e recupero password inviano la mail dentro una transazione)
    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    static final Duration READ_TIMEOUT = Duration.ofSeconds(45);

    @Bean
    public RestTemplate restTemplate() {
        // Stessa factory di prima: le POST non seguono il redirect (il relay di Apps Script lo richiede)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT);
        factory.setReadTimeout(READ_TIMEOUT);
        return new RestTemplate(factory);
    }
}
