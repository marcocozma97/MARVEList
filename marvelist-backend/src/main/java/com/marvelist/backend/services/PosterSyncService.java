package com.marvelist.backend.services;

import com.marvelist.backend.entities.Media;
import com.marvelist.backend.repositories.MediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Sincronizzazione automatica con TMDB: all'avvio, in background, completa locandine
// e durate mancanti.
@Service
@RequiredArgsConstructor
public class PosterSyncService {

    private final MediaRepository mediaRepository;
    private final RestTemplate restTemplate;

    @Value("${tmdb.api.url}")
    private String baseUrl;

    @Value("${tmdb.api.key}")
    private String apiKey;

    // Minuti minimi tra due controlli delle date dei titoli in arrivo (per non interrogare TMDB a ogni richiesta)
    @Value("${marvelist.upcoming-refresh-minutes:60}")
    private long upcomingRefreshMinutes;
    private final AtomicBoolean upcomingRefreshRunning = new AtomicBoolean(false);
    private volatile Instant lastUpcomingRefresh = Instant.EPOCH;

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        CompletableFuture.runAsync(() -> {
            syncMissingData(); // comprende anche le date dei titoli in arrivo
            lastUpcomingRefresh = Instant.now();
        });
    }

    // Ogni giorno alle 5:00 si ricontrollano su TMDB le date di uscita dei titoli in arrivo
    @Scheduled(cron = "0 0 5 * * *")
    public void dailyUpcomingRefresh() {
        refreshUpcomingDates();
    }

    // Chiamato quando l'app carica il catalogo: se è passata più di un'ora dall'ultimo controllo
    // lo rifà in background, così una data appena annunciata compare al primo refresh dell'app
    public void refreshUpcomingIfStale() {
        if (Duration.between(lastUpcomingRefresh, Instant.now()).toMinutes() >= upcomingRefreshMinutes) {
            CompletableFuture.runAsync(this::refreshUpcomingDates);
        }
    }

    private void refreshUpcomingDates() {
        if (!upcomingRefreshRunning.compareAndSet(false, true)) return; // un controllo alla volta
        try {
            lastUpcomingRefresh = Instant.now();
            List<Media> upcoming = mediaRepository.findAll().stream()
                    .filter(m -> m.getSortOrder() != null && Boolean.TRUE.equals(m.getUpcoming()))
                    .toList();
            int changed = 0;
            for (Media media : upcoming) {
                LocalDate before = media.getReleaseDate();
                try {
                    if (media.getTmdbId() == null) {
                        syncMedia(media); // prima va trovato su TMDB (include anche la data)
                    } else {
                        refreshReleaseDate(media, media.getTmdbId(), "FILM".equals(media.getType()));
                        mediaRepository.save(media);
                    }
                    if (!java.util.Objects.equals(before, media.getReleaseDate())) changed++;
                    Thread.sleep(120);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                } catch (Exception e) {
                    System.err.println("Controllo data di uscita fallito per '" + media.getTitle() + "': " + e.getMessage());
                }
            }
            if (changed > 0) System.out.println("--- DATE DI USCITA AGGIORNATE DA TMDB: " + changed + " TITOLI ---");
        } finally {
            upcomingRefreshRunning.set(false);
        }
    }

    private void syncMissingData() {
        // Mancano locandina/durata, c'è solo una locandina provvisoria (URL completo da Wikipedia)
        // oppure il titolo è "in arrivo" (la data di uscita può cambiare: la riprendiamo a ogni avvio)
        List<Media> toSync = mediaRepository.findAll().stream()
                .filter(m -> m.getSortOrder() != null)
                .filter(m -> m.getPosterPath() == null || isProvisional(m.getPosterPath())
                        || ("FILM".equals(m.getType()) && m.getRuntime() == null)
                        || Boolean.TRUE.equals(m.getUpcoming()))
                .toList();
        if (toSync.isEmpty()) return;

        System.out.println("--- SYNC TMDB: " + toSync.size() + " TITOLI DA COMPLETARE ---");
        int updated = 0;
        for (Media media : toSync) {
            try {
                if (syncMedia(media)) updated++;
                Thread.sleep(120); // Restiamo ampiamente sotto il rate limit di TMDB
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception e) {
                System.err.println("Sync TMDB fallita per '" + media.getTitle() + "': " + e.getMessage());
            }
        }
        System.out.println("--- SYNC TMDB COMPLETATA: " + updated + " TITOLI AGGIORNATI ---");
    }

    @SuppressWarnings("unchecked")
    private boolean syncMedia(Media media) {
        boolean isFilm = "FILM".equals(media.getType());
        String endpoint = isFilm ? "movie" : "tv";

        Long tmdbId = media.getTmdbId();
        String posterPath = null;
        if (tmdbId == null) {
            // Prima con l'anno, poi senza: in entrambi i casi accettiamo solo risultati con un anno compatibile
            Map<String, Object> result = search(media, endpoint, true);
            if (result == null) result = search(media, endpoint, false);
            if (result == null) return applyProvisionalPoster(media);
            tmdbId = ((Number) result.get("id")).longValue();
            posterPath = (String) result.get("poster_path");
        }

        Integer runtime = null;
        if (posterPath == null || (isFilm && media.getRuntime() == null)) {
            String url = UriComponentsBuilder.fromUriString(baseUrl + "/" + endpoint + "/" + tmdbId)
                    .queryParam("api_key", apiKey)
                    .queryParam("language", "it-IT")
                    .toUriString();
            Map<String, Object> details = restTemplate.getForObject(url, Map.class);
            if (details == null) return false;
            if (posterPath == null) posterPath = (String) details.get("poster_path");
            if (details.get("runtime") instanceof Number n && n.intValue() > 0) runtime = n.intValue();
        }

        media.setTmdbId(tmdbId);
        if (posterPath != null && (media.getPosterPath() == null || isProvisional(media.getPosterPath()))) {
            media.setPosterPath(posterPath); // La locandina TMDB sostituisce sempre quella provvisoria
        }
        if (runtime != null && media.getRuntime() == null) media.setRuntime(runtime);
        if (Boolean.TRUE.equals(media.getUpcoming())) refreshReleaseDate(media, tmdbId, isFilm);
        mediaRepository.save(media);
        if (media.getPosterPath() == null) applyProvisionalPoster(media);
        return true;
    }

    // Data di uscita di un titolo in arrivo: film -> release_date; stagione N di una serie -> air_date
    // della stagione (first_air_date è l'inizio della serie, non della stagione); altrimenti first_air_date.
    @SuppressWarnings("unchecked")
    private void refreshReleaseDate(Media media, Long tmdbId, boolean isFilm) {
        Matcher season = SEASON.matcher(media.getTitle());
        boolean laterSeason = !isFilm && season.find() && !"1".equals(season.group(2));
        String path = isFilm ? "/movie/" + tmdbId : laterSeason ? "/tv/" + tmdbId + "/season/" + season.group(2) : "/tv/" + tmdbId;
        String url = UriComponentsBuilder.fromUriString(baseUrl + path).queryParam("api_key", apiKey).queryParam("language", "it-IT").toUriString();
        try {
            Map<String, Object> details = restTemplate.getForObject(url, Map.class);
            if (details == null) return;
            Object date = details.get(isFilm ? "release_date" : laterSeason ? "air_date" : "first_air_date");
            if (date instanceof String d && d.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) {
                LocalDate parsed = LocalDate.parse(d);
                // Accettiamo la data solo se è coerente con l'anno del JSON (evita date di altre stagioni/titoli)
                if (media.getReleaseYear() == null || Math.abs(parsed.getYear() - media.getReleaseYear()) <= 1) {
                    media.setReleaseDate(parsed);
                }
            }
        } catch (Exception e) {
            System.err.println("Data di uscita non trovata per '" + media.getTitle() + "': " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> search(Media media, String endpoint, boolean withYear) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(baseUrl + "/search/" + endpoint)
                .queryParam("api_key", apiKey)
                .queryParam("query", baseTitle(media.getTitle()))
                .queryParam("language", "it-IT");
        if (withYear && media.getReleaseYear() != null) {
            builder.queryParam("movie".equals(endpoint) ? "primary_release_year" : "first_air_date_year", media.getReleaseYear());
        }

        Map<String, Object> response = restTemplate.getForObject(builder.encode().build().toUri(), Map.class);
        if (response == null || !(response.get("results") instanceof List<?> results)) return null;
        for (Object item : results) {
            Map<String, Object> result = (Map<String, Object>) item;
            String date = (String) result.getOrDefault("movie".equals(endpoint) ? "release_date" : "first_air_date", "");
            if (isPlausibleYear(media, date)) return result;
        }
        return null;
    }

    // Evita abbinamenti sbagliati (es. "Zodiac" 2028 -> "I Cavalieri dello Zodiaco" 2019):
    // film e prime stagioni entro un anno; per la stagione N la serie può essere iniziata prima
    static boolean isPlausibleYear(Media media, String date) {
        if (media.getReleaseYear() == null || date == null || date.length() < 4) return false;
        int year;
        try { year = Integer.parseInt(date.substring(0, 4)); } catch (NumberFormatException e) { return false; }
        Matcher season = SEASON.matcher(media.getTitle());
        boolean laterSeason = "SERIE_TV".equals(media.getType()) && season.find() && !"1".equals(season.group(2));
        return laterSeason ? year <= media.getReleaseYear() + 1 : Math.abs(year - media.getReleaseYear()) <= 1;
    }

    // --- LOCANDINA PROVVISORIA DA WIKIPEDIA (se TMDB non ha nulla) ---
    // Se anche Wikipedia non trova una pagina compatibile, il frontend mostra il simbolo CSS del titolo.
    private boolean applyProvisionalPoster(Media media) {
        if (media.getPosterPath() != null) return false;
        boolean isFilm = "FILM".equals(media.getType());
        String image = findWikipediaImage("it", media, isFilm ? "film" : "serie televisiva");
        if (image == null) image = findWikipediaImage("en", media, isFilm ? "film" : "TV series");
        if (image == null) return false;
        media.setPosterPath(image);
        mediaRepository.save(media);
        return true;
    }

    @SuppressWarnings("unchecked")
    private String findWikipediaImage(String lang, Media media, String kind) {
        try {
            String title = baseTitle(media.getTitle());
            URI url = UriComponentsBuilder.fromUriString("https://" + lang + ".wikipedia.org/w/api.php")
                    .queryParam("action", "query")
                    .queryParam("format", "json")
                    .queryParam("generator", "search")
                    .queryParam("gsrsearch", title + " Marvel " + kind + " " + media.getReleaseYear())
                    .queryParam("gsrlimit", 5)
                    .queryParam("prop", "pageimages|description")
                    .queryParam("piprop", "original")
                    .queryParam("pilicense", "any") // anche le locandine non libere, che su Wikipedia sono la norma
                    .encode().build().toUri(); // URI già codificato: RestTemplate non lo ricodifica
            HttpHeaders headers = new HttpHeaders();
            // Wikimedia rifiuta (429) i client senza un riferimento di contatto nello User-Agent
            headers.set("User-Agent", "MarvelistApp/1.0 (https://github.com/marvelist; capstone-project)");
            Map<String, Object> body = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();
            if (body == null || !(body.get("query") instanceof Map<?, ?> query) || !(query.get("pages") instanceof Map<?, ?> pages)) return null;

            // "Marvel Zombies - The Winter Soldier" -> "Marvel Zombies": la locandina della serie va bene come provvisoria
            String wanted = normalize(title.split("\\s+-\\s+|:\\s+")[0]);
            return pages.values().stream()
                    .map(p -> (Map<String, Object>) p)
                    .sorted(Comparator.comparingInt(p -> ((Number) p.getOrDefault("index", 99)).intValue()))
                    .filter(p -> normalize((String) p.get("title")).contains(wanted))
                    // La pagina deve parlare di un film/serie, non di un personaggio o di un fumetto
                    .filter(p -> MEDIA_DESCRIPTION.matcher(String.valueOf(p.getOrDefault("description", ""))).find())
                    .map(p -> p.get("original") instanceof Map<?, ?> original ? (String) original.get("source") : null)
                    .map(src -> src == null ? null : src.split("\\?")[0]) // via i parametri di tracking "?utm_..."
                    .filter(src -> src != null && src.matches("(?i).+\\.(jpe?g|png|webp)$"))
                    .findFirst().orElse(null);
        } catch (Exception e) {
            System.err.println("Ricerca Wikipedia fallita per '" + media.getTitle() + "': " + e.getMessage());
            return null;
        }
    }

    private static final Pattern SEASON = Pattern.compile("(?i)\\s+(Season|S\\.)\\s*(\\d+)$");
    private static final Pattern MEDIA_DESCRIPTION = Pattern.compile("(?i)film|serie|series|televis|animat|cortometraggio|short");

    // "Loki Season 2" -> "Loki": TMDB e Wikipedia hanno una sola scheda per tutte le stagioni
    private static String baseTitle(String title) {
        return SEASON.matcher(title).replaceAll("");
    }

    private static String normalize(String s) {
        return s == null ? "" : s.toLowerCase().replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    }

    private static boolean isProvisional(String posterPath) {
        return posterPath != null && posterPath.startsWith("http");
    }
}
