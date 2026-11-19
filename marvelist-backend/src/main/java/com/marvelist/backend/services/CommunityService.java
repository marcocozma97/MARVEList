package com.marvelist.backend.services;

import com.marvelist.backend.repositories.EpisodeRatingRepository;
import com.marvelist.backend.repositories.UserProgressRepository;
import com.marvelist.backend.repositories.WatchEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    private final UserProgressRepository progressRepository;
    private final EpisodeRatingRepository episodeRatingRepository;
    private final WatchEventRepository watchEventRepository;

    public record Rating(Double average, long count) {}

    public record MediaRatings(Rating rating, Map<Integer, Rating> episodes) {}

    public record TopWatched(Long mediaId, long users) {}

    public record TopRated(Long mediaId, double average, long count) {}

    @Transactional(readOnly = true)
    public MediaRatings ratings(Long mediaId) {
        Object[] row = progressRepository.averageRating(mediaId).stream().findFirst().orElse(new Object[]{null, 0L});
        Map<Integer, Rating> episodes = new TreeMap<>();
        for (Object[] r : episodeRatingRepository.averageByEpisode(mediaId)) {
            episodes.put(((Number) r[0]).intValue(), new Rating(round(r[1]), ((Number) r[2]).longValue()));
        }
        return new MediaRatings(new Rating(round(row[0]), row[1] == null ? 0 : ((Number) row[1]).longValue()), episodes);
    }

    // Titoli segnati come visti (o con nuovi episodi visti) dal maggior numero di utenti negli ultimi 7 giorni
    @Transactional(readOnly = true)
    public List<TopWatched> topWatchedThisWeek() {
        return watchEventRepository.topWatchedSince(Instant.now().minus(WEEK), PageRequest.of(0, TOP_SIZE)).stream()
                .map(r -> new TopWatched((Long) r[0], ((Number) r[1]).longValue()))
                .toList();
    }

    // Media di tutti i voti degli utenti su ogni titolo, dalla più alta (a parità vince chi ha più voti)
    @Transactional(readOnly = true)
    public List<TopRated> topRated() {
        return progressRepository.topRated(PageRequest.of(0, TOP_SIZE)).stream()
                .map(r -> new TopRated((Long) r[0], round(r[1]), ((Number) r[2]).longValue()))
                .toList();
    }

    // Una cifra decimale, come il voto TMDB
    private static Double round(Object value) {
        if (value == null) return null;
        return Math.round(((Number) value).doubleValue() * 10) / 10.0;
    }
}
