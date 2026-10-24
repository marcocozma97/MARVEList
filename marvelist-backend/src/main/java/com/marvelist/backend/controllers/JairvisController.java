package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.JairvisRequest;
import com.marvelist.backend.dto.JairvisResponse;
import com.marvelist.backend.services.JairvisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/jairvis")
@RequiredArgsConstructor
public class JairvisController {

    private final JairvisService jairvisService;

    @PostMapping("/ask")
    public ResponseEntity<JairvisResponse> askJairvis(@RequestBody JairvisRequest request) {
        return ResponseEntity.ok(jairvisService.askJairvis(request));
    }
}