package com.marvelist.backend.services;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Calcola il calendario di una maratona: distribuisce, nell'ordine di visione, i film e gli episodi
// ancora da vedere sui giorni disponibili rispettando i limiti scelti dall'utente.
// Si parte sempre da oggi: ciò che non è stato visto nei giorni passati scivola da solo sui giorni successivi.
// Le unità spuntate oggi (done) occupano ancora il loro posto: il calendario di oggi non cambia fino a domani.
public final class MarathonScheduler {

    // availableFrom: per i titoli "in arrivo" il giorno di uscita, prima del quale non si può vedere
    public record Unit(Long mediaId, Integer episode, boolean film, LocalDate availableFrom, boolean done) {
        public Unit(Long mediaId, Integer episode, boolean film, LocalDate availableFrom) { this(mediaId, episode, film, availableFrom, false); }
        public Unit(Long mediaId, Integer episode, boolean film) { this(mediaId, episode, film, null); }
    }

    public record Rules(int maxFilmsPerWeek, int maxEpisodesPerDay, boolean mixedDays) {}

    public record Day(LocalDate date, List<Unit> units) {}

    /**
     * @param days            giorni (non vuoti) entro la data di fine
     * @param unscheduled     unità che non stanno entro la data di fine
     * @param requiredEndDate data minima di fine per vedere tutto (null se impossibile con questi limiti)
     */
    public record Result(List<Day> days, int unscheduled, LocalDate requiredEndDate) {
        public boolean feasible() { return unscheduled == 0; }
    }

    // Oltre i 10 anni smettiamo di cercare una data di fine
    static final int MAX_DAYS = 3650;

    private MarathonScheduler() {}

    public static Result plan(List<Unit> units, LocalDate from, LocalDate to, Rules rules) {
        List<Day> days = new ArrayList<>();
        if (units.isEmpty()) return new Result(days, 0, from);

        int dailyFilmLimit = Math.max(1, (int) Math.ceil(rules.maxFilmsPerWeek() / 7.0));
        int index = 0;
        int unscheduled = 0;
        LocalDate lastUsed = null;
        LocalDate currentWeek = null;
        int weekFilms = 0;

        for (int offset = 0; offset < MAX_DAYS && index < units.size(); offset++) {
            LocalDate date = from.plusDays(offset);
            LocalDate week = date.with(DayOfWeek.MONDAY);
            if (!week.equals(currentWeek)) {
                currentWeek = week;
                weekFilms = 0;
            }

            // Un'unità che non potrà mai essere piazzata (limite a 0) blocca tutto: piano impossibile
            Unit next = units.get(index);
            if ((next.film() && rules.maxFilmsPerWeek() <= 0) || (!next.film() && rules.maxEpisodesPerDay() <= 0)) break;

            List<Unit> today = new ArrayList<>();
            int filmsToday = 0, episodesToday = 0;
            while (index < units.size()) {
                Unit unit = units.get(index);
                boolean fits = unit.film()
                        ? filmsToday < dailyFilmLimit && weekFilms < rules.maxFilmsPerWeek() && (rules.mixedDays() || episodesToday == 0)
                        : episodesToday < rules.maxEpisodesPerDay() && (rules.mixedDays() || filmsToday == 0);
                // Un titolo non ancora uscito si aspetta (e con lui tutto quello che viene dopo)
                if (unit.availableFrom() != null && date.isBefore(unit.availableFrom())) fits = false;
                if (!fits) break; // l'ordine di visione non si salta: il resto va al giorno dopo
                today.add(unit);
                if (unit.film()) { filmsToday++; weekFilms++; } else { episodesToday++; }
                index++;
            }

            if (!today.isEmpty()) {
                lastUsed = date;
                if (!date.isAfter(to)) days.add(new Day(date, today));
                else unscheduled += pending(today);
            }
        }

        unscheduled += pending(units.subList(index, units.size())); // quello che non è stato piazzato neanche oltre la data di fine
        LocalDate required = index == units.size() ? lastUsed : null;
        return new Result(days, unscheduled, required);
    }

    // Le unità già spuntate non contano tra quelle ancora da piazzare
    private static int pending(List<Unit> units) {
        return (int) units.stream().filter(u -> !u.done()).count();
    }
}
