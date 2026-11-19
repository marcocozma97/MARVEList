package com.marvelist.backend.controllers;

import com.marvelist.backend.auth.AuthenticationResponse;
import com.marvelist.backend.auth.AuthenticationService;
import com.marvelist.backend.auth.PasswordRequests;
import com.marvelist.backend.dto.UserProfileRequest;
import jakarta.validation.Valid;
import com.marvelist.backend.dto.UserProfileResponse;
import com.marvelist.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationService authenticationService;

    // Profilo dell'utente loggato (nickname e avatar)
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
    }

    // Contatore degli utenti: solo per l'account ufficiale di MARVEList
    @GetMapping("/me/stats")
    public ResponseEntity<UserService.UserStats> getStats(Authentication authentication) {
        return ResponseEntity.ok(userService.getStats(authentication.getName()));
    }

    // Cambio password da loggati: risponde con un nuovo token, le altre sessioni vengono chiuse
    @PutMapping("/me/password")
    public ResponseEntity<AuthenticationResponse> changePassword(
            @Valid @RequestBody PasswordRequests.Change request, Authentication authentication) {
        return ResponseEntity.ok(authenticationService.changePassword(
                authentication.getName(), request.currentPassword(), request.newPassword()));
    }

    @GetMapping("/nickname-available")
    public ResponseEntity<java.util.Map<String, Boolean>> nicknameAvailable(@RequestParam String name, Authentication authentication) {
        return ResponseEntity.ok(java.util.Map.of("available", userService.isNicknameAvailable(authentication.getName(), name)));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(@RequestBody UserProfileRequest request, Authentication authentication) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), request));
    }
}
