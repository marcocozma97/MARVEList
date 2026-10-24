package com.marvelist.backend;

import com.marvelist.backend.auth.AuthenticationService;
import com.marvelist.backend.auth.RegisterRequest;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.security.JwtService;
import com.marvelist.backend.services.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AuthenticationServiceTest {

    private static final String ORIGIN = "http://localhost:5173";

    private UserRepository repository;
    private EmailService emailService;
    private AuthenticationService service;

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        emailService = mock(EmailService.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(any())).thenReturn("hash");
        service = new AuthenticationService(repository, encoder, mock(JwtService.class), mock(AuthenticationManager.class), emailService);
        ReflectionTestUtils.setField(service, "verificationExpirationHours", 24L);
    }

    private static RegisterRequest request(String email) {
        return RegisterRequest.builder().name(" Tony ").surname("Stark").email(email).password("jarvis!").build();
    }

    @Test
    void laRegistrazioneCreaUnAccountDisattivatoEInviaLaMail() {
        when(repository.findByEmail("tony@stark.it")).thenReturn(Optional.empty());

        service.register(request(" tony@stark.it "), ORIGIN);

        verify(emailService).sendVerificationEmail(argThat(user ->
                !user.getEnabled()
                        && user.getName().equals("Tony")
                        && user.getEmail().equals("tony@stark.it")
                        && user.getVerificationToken() != null
                        && user.getVerificationTokenExpiresAt().isAfter(LocalDateTime.now().plusHours(23))
        ), eq(ORIGIN));
    }

    @Test
    void unaEmailGiaAttivaNonSiPuoRiregistrare() {
        User active = User.builder().email("tony@stark.it").enabled(true).build();
        when(repository.findByEmail("tony@stark.it")).thenReturn(Optional.of(active));

        var error = assertThrows(ResponseStatusException.class, () -> service.register(request("tony@stark.it"), ORIGIN));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verifyNoInteractions(emailService);
    }

    @Test
    void unaEmailNonConfermataRiceveUnNuovoLink() {
        User pending = User.builder().email("tony@stark.it").enabled(false).verificationToken("vecchio").build();
        when(repository.findByEmail("tony@stark.it")).thenReturn(Optional.of(pending));

        service.register(request("tony@stark.it"), ORIGIN);

        assertNotEquals("vecchio", pending.getVerificationToken());
        verify(emailService).sendVerificationEmail(pending, ORIGIN);
    }

    @Test
    void ilLinkValidoAttivaLAccount() {
        User user = User.builder().enabled(false).verificationTokenExpiresAt(LocalDateTime.now().plusHours(1)).build();
        when(repository.findByVerificationToken("token")).thenReturn(Optional.of(user));

        service.verify("token");

        assertTrue(user.getEnabled());
        verify(repository).save(user);
    }

    @Test
    void ilLinkScadutoVieneRifiutato() {
        User user = User.builder().enabled(false).verificationTokenExpiresAt(LocalDateTime.now().minusMinutes(1)).build();
        when(repository.findByVerificationToken("token")).thenReturn(Optional.of(user));

        var error = assertThrows(ResponseStatusException.class, () -> service.verify("token"));
        assertEquals(HttpStatus.GONE, error.getStatusCode());
        assertFalse(user.getEnabled());
    }

    @Test
    void riaprireIlLinkDiUnAccountGiaAttivoNonDaErrore() {
        User user = User.builder().enabled(true).build();
        when(repository.findByVerificationToken("token")).thenReturn(Optional.of(user));

        assertDoesNotThrow(() -> service.verify("token"));
        verify(repository, never()).save(any());
    }

    @Test
    void unTokenInesistenteVieneRifiutato() {
        when(repository.findByVerificationToken("falso")).thenReturn(Optional.empty());

        var error = assertThrows(ResponseStatusException.class, () -> service.verify("falso"));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }
}
