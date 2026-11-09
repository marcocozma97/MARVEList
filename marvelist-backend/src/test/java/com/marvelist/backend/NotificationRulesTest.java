package com.marvelist.backend;

import com.marvelist.backend.dto.UserProfileRequest;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.Role;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.NicknameClaim;
import com.marvelist.backend.repositories.FollowRepository;
import com.marvelist.backend.repositories.NicknameClaimRepository;
import com.marvelist.backend.services.RankCalculator;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.services.EpisodeSchedule;
import com.marvelist.backend.services.MarathonScheduler;
import com.marvelist.backend.services.MarathonService;
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
import static org.mockito.ArgumentMatchers.argThat;
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

    private static Media airing(String dates, int episodes) {
        return Media.builder().id(4L).title("Daredevil: Born Again Season 2").type("SERIE_TV").upcoming(false)
                .episodes(episodes).episodeAirDates(dates).build();
    }

    @Test
    void gliEpisodiNonAncoraUscitiNonSonoDisponibili() {
        Media media = airing("2026-10-25,2026-11-01,2026-11-08,2026-11-15", 4);
        assertTrue(EpisodeSchedule.isEpisodeOut(media, 3, TODAY));
        assertFalse(EpisodeSchedule.isEpisodeOut(media, 4, TODAY));
        assertFalse(EpisodeSchedule.isFullyOut(media, TODAY));
        assertTrue(EpisodeSchedule.isFullyOut(media, TODAY.plusDays(7)));
    }

    @Test
    void unEpisodioSenzaDataRestaBloccatoSeNeEsconoAltriDopo() {
        Media media = airing("2026-11-01,2026-11-15,", 3);
        assertFalse(EpisodeSchedule.isEpisodeOut(media, 3, TODAY));
        assertTrue(EpisodeSchedule.isEpisodeOut(airing("2026-11-01,", 2), 2, TODAY));
        assertTrue(EpisodeSchedule.isEpisodeOut(airing(null, 8), 8, TODAY));
    }

    @Test
    void unaStagioneInArrivoSiSbloccaAllaDataDiUscita() {
        Media media = Media.builder().id(5L).type("SERIE_TV").upcoming(true).releaseDate(TODAY).episodes(2)
                .episodeAirDates("2026-11-08,2026-11-15").build();
        assertTrue(EpisodeSchedule.isOut(media, TODAY));
        assertFalse(EpisodeSchedule.isOut(media, TODAY.minusDays(1)));
        assertTrue(EpisodeSchedule.isEpisodeOut(media, 1, TODAY));
        assertFalse(EpisodeSchedule.isEpisodeOut(media, 2, TODAY));
    }

    @Test
    void laNotificaArrivaPerGliEpisodiUscitiDaPocoTranneIlPrimo() {
        Media media = airing("2026-11-01,2026-11-06,2026-11-08,2026-11-15", 4);
        assertEquals(List.of(2, 3), NotificationService.episodesOut(media, TODAY));
        assertEquals(List.of(3), NotificationService.episodesOut(media, TODAY.plusDays(2)));
        assertEquals(List.of(), NotificationService.episodesOut(airing("2026-11-08", 1), TODAY));
    }

    @Test
    void nelleMaratoneOgniEpisodioAspettaLaSuaDataDiUscita() {
        Media media = airing("2026-10-13,2026-10-20,2026-11-03,2026-11-10", 4);
        assertEquals(LocalDate.of(2026, 11, 10), MarathonService.episodeAvailableFrom(media, 4, null));
        assertEquals(LocalDate.of(2026, 11, 3), MarathonService.episodeAvailableFrom(media, 3, null));
        assertEquals(LocalDate.of(2026, 12, 1), MarathonService.episodeAvailableFrom(media, 4, LocalDate.of(2026, 12, 1)));
        assertNull(MarathonService.episodeAvailableFrom(airing(null, 4), 2, null));

        var units = List.of(new MarathonScheduler.Unit(4L, 4, false, LocalDate.of(2026, 11, 10)));
        var plan = MarathonScheduler.plan(units, TODAY, LocalDate.of(2026, 12, 31), new MarathonScheduler.Rules(3, 3, true));
        assertEquals(LocalDate.of(2026, 11, 10), plan.days().get(0).date());
    }

    private UserService userService(User user) {
        UserRepository users = mock(UserRepository.class);
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(users.save(any())).thenAnswer(inv -> inv.getArgument(0));
        claims = mock(NicknameClaimRepository.class);
        when(claims.findByNicknameKey(any())).thenReturn(Optional.empty());
        return new UserService(users, mock(FollowRepository.class), claims);
    }

    private NicknameClaimRepository claims;

    @Test
    void unNicknameGiaPresoDaUnAltroUtenteVieneRifiutato() {
        User user = User.builder().id(1L).name("Tony").email("tony@stark.it").role(Role.USER).build();
        User other = User.builder().id(2L).name("Peter").email("peter@parker.it").role(Role.USER).build();
        UserService service = userService(user);
        when(claims.findByNicknameKey("iron man")).thenReturn(Optional.of(NicknameClaim.builder().nicknameKey("iron man").user(other).build()));

        var error = assertThrows(ResponseStatusException.class,
                () -> service.updateProfile("tony@stark.it", new UserProfileRequest("  Iron   MAN ", null)));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertNull(user.getNicknameChangedAt());

        service.updateProfile("tony@stark.it", new UserProfileRequest("Tony  Stark", null));
        assertEquals("Tony Stark", user.getNickname());
        verify(claims).save(argThat(c -> c.getNicknameKey().equals("tony stark") && c.getUser() == user));
    }

    @Test
    void unNicknameGiaUsatoDaMeTornaDisponibile() {
        User user = User.builder().id(1L).name("Tony").email("tony@stark.it").role(Role.USER)
                .nicknameChangedAt(Instant.now().minus(Duration.ofDays(40))).nickname("Stark").build();
        UserService service = userService(user);
        when(claims.findByNicknameKey("ironman")).thenReturn(Optional.of(NicknameClaim.builder().nicknameKey("ironman").user(user).build()));

        assertTrue(service.isNicknameAvailable("tony@stark.it", "IronMan"));
        service.updateProfile("tony@stark.it", new UserProfileRequest("IronMan", null));
        assertEquals("IronMan", user.getNickname());
        verify(claims, never()).save(any());
    }

    @Test
    void ilGradoSiCalcolaSulServerSenzaMostrareIVisti() {
        List<Media> all = List.of(
                Media.builder().id(1L).visionOrder("MCU").upcoming(false).build(),
                Media.builder().id(2L).visionOrder("MCU").upcoming(false).build(),
                Media.builder().id(3L).visionOrder("MCU").upcoming(true).build(),
                Media.builder().id(4L).visionOrder("FAN").upcoming(false).build());
        assertEquals("Recluta S.H.I.E.L.D.", RankCalculator.compute(all, java.util.Set.of()).title());
        assertEquals("Generale S.H.I.E.L.D.", RankCalculator.compute(all, java.util.Set.of(1L)).title());
        assertEquals(new RankCalculator.RankInfo("Eroe", "red-bright"), RankCalculator.compute(all, java.util.Set.of(1L, 2L)));
        assertEquals("Planet Avenger", RankCalculator.compute(all, java.util.Set.of(1L, 2L, 4L)).title());
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
