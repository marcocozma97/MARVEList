package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.ProgressRequest;
import com.marvelist.backend.dto.ProgressResponse;
import com.marvelist.backend.dto.RatingRequest;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.services.MediaService;
import com.marvelist.backend.services.PosterSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;
    private final PosterSyncService posterSyncService;

    @GetMapping
    public ResponseEntity<List<Media>> getAllMedia() {
        // A ogni caricamento dell'app: se serve, ricontrolla su TMDB le date dei titoli in arrivo (in background)
        posterSyncService.refreshUpcomingIfStale();
        return ResponseEntity.ok(mediaService.getAllMedia());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Media> getMediaById(@PathVariable Long id) {
        return ResponseEntity.ok(mediaService.getMediaById(id));
    }

    @GetMapping("/seen")
    public ResponseEntity<List<Long>> getSeenMediaIds(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(mediaService.getSeenMediaIdsByUser(email));
    }

    // Aggiunge/Rimuove un film dai visti (e allinea minuti/episodi)
    @PostMapping("/{mediaId}/seen")
    public ResponseEntity<ProgressResponse> toggleSeen(@PathVariable Long mediaId, Authentication authentication) {
        return ResponseEntity.ok(mediaService.toggleSeenMedia(authentication.getName(), mediaId));
    }

    // Presa visione di una fase intera (seen=true) o reset di tutta la fase (seen=false)
    @PostMapping("/bulk-seen")
    public ResponseEntity<List<ProgressResponse>> setSeenBulk(@RequestBody BulkSeenRequest request, Authentication authentication) {
        return ResponseEntity.ok(mediaService.setSeenBulk(authentication.getName(), request.mediaIds(), request.seen()));
    }

    public record BulkSeenRequest(List<Long> mediaIds, boolean seen) {}

    @GetMapping("/favorites")
    public ResponseEntity<List<Long>> getFavoriteMediaIds(Authentication authentication) {
        return ResponseEntity.ok(mediaService.getFavoriteMediaIdsByUser(authentication.getName()));
    }

    @PostMapping("/{mediaId}/favorite")
    public ResponseEntity<String> toggleFavorite(@PathVariable Long mediaId, Authentication authentication) {
        mediaService.toggleFavoriteMedia(authentication.getName(), mediaId);
        return ResponseEntity.ok("Preferiti aggiornati con successo");
    }

    // "Guarda dopo": titoli rimandati, saltati nelle maratone e nel completamento delle fasi
    @GetMapping("/watch-later")
    public ResponseEntity<List<Long>> getWatchLaterMediaIds(Authentication authentication) {
        return ResponseEntity.ok(mediaService.getWatchLaterMediaIdsByUser(authentication.getName()));
    }

    @PostMapping("/{mediaId}/watch-later")
    public ResponseEntity<ProgressResponse> toggleWatchLater(@PathVariable Long mediaId, Authentication authentication) {
        return ResponseEntity.ok(mediaService.toggleWatchLater(authentication.getName(), mediaId));
    }

    // Watchlist automatica: titoli iniziati ma non ancora finiti
    @GetMapping("/watchlist")
    public ResponseEntity<List<Long>> getWatchlistMediaIds(Authentication authentication) {
        return ResponseEntity.ok(mediaService.getWatchlistMediaIdsByUser(authentication.getName()));
    }

    // Tutti i progressi/voti dell'utente loggato (per l'Area Personale)
    @GetMapping("/progress")
    public ResponseEntity<List<ProgressResponse>> getAllProgress(Authentication authentication) {
        return ResponseEntity.ok(mediaService.getAllProgress(authentication.getName()));
    }

    @GetMapping("/{mediaId}/progress")
    public ResponseEntity<ProgressResponse> getProgress(@PathVariable Long mediaId, Authentication authentication) {
        return ResponseEntity.ok(mediaService.getProgress(authentication.getName(), mediaId));
    }

    // Minuti visti (film) o episodi visti (serie)
    @PutMapping("/{mediaId}/progress")
    public ResponseEntity<ProgressResponse> updateProgress(@PathVariable Long mediaId, @RequestBody ProgressRequest request, Authentication authentication) {
        return ResponseEntity.ok(mediaService.updateProgress(authentication.getName(), mediaId, request));
    }

    // Voto a scudi: da 0.5 a 10, null per toglierlo
    @PutMapping("/{mediaId}/rating")
    public ResponseEntity<ProgressResponse> updateRating(@PathVariable Long mediaId, @RequestBody RatingRequest request, Authentication authentication) {
        return ResponseEntity.ok(mediaService.updateRating(authentication.getName(), mediaId, request.getRating()));
    }

    @GetMapping("/{mediaId}/episode-ratings")
    public ResponseEntity<Map<Integer, Double>> getEpisodeRatings(@PathVariable Long mediaId, Authentication authentication) {
        return ResponseEntity.ok(mediaService.getEpisodeRatings(authentication.getName(), mediaId));
    }

    @PutMapping("/{mediaId}/episodes/{episode}/rating")
    public ResponseEntity<Map<Integer, Double>> rateEpisode(@PathVariable Long mediaId, @PathVariable Integer episode,
                                                            @RequestBody RatingRequest request, Authentication authentication) {
        return ResponseEntity.ok(mediaService.rateEpisode(authentication.getName(), mediaId, episode, request.getRating()));
    }

    @PutMapping("/{id}/sync")
    public ResponseEntity<String> syncTmdb(@PathVariable Long id, @RequestParam Long tmdbId, @RequestParam String posterPath,
                                           @RequestParam(required = false) Integer runtime,
                                           @RequestParam(required = false) Integer episodes) {
        mediaService.updateTmdbData(id, tmdbId, posterPath, runtime, episodes);
        return ResponseEntity.ok("Sincronizzato");
    }
}
