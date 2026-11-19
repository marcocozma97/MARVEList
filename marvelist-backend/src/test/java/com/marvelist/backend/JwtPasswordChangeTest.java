package com.marvelist.backend;

import com.marvelist.backend.entities.Role;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtPasswordChangeTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "c2VncmV0by1kaS1wcm92YS1wZXItaS10ZXN0LWRpLW1hcnZlbGlzdC0xMjM0NTY3OA==");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86_400_000L);
    }

    private static User user() {
        return User.builder().email("tony@gmail.com").role(Role.USER).enabled(true).build();
    }

    @Test
    void unTokenEmessoPrimaDelCambioPasswordNonValePiuAncheNelloStessoSecondo() {
        User user = user();
        String oldToken = jwtService.generateToken(user);
        user.setPasswordChangedAt(Instant.now().truncatedTo(ChronoUnit.MILLIS));

        assertFalse(jwtService.isTokenValid(oldToken, user));
        assertFalse(jwtService.matchesCurrentPasswordForRefresh(oldToken, user));
        assertTrue(jwtService.isTokenValid(jwtService.generateToken(user), user));
    }

    @Test
    void senzaCambiPasswordIVecchiTokenRestanoValidi() {
        User user = user();
        assertTrue(jwtService.isTokenValid(jwtService.generateToken(user), user));
    }
}
