package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.UserProfileRequest;
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

    // Profilo dell'utente loggato (nickname e avatar)
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
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
