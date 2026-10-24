package com.marvelist.backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class TmdbService {

    private final RestTemplate restTemplate;

    @Value("${tmdb.api.url}")
    private String baseUrl;

    @Value("${tmdb.api.key}")
    private String apiKey;

    // Metodo generico per recuperare i dettagli di un film o di una serie TV in italiano
    public Map getMediaDetails(Long tmdbId, String mediaType) {
        // mediaType deve essere strettamente "movie" o "tv"
        String url = baseUrl + "/" + mediaType + "/" + tmdbId + "?api_key=" + apiKey + "&language=it-IT";

        return restTemplate.getForObject(url, Map.class);
    }
}