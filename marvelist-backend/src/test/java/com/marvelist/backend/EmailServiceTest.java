package com.marvelist.backend;

import com.marvelist.backend.services.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class EmailServiceTest {

    private static final String DEFAULT_URL = "http://localhost:5173";

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mock(JavaMailSender.class));
        ReflectionTestUtils.setField(emailService, "frontendUrl", DEFAULT_URL);
        ReflectionTestUtils.setField(emailService, "allowedOrigins", List.of(DEFAULT_URL, "http://192.168.*.*:5173"));
    }

    private String frontendBase(String origin) {
        return ReflectionTestUtils.invokeMethod(emailService, "frontendBase", origin);
    }

    @Test
    void ilLinkPuntaAllIndirizzoDaCuiCiSiERegistrati() {
        assertEquals("http://192.168.1.239:5173", frontendBase("http://192.168.1.239:5173"));
    }

    @Test
    void unOriginNonAmmessoUsaLIndirizzoDiDefault() {
        assertEquals(DEFAULT_URL, frontendBase("https://sito-malevolo.com"));
    }

    @Test
    void senzaOriginSiUsaLIndirizzoDiDefault() {
        assertEquals(DEFAULT_URL, frontendBase(null));
    }
}
