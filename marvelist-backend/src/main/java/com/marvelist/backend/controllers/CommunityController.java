package com.marvelist.backend.controllers;

import com.marvelist.backend.services.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    // Voto MARVEList del titolo e dei suoi episodi
    @GetMapping("/ratings/{mediaId}")
    public ResponseEntity<CommunityService.MediaRatings> ratings(@PathVariable Long mediaId) {
        return ResponseEntity.ok(communityService.ratings(mediaId));
    }

    @GetMapping("/top-watched")
    public ResponseEntity<List<CommunityService.TopWatched>> topWatched() {
        return ResponseEntity.ok(communityService.topWatchedThisWeek());
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<CommunityService.TopRated>> topRated() {
        return ResponseEntity.ok(communityService.topRated());
    }
}
