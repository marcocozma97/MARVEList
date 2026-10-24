package com.marvelist.backend.services;

import com.marvelist.backend.dto.ProgressRequest;
import com.marvelist.backend.dto.ProgressResponse;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.UserProgress;
import com.marvelist.backend.repositories.MediaRepository;
import com.marvelist.backend.repositories.UserProgressRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final UserProgressRepository progressRepository;

    public List<Media> getAllMedia() {
        return mediaRepository.findAllBySortOrderIsNotNullOrderBySortOrderAsc();
    }

    public Media getMediaById(Long id) {
        return findMedia(id);
    }

    // --- VISTI ---
    // Segnare come visto completa anche il progresso (tutti gli episodi / tutti i minuti),
    // toglierlo lo azzera: così cerchio "visto", minuti ed episodi restano sempre coerenti.
    @Transactional
    public ProgressResponse toggleSeenMedia(String userEmail, Long mediaId) {
        User user = findUser(userEmail);
        Media media = findMedia(mediaId);
        requireReleased(media);
        UserProgress progress = findOrCreateProgress(user, media);

        boolean nowSeen = !user.getSeenMedia().remove(media);
        if (nowSeen) {
            user.getSeenMedia().add(media);
            if (media.getRuntime() != null) progress.setMinutesWatched(media.getRuntime());
            if (media.getEpisodes() != null) {
                progress.getWatchedEpisodes().clear();
                progress.getWatchedEpisodes().addAll(allEpisodes(media));
            }
        } else {
            progress.setMinutesWatched(0);
            progress.getWatchedEpisodes().clear();
        }

        userRepository.save(user);
        progressRepository.save(progress);
        return toResponse(user, media, progress);
    }

    public List<Long> getSeenMediaIdsByUser(String userEmail) {
        return findUser(userEmail).getSeenMedia().stream()
                .map(Media::getId)
                .toList();
    }

    // --- PREFERITI ---
    @Transactional
    public void toggleFavoriteMedia(String userEmail, Long mediaId) {
        User user = findUser(userEmail);
        Media media = findMedia(mediaId);
        if (!user.getFavoriteMedia().remove(media)) {
            user.getFavoriteMedia().add(media);
        }
        userRepository.save(user);
    }

    public List<Long> getFavoriteMediaIdsByUser(String userEmail) {
        return findUser(userEmail).getFavoriteMedia().stream()
                .map(Media::getId)
                .toList();
    }

    // --- GUARDA DOPO ---
    // Titolo rimandato: le maratone lo saltano e il completamento delle fasi non lo conta
    @Transactional
    public ProgressResponse toggleWatchLater(String userEmail, Long mediaId) {
        User user = findUser(userEmail);
        Media media = findMedia(mediaId);
        if (!user.getWatchLaterMedia().remove(media)) {
            user.getWatchLaterMedia().add(media);
        }
        userRepository.save(user);
        UserProgress progress = progressRepository.findByUserAndMedia(user, media)
                .orElseGet(() -> UserProgress.builder().user(user).media(media).build());
        return toResponse(user, media, progress);
    }

    public List<Long> getWatchLaterMediaIdsByUser(String userEmail) {
        return findUser(userEmail).getWatchLaterMedia().stream()
                .map(Media::getId)
                .toList();
    }

    // --- WATCHLIST (automatica) ---
    // Contiene i titoli iniziati ma non finiti: un film con dei minuti visti
    // o una serie con almeno un episodio visto, che non sono ancora segnati come visti.
    @Transactional(readOnly = true)
    public List<Long> getWatchlistMediaIdsByUser(String userEmail) {
        User user = findUser(userEmail);
        Set<Long> seenIds = user.getSeenMedia().stream().map(Media::getId).collect(Collectors.toSet());
        return progressRepository.findAllByUser(user).stream()
                .filter(UserProgress::isStarted)
                .map(p -> p.getMedia().getId())
                .filter(id -> !seenIds.contains(id))
                .toList();
    }

    // --- PROGRESSI E VOTI ---
    @Transactional(readOnly = true)
    public ProgressResponse getProgress(String userEmail, Long mediaId) {
        User user = findUser(userEmail);
        Media media = findMedia(mediaId);
        UserProgress progress = progressRepository.findByUserAndMedia(user, media)
                .orElseGet(() -> UserProgress.builder().user(user).media(media).build());
        return toResponse(user, media, progress);
    }

    @Transactional(readOnly = true)
    public List<ProgressResponse> getAllProgress(String userEmail) {
        User user = findUser(userEmail);
        return progressRepository.findAllByUser(user).stream()
                .map(p -> toResponse(user, p.getMedia(), p))
                .toList();
    }

    @Transactional
    public ProgressResponse updateProgress(String userEmail, Long mediaId, ProgressRequest request) {
        User user = findUser(userEmail);
        Media media = findMedia(mediaId);
        requireReleased(media);
        UserProgress progress = findOrCreateProgress(user, media);
        boolean completed;

        if ("FILM".equals(media.getType())) {
            int minutes = request.getMinutesWatched() == null ? 0 : Math.max(0, request.getMinutesWatched());
            if (media.getRuntime() != null) minutes = Math.min(minutes, media.getRuntime());
            progress.setMinutesWatched(minutes);
            completed = media.getRuntime() != null && minutes >= media.getRuntime();
        } else {
            Integer total = media.getEpisodes();
            Set<Integer> episodes = request.getWatchedEpisodes() == null ? Set.of() : request.getWatchedEpisodes().stream()
                    .filter(ep -> ep != null && ep >= 1 && (total == null || ep <= total))
                    .collect(Collectors.toSet());
            progress.getWatchedEpisodes().clear();
            progress.getWatchedEpisodes().addAll(episodes);
            completed = total != null && episodes.size() >= total;
        }

        // Visto in automatico quando il progresso è completo, non più visto appena non lo è
        if (completed) user.getSeenMedia().add(media);
        else user.getSeenMedia().remove(media);

        userRepository.save(user);
        progressRepository.save(progress);
        return toResponse(user, media, progress);
    }

    // Presa visione di un'intera fase: tutto visto (film completi, tutti gli episodi) oppure tutto
    // non visto con progressi azzerati. Voti e preferiti non vengono toccati.
    @Transactional
    public List<ProgressResponse> setSeenBulk(String userEmail, List<Long> mediaIds, boolean seen) {
        User user = findUser(userEmail);
        // I titoli in arrivo restano fuori dalla presa visione della fase
        List<Media> mediaList = mediaRepository.findAllById(mediaIds == null ? List.of() : mediaIds).stream()
                .filter(m -> !Boolean.TRUE.equals(m.getUpcoming()))
                .toList();
        List<UserProgress> progresses = mediaList.stream().map(media -> {
            UserProgress progress = findOrCreateProgress(user, media);
            progress.getWatchedEpisodes().clear();
            if (seen) {
                user.getSeenMedia().add(media);
                progress.setMinutesWatched(media.getRuntime() != null ? media.getRuntime() : 0);
                if (media.getEpisodes() != null) progress.getWatchedEpisodes().addAll(allEpisodes(media));
            } else {
                user.getSeenMedia().remove(media);
                progress.setMinutesWatched(0);
            }
            return progress;
        }).toList();

        userRepository.save(user);
        progressRepository.saveAll(progresses);
        return progresses.stream().map(p -> toResponse(user, p.getMedia(), p)).toList();
    }

    // Spunta di una maratona: segna (o toglie) un film intero o un singolo episodio anche nei progressi
    @Transactional
    public void markUnitWatched(String userEmail, Long mediaId, Integer episode, boolean watched) {
        User user = findUser(userEmail);
        Media media = findMedia(mediaId);
        UserProgress progress = findOrCreateProgress(user, media);

        if (episode == null) {
            if (watched) {
                user.getSeenMedia().add(media);
                if (media.getRuntime() != null) progress.setMinutesWatched(media.getRuntime());
            } else {
                user.getSeenMedia().remove(media);
                progress.setMinutesWatched(0);
            }
        } else {
            if (watched) progress.getWatchedEpisodes().add(episode);
            else progress.getWatchedEpisodes().remove(episode);
            boolean complete = media.getEpisodes() != null && progress.getWatchedEpisodes().size() >= media.getEpisodes();
            if (complete) user.getSeenMedia().add(media);
            else user.getSeenMedia().remove(media);
        }

        userRepository.save(user);
        progressRepository.save(progress);
    }

    @Transactional
    public ProgressResponse updateRating(String userEmail, Long mediaId, Double rating) {
        if (rating != null && (rating < 0.5 || rating > 10 || rating * 2 != Math.floor(rating * 2))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il voto deve andare da 0.5 a 10, a passi di 0.5");
        }
        User user = findUser(userEmail);
        Media media = findMedia(mediaId);
        UserProgress progress = findOrCreateProgress(user, media);
        progress.setRating(rating);
        progressRepository.save(progress);
        return toResponse(user, media, progress);
    }

    // Salva i dati trovati su TMDB (durata ed episodi solo se mancano: quelli del JSON hanno la precedenza)
    @Transactional
    public void updateTmdbData(Long id, Long tmdbId, String posterPath, Integer runtime, Integer episodes) {
        Media media = findMedia(id);
        media.setTmdbId(tmdbId);
        media.setPosterPath(posterPath);
        if (runtime != null && runtime > 0 && media.getRuntime() == null) media.setRuntime(runtime);
        if (episodes != null && episodes > 0 && media.getEpisodes() == null) media.setEpisodes(episodes);
        mediaRepository.save(media);
    }

    private ProgressResponse toResponse(User user, Media media, UserProgress progress) {
        boolean seen = user.getSeenMedia().contains(media);
        return ProgressResponse.builder()
                .mediaId(media.getId())
                .seen(seen)
                .favorite(user.getFavoriteMedia().contains(media))
                .inWatchlist(!seen && progress.isStarted())
                .watchLater(user.getWatchLaterMedia().contains(media))
                .rating(progress.getRating())
                .minutesWatched(progress.getMinutesWatched() == null ? 0 : progress.getMinutesWatched())
                .watchedEpisodes(progress.getWatchedEpisodes().stream().sorted().toList())
                .build();
    }

    private UserProgress findOrCreateProgress(User user, Media media) {
        return progressRepository.findByUserAndMedia(user, media)
                .orElseGet(() -> UserProgress.builder().user(user).media(media).build());
    }

    private Set<Integer> allEpisodes(Media media) {
        return IntStream.rangeClosed(1, media.getEpisodes()).boxed().collect(Collectors.toSet());
    }

    private static void requireReleased(Media media) {
        if (Boolean.TRUE.equals(media.getUpcoming())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "\"" + media.getTitle() + "\" non è ancora uscito");
        }
    }

    private User findUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));
    }

    private Media findMedia(Long mediaId) {
        return mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media non trovato"));
    }
}
