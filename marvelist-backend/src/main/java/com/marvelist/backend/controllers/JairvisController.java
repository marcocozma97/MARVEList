package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.JairvisRequest;
import com.marvelist.backend.dto.JairvisResponse;
import com.marvelist.backend.dto.JairvisStatus;
import com.marvelist.backend.services.JairvisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/jairvis")
@RequiredArgsConstructor
public class JairvisController {

    private final JairvisService jairvisService;

    @GetMapping("/status")
    public ResponseEntity<JairvisStatus> status(Authentication authentication) {
        return ResponseEntity.ok(jairvisService.status(authentication.getName()));
    }

    @PostMapping("/ask")
    public ResponseEntity<JairvisResponse> askJairvis(@RequestBody JairvisRequest request, Authentication authentication) {
        return ResponseEntity.ok(jairvisService.askJairvis(authentication.getName(), request));
    }
}
