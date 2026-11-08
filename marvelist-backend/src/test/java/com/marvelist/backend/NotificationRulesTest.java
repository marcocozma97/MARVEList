package com.marvelist.backend;

import com.marvelist.backend.dto.UserProfileRequest;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.Role;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.FollowRepository;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.services.NotificationService;
import com.marvelist.backend.services.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static com.marvelist.backend.entities.NotificationType.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class NotificationRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 8);
    private static final Instant ADDED_SINCE = Instant.parse("2026-10-25T00:00:00Z");

    private static Media upcoming(LocalDate releaseDate) {
        return Media.builder().id(1L).title("Avengers: Doomsday").upcoming(true).releaseDate(releaseDate).build();
    }

    @Test
    void ilContoAllaRovesciaManda30SetteEUnGiorno() {
        assertEquals(List.of(RELEASE_30), NotificationService.dueFor(upcoming(TODAY.plusDays(30)), TODAY, ADDED_SINCE));
        assertEquals(List.of(RELEASE_30), NotificationService.dueFor(upcoming(TODAY.plusDays(8)), TODAY, ADDED_SINCE));
        assertEquals(List.of(RELEASE_7), NotificationService.dueFor(upcoming(TODAY.plusDays(7)), TODAY, ADDED_SINCE));
        assertEquals(List.of(RELEASE_1), NotificationService.dueFor(upcoming(TODAY.plusDays(1)), TODAY, ADDED_SINCE));
        assertEquals(List.of(), NotificationService.dueFor(upcoming(TODAY.plusDays(31)), TODAY, ADDED_SINCE));
    }

    @Test
    void unTitoloArrivatoAllaDataDiUscitaRisultaUscito() {
        assertEquals(List.of(RELEASED), NotificationService.dueFor(upcoming(TODAY), TODAY, ADDED_SINCE));
        assertEquals(List.of(), NotificationService.dueFor(upcoming(TODAY.minusDays(20)), TODAY, ADDED_SINCE));
    }

    @Test
    void unTitoloNonPiuInArrivoNelCatalogoRisultaUscito() {
        Media media = Media.builder().id(2L).upcoming(false).releasedOn(TODAY.minusDays(1)).build();
        assertEquals(List.of(RELEASED), NotificationService.dueFor(media, TODAY, ADDED_SINCE));
    }

    @Test
    void unTitoloAggiuntoDaPocoVieneAnnunciato() {
        Media media = Media.builder().id(3L).upcoming(false).addedAt(ADDED_SINCE.plus(Duration.ofDays(3))).build();
        assertEquals(List.of(NEW_MEDIA), NotificationService.dueFor(media, TODAY, ADDED_SINCE));
        media.setAddedAt(ADDED_SINCE.minus(Duration.ofDays(1)));
        assertEquals(List.of(), NotificationService.dueFor(media, TODAY, ADDED_SINCE));
    }

    private UserService userService(User user) {
        UserRepository users = mock(UserRepository.class);
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(users.save(any())).thenAnswer(inv -> inv.getArgument(0));
        return new UserService(users, mock(FollowRepository.class));
    }

    @Test
    void ilPrimoNicknameSiSceglieSubitoPoiOgniTrentaGiorni() {
        User user = User.builder().id(1L).name("Tony").email("tony@stark.it").role(Role.USER).build();
        UserService service = userService(user);

        var first = service.updateProfile("tony@stark.it", new UserProfileRequest("IronMan", null));
        assertTrue(first.isNicknameChosen());
        assertNotNull(first.getNicknameChangeableFrom());

        var error = assertThrows(ResponseStatusException.class,
                () -> service.updateProfile("tony@stark.it", new UserProfileRequest("Stark", null)));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("IronMan", user.getNickname());

        assertDoesNotThrow(() -> service.updateProfile("tony@stark.it", new UserProfileRequest("IronMan", "shield")));

        user.setNicknameChangedAt(Instant.now().minus(Duration.ofDays(31)));
        user.setNicknameReminderSent(true);
        var later = service.updateProfile("tony@stark.it", new UserProfileRequest("Stark", null));
        assertEquals("Stark", later.getNickname());
        assertFalse(user.getNicknameReminderSent());
    }
}
