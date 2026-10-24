package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.UserMediaRequest;
import com.marvelist.backend.entities.UserMedia;
import com.marvelist.backend.services.UserMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usermedia")
@RequiredArgsConstructor
public class UserMediaController {

    private final UserMediaService userMediaService;

    // POST: Invia i dati di un film/serie per salvarli (visto, voto, watchlist)
    @PostMapping("/save")
    public ResponseEntity<UserMedia> saveMedia(@RequestBody UserMediaRequest request) {
        return ResponseEntity.ok(userMediaService.saveOrUpdateMedia(request));
    }

    // GET: Recupera tutto l'elenco dei salvataggi dell'utente loggato
    @GetMapping("/library")
    public ResponseEntity<List<UserMedia>> getMyLibrary() {
        return ResponseEntity.ok(userMediaService.getUserLibrary());
    }
}