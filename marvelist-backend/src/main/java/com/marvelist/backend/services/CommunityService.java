package com.marvelist.backend.services;

import com.marvelist.backend.repositories.EpisodeRatingRepository;
import com.marvelist.backend.repositories.UserProgressRepository;
import com.marvelist.backend.repositories.WatchEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

// Voto MARVEList (media dei voti di tutti gli utenti) e classifiche della pagina Community
@Service
@RequiredArgsConstructor
public class CommunityService {

    static final int TOP_SIZE = 10;
    static final Duration WEEK = Duration.ofDays(7);
    static final long MIN_VOTES = 5; // voti minimi per entrare nella Top 10 più votati

    private final UserProgressRepository progressRepository;
    private final EpisodeRatingRepository episodeRatingRepository;
    private final WatchEventRepository watchEventRepository;

    public record Rating(Double average, long count) {}

    public record MediaRatings(Rating rating, Map<Integer, Rating> episodes) {}

    public record TopWatched(Long mediaId, long users) {}

    public record TopRated(Long mediaId, double average, long count) {}

    // Classifiche ricalcolate ogni ora: tutti vedono la stessa versione fino al prossimo aggiornamento
    public record Rankings(List<TopWatched> topWatched, List<TopRated> topRated, Instant updatedAt) {}

    private volatile Rankings rankings = new Rankings(List.of(), List.of(), null);

    @Transactional(readOnly = true)
    public MediaRatings ratings(Long mediaId) {
        Object[] row = progressRepository.averageRating(mediaId).stream().findFirst().orElse(new Object[]{null, 0L});
        Map<Integer, Rating> episodes = new TreeMap<>();
        for (Object[] r : episodeRatingRepository.averageByEpisode(mediaId)) {
            episodes.put(((Number) r[0]).intValue(), new Rating(round(r[1]), ((Number) r[2]).longValue()));
        }
        return new MediaRatings(new Rating(round(row[0]), row[1] == null ? 0 : ((Number) row[1]).longValue()), episodes);
    }

    public Rankings rankings() {
        return rankings;
    }

    // All'avvio del backend e poi allo scoccare di ogni ora (ora italiana)
    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 0 * * * *", zone = "Europe/Rome")
    public void refreshRankings() {
        try {
            rankings = new Rankings(topWatchedThisWeek(), topRated(), Instant.now());
        } catch (RuntimeException e) {
            // Database momentaneamente irraggiungibile: resta la classifica precedente
            System.err.println("Aggiornamento delle classifiche della Community fallito: " + e.getMessage());
        }
    }

    // Persone diverse che negli ultimi 7 giorni hanno segnato il titolo come visto (per le serie anche nuovi episodi)
    List<TopWatched> topWatchedThisWeek() {
        return watchEventRepository.topWatchedSince(Instant.now().minus(WEEK), PageRequest.of(0, TOP_SIZE)).stream()
                .map(r -> new TopWatched((Long) r[0], ((Number) r[1]).longValue()))
                .toList();
    }

    // Voto MARVEList di ogni titolo (media dei voti di tutti gli utenti), dal più alto; a parità vince chi ha più voti.
    // Entrano solo i titoli con almeno MIN_VOTES voti, così un singolo 10 non scavalca titoli votati da tanti
    List<TopRated> topRated() {
        return progressRepository.topRated(MIN_VOTES, PageRequest.of(0, TOP_SIZE)).stream()
                .map(r -> new TopRated((Long) r[0], round(r[1]), ((Number) r[2]).longValue()))
                .toList();
    }

    // Una cifra decimale, come il voto TMDB
    private static Double round(Object value) {
        if (value == null) return null;
        return Math.round(((Number) value).doubleValue() * 10) / 10.0;
    }
}
