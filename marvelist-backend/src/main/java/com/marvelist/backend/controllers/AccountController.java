package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.AccountBackup;
import com.marvelist.backend.services.AccountDataService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

// "Modifica profilo": scarica i dati, carica un salvataggio, elimina l'account
@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountDataService accountDataService;

    public record DeleteRequest(@NotBlank(message = "Inserisci la tua password") String password) {}

    @GetMapping("/export")
    public ResponseEntity<AccountBackup> export(Authentication authentication) {
        return ResponseEntity.ok(accountDataService.export(authentication.getName()));
    }

    @PostMapping("/import")
    public ResponseEntity<AccountBackup.ImportResult> importBackup(@RequestBody AccountBackup backup, Authentication authentication) {
        return ResponseEntity.ok(accountDataService.importBackup(authentication.getName(), backup));
    }

    @PostMapping("/delete")
    public ResponseEntity<Void> delete(@Valid @RequestBody DeleteRequest request, Authentication authentication) {
        accountDataService.deleteAccount(authentication.getName(), request.password());
        return ResponseEntity.noContent().build();
    }
}
