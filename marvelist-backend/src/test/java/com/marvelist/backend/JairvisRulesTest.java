package com.marvelist.backend;

import com.marvelist.backend.services.JairvisService;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class JairvisRulesTest {

    private static Object invoke(String name, Class<?>[] types, Object... args) throws Exception {
        Method method = JairvisService.class.getDeclaredMethod(name, types);
        method.setAccessible(true);
        return method.invoke(null, args);
    }

    private static boolean outOfFunds(int status, String body) throws Exception {
        return (boolean) invoke("isOutOfFunds", new Class<?>[]{int.class, String.class}, status, body);
    }

    private static Instant nextAskAt(Instant last, Instant now) throws Exception {
        return (Instant) invoke("nextAskAt", new Class<?>[]{Instant.class, Instant.class}, last, now);
    }

    @Test
    void creditiFinitiOLimiteDellaChiaveSonoManutenzione() throws Exception {
        assertTrue(outOfFunds(402, "{\"error\":{\"message\":\"Insufficient credits\"}}"));
        assertTrue(outOfFunds(403, "{\"error\":{\"message\":\"Key limit exceeded\"}}"));
        assertFalse(outOfFunds(500, "credit"));
        assertFalse(outOfFunds(429, "Rate limit exceeded"));
        assertFalse(outOfFunds(401, "User not found"));
    }

    @Test
    void laDomandaSiRiattivaDopo24Ore() throws Exception {
        Instant now = Instant.parse("2026-11-09T12:00:00Z");
        assertNull(nextAskAt(null, now));
        assertEquals(now.plus(Duration.ofHours(1)), nextAskAt(now.minus(Duration.ofHours(23)), now));
        assertNull(nextAskAt(now.minus(Duration.ofHours(24)), now));
    }

    @Test
    void dueDomandeOgni24Ore() throws Exception {
        Instant now = Instant.parse("2026-11-09T12:00:00Z");
        Method remaining = JairvisService.class.getDeclaredMethod("remaining", Instant.class, Instant.class, Instant.class);
        Method next = JairvisService.class.getDeclaredMethod("nextAskAt", Instant.class, Instant.class, Instant.class);
        remaining.setAccessible(true);
        next.setAccessible(true);
        Instant fiveHoursAgo = now.minus(Duration.ofHours(5)), twoHoursAgo = now.minus(Duration.ofHours(2));
        assertEquals(2, remaining.invoke(null, null, null, now));
        assertEquals(1, remaining.invoke(null, fiveHoursAgo, null, now));
        assertEquals(0, remaining.invoke(null, fiveHoursAgo, twoHoursAgo, now));
        assertNull(next.invoke(null, fiveHoursAgo, null, now));
        assertEquals(fiveHoursAgo.plus(Duration.ofHours(24)), next.invoke(null, twoHoursAgo, fiveHoursAgo, now));
        assertEquals(1, remaining.invoke(null, now.minus(Duration.ofHours(25)), twoHoursAgo, now));
    }
}
