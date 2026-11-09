package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.MarathonDtos.*;
import com.marvelist.backend.services.MarathonService;
import com.marvelist.backend.services.PosterSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/marathons")
@RequiredArgsConstructor
public class MarathonController {

    private final MarathonService marathonService;
    private final PosterSyncService posterSyncService;

    @GetMapping
    public ResponseEntity<List<MarathonSummary>> list(Authentication auth) {
        return ResponseEntity.ok(marathonService.list(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarathonDetail> get(@PathVariable Long id, Authentication auth) {
        posterSyncService.refreshUpcomingIfStale();
        return ResponseEntity.ok(marathonService.get(auth.getName(), id));
    }

    // Controlla date e limiti mentre si compila il form (non salva nulla)
    @PostMapping("/preview")
    public ResponseEntity<PlanResponse> preview(@RequestBody MarathonRequest request, Authentication auth) {
        return ResponseEntity.ok(marathonService.preview(auth.getName(), request));
    }

    @PostMapping
    public ResponseEntity<MarathonDetail> create(@RequestBody MarathonRequest request, Authentication auth) {
        return ResponseEntity.ok(marathonService.create(auth.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarathonDetail> update(@PathVariable Long id, @RequestBody MarathonRequest request, Authentication auth) {
        return ResponseEntity.ok(marathonService.update(auth.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        marathonService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // Spunta (o annulla) un film/episodio del calendario
    @PostMapping("/{id}/check")
    public ResponseEntity<MarathonDetail> check(@PathVariable Long id, @RequestBody CheckRequest request, Authentication auth) {
        return ResponseEntity.ok(marathonService.check(auth.getName(), id, request));
    }
}
