package com.marvelist.backend.controllers;

import com.marvelist.backend.services.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // Top 10 visti della settimana e Top 10 più votati, aggiornate ogni 24 ore
    @GetMapping("/rankings")
    public ResponseEntity<CommunityService.Rankings> rankings() {
        return ResponseEntity.ok(communityService.rankings());
    }
}
