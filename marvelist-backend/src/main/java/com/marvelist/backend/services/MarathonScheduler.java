package com.marvelist.backend.services;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;

// Calcola il calendario di una maratona: distribuisce, nell'ordine di visione, i film e gli episodi
// ancora da vedere sui giorni disponibili rispettando i limiti scelti dall'utente.
// Si parte sempre da oggi: ciò che non è stato visto nei giorni passati scivola da solo sui giorni successivi.
// Le unità spuntate oggi (done) restano nel giorno di oggi, barrate, senza occupare i giorni successivi.
// Gli episodi non ancora usciti con una data nota (pinned) vanno esattamente nel giorno della loro uscita.
public final class MarathonScheduler {

    // availableFrom: per i titoli "in arrivo" il giorno di uscita, prima del quale non si può vedere
    public record Unit(Long mediaId, Integer episode, boolean film, LocalDate availableFrom, boolean done, boolean pinned) {
        public Unit(Long mediaId, Integer episode, boolean film, LocalDate availableFrom, boolean done) { this(mediaId, episode, film, availableFrom, done, false); }
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

    public static Result plan(List<Unit> allUnits, LocalDate from, LocalDate to, Rules rules) {
        List<Day> days = new ArrayList<>();
        if (allUnits.isEmpty()) return new Result(days, 0, from);
        List<Unit> doneToday = allUnits.stream().filter(Unit::done).toList();
        TreeMap<LocalDate, List<Unit>> pinned = new TreeMap<>();
        List<Unit> units = new ArrayList<>();
        for (Unit unit : allUnits) {
            if (unit.done()) continue;
            if (unit.pinned() && unit.availableFrom() != null && unit.availableFrom().isAfter(from)) {
                pinned.computeIfAbsent(unit.availableFrom(), d -> new ArrayList<>()).add(unit);
            } else {
                units.add(unit);
            }
        }
        if (units.isEmpty() && pinned.isEmpty()) {
            days.add(new Day(from, doneToday));
            return new Result(days, 0, from);
        }
        LocalDate lastPinned = pinned.isEmpty() ? null : pinned.lastKey();

        int dailyFilmLimit = Math.max(1, (int) Math.ceil(rules.maxFilmsPerWeek() / 7.0));
        int index = 0;
        int unscheduled = 0;
        LocalDate lastUsed = null;
        LocalDate currentWeek = null;
        int weekFilms = 0;
        boolean blocked = false;

        for (int offset = 0; offset < MAX_DAYS; offset++) {
            LocalDate date = from.plusDays(offset);
            boolean flowLeft = index < units.size() && !blocked;
            if (!flowLeft && (lastPinned == null || date.isAfter(lastPinned))) break;
            LocalDate week = date.with(DayOfWeek.MONDAY);
            if (!week.equals(currentWeek)) {
                currentWeek = week;
                weekFilms = 0;
            }

            List<Unit> today = new ArrayList<>();
            int filmsToday = 0, episodesToday = 0;
            if (offset == 0) {
                today.addAll(doneToday);
                filmsToday = (int) doneToday.stream().filter(Unit::film).count();
                episodesToday = doneToday.size() - filmsToday;
                weekFilms += filmsToday;
            }
            List<Unit> pinnedToday = pinned.getOrDefault(date, List.of());
            today.addAll(pinnedToday);
            episodesToday += pinnedToday.size();

            if (flowLeft) {
                // Un'unità che non potrà mai essere piazzata (limite a 0) blocca tutto: piano impossibile
                Unit next = units.get(index);
                if ((next.film() && rules.maxFilmsPerWeek() <= 0) || (!next.film() && rules.maxEpisodesPerDay() <= 0)) {
                    blocked = true;
                } else {
                    while (index < units.size()) {
                        Unit unit = units.get(index);
                        boolean fits = unit.film()
                                ? filmsToday < dailyFilmLimit && weekFilms < rules.maxFilmsPerWeek() && (rules.mixedDays() || episodesToday == 0)
                                : episodesToday < rules.maxEpisodesPerDay() && (rules.mixedDays() || filmsToday == 0);
                        // Un titolo non ancora uscito senza data precisa si aspetta (e con lui tutto quello che viene dopo)
                        if (unit.availableFrom() != null && date.isBefore(unit.availableFrom())) fits = false;
                        if (!fits) break; // l'ordine di visione non si salta: il resto va al giorno dopo
                        today.add(unit);
                        if (unit.film()) { filmsToday++; weekFilms++; } else { episodesToday++; }
                        index++;
                    }
                }
            }

            today.sort(java.util.Comparator.comparingInt(allUnits::indexOf));
            if (today.stream().anyMatch(u -> !u.done())) {
                lastUsed = date;
                if (!date.isAfter(to)) days.add(new Day(date, today));
                else unscheduled += pending(today);
            } else if (!today.isEmpty()) {
                days.add(new Day(date, today));
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
