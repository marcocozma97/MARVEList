package com.marvelist.backend;

import com.marvelist.backend.services.MarathonScheduler;
import com.marvelist.backend.services.MarathonScheduler.Rules;
import com.marvelist.backend.services.MarathonScheduler.Unit;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MarathonSchedulerTest {

    private static final LocalDate MONDAY = LocalDate.of(2026, 10, 19);

    private static List<Unit> films(int n) {
        List<Unit> units = new ArrayList<>();
        for (int i = 0; i < n; i++) units.add(new Unit((long) i, null, true));
        return units;
    }

    private static List<Unit> episodes(long mediaId, int n) {
        List<Unit> units = new ArrayList<>();
        for (int ep = 1; ep <= n; ep++) units.add(new Unit(mediaId, ep, false));
        return units;
    }

    @Test
    void rispettaIlLimiteSettimanaleDeiFilm() {
        var result = MarathonScheduler.plan(films(5), MONDAY, MONDAY.plusDays(30), new Rules(2, 3, true));
        assertTrue(result.feasible());
        // 2 film nella prima settimana, 2 nella seconda, 1 nella terza: si finisce il lunedì della terza settimana
        assertEquals(MONDAY.plusWeeks(2), result.requiredEndDate());
        assertEquals(MONDAY, result.days().get(0).date());
        assertEquals(MONDAY.plusDays(1), result.days().get(1).date());
        assertEquals(MONDAY.plusWeeks(1), result.days().get(2).date());
    }

    @Test
    void rispettaIlLimiteGiornalieroDegliEpisodi() {
        var result = MarathonScheduler.plan(episodes(100, 9), MONDAY, MONDAY.plusDays(10), new Rules(0, 4, true));
        assertTrue(result.feasible());
        assertEquals(3, result.days().size());
        assertEquals(List.of(4, 4, 1), result.days().stream().map(d -> d.units().size()).toList());
    }

    @Test
    void senzaGiorniMistiFilmEdEpisodiNonStannoNelloStessoGiorno() {
        List<Unit> units = new ArrayList<>(films(1));
        units.addAll(episodes(100, 2));
        var mixed = MarathonScheduler.plan(units, MONDAY, MONDAY.plusDays(5), new Rules(3, 5, true));
        var separate = MarathonScheduler.plan(units, MONDAY, MONDAY.plusDays(5), new Rules(3, 5, false));
        assertEquals(1, mixed.days().size());
        assertEquals(2, separate.days().size());
        assertTrue(separate.days().get(0).units().get(0).film());
        assertFalse(separate.days().get(1).units().get(0).film());
    }

    @Test
    void segnalaQuandoNonCeTempoESuggerisceLaDataDiFine() {
        var result = MarathonScheduler.plan(episodes(100, 10), MONDAY, MONDAY.plusDays(1), new Rules(0, 2, true));
        assertFalse(result.feasible());
        assertEquals(6, result.unscheduled());
        assertEquals(MONDAY.plusDays(4), result.requiredEndDate());
    }

    @Test
    void filmConLimiteZeroRendonoIlPianoImpossibile() {
        var result = MarathonScheduler.plan(films(1), MONDAY, MONDAY.plusDays(30), new Rules(0, 2, true));
        assertFalse(result.feasible());
        assertNull(result.requiredEndDate());
    }

    @Test
    void unTitoloInArrivoNonVieneProgrammatoPrimaDellUscita() {
        List<Unit> units = new ArrayList<>(films(1));
        units.add(new Unit(99L, null, true, MONDAY.plusDays(10))); // esce tra 10 giorni
        var result = MarathonScheduler.plan(units, MONDAY, MONDAY.plusDays(30), new Rules(7, 3, true));
        assertTrue(result.feasible());
        assertEquals(MONDAY, result.days().get(0).date());
        assertEquals(MONDAY.plusDays(10), result.days().get(1).date());
        // Se esce dopo la fine, non c'è il tempo: la data minima suggerita è il giorno di uscita
        var tooEarly = MarathonScheduler.plan(units, MONDAY, MONDAY.plusDays(5), new Rules(7, 3, true));
        assertFalse(tooEarly.feasible());
        assertEquals(MONDAY.plusDays(10), tooEarly.requiredEndDate());
    }

    @Test
    void leUnitaSpuntateOggiTengonoIlLoroPostoNelCalendario() {
        // 2 episodi al giorno: i primi due sono già stati visti oggi, il terzo resta a domani
        List<Unit> units = new ArrayList<>();
        units.add(new Unit(100L, 1, false, null, true));
        units.add(new Unit(100L, 2, false, null, true));
        units.add(new Unit(100L, 3, false));
        var result = MarathonScheduler.plan(units, MONDAY, MONDAY.plusDays(5), new Rules(0, 2, true));
        assertTrue(result.feasible());
        assertEquals(MONDAY, result.days().get(0).date());
        assertEquals(2, result.days().get(0).units().size());
        assertEquals(MONDAY.plusDays(1), result.days().get(1).date());
        // Le unità già viste non contano come fuori calendario, anche se la data di fine è passata
        var late = MarathonScheduler.plan(units.subList(0, 2), MONDAY, MONDAY.minusDays(1), new Rules(0, 2, true));
        assertEquals(0, late.unscheduled());
    }

    @Test
    void lOrdineDiVisioneNonVieneMaiScavalcato() {
        // Film bloccato dal limite settimanale: gli episodi dopo di lui aspettano, non lo superano
        List<Unit> units = new ArrayList<>(films(2));
        units.addAll(episodes(100, 1));
        var result = MarathonScheduler.plan(units, MONDAY, MONDAY.plusDays(14), new Rules(1, 5, true));
        assertEquals(MONDAY, result.days().get(0).date());
        assertEquals(MONDAY.plusWeeks(1), result.days().get(1).date());
        assertEquals(2, result.days().get(1).units().size()); // secondo film + episodio, lunedì dopo
    }

    @Test
    void quelloSegnatoOggiRestaSoloOggiEIlRestoSiCompatta() {
        List<Unit> units = new ArrayList<>();
        units.add(new Unit(1L, 1, false, null, true));
        units.add(new Unit(1L, 2, false, null, false));
        units.add(new Unit(1L, 3, false, null, true));
        units.add(new Unit(1L, 4, false, null, true));
        units.add(new Unit(1L, 5, false, null, false));

        var result = MarathonScheduler.plan(units, MONDAY, MONDAY.plusDays(30), new Rules(3, 1, true));

        assertEquals(3, result.days().get(0).units().size());
        assertTrue(result.days().get(0).units().stream().allMatch(Unit::done));
        assertEquals(List.of(2), result.days().get(1).units().stream().map(Unit::episode).toList());
        assertEquals(List.of(5), result.days().get(2).units().stream().map(Unit::episode).toList());
        assertEquals(MONDAY.plusDays(2), result.requiredEndDate());
    }

    @Test
    void seEFattoTuttoOggiNonRestaNullaDaPianificare() {
        var result = MarathonScheduler.plan(List.of(new Unit(1L, null, true, null, true)), MONDAY, MONDAY.plusDays(5), new Rules(1, 1, true));
        assertTrue(result.feasible());
        assertEquals(1, result.days().size());
    }
}
