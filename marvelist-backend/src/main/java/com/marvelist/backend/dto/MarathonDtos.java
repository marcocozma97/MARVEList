package com.marvelist.backend.dto;

import java.time.LocalDate;
import java.util.List;

// DTO delle maratone (record: immutabili e serializzati da Jackson così come sono)
public final class MarathonDtos {

    private MarathonDtos() {}

    // Creazione/modifica (e anteprima del piano prima di salvare)
    public record MarathonRequest(
            String name,
            String background,
            String visionOrder,
            LocalDate startDate,
            LocalDate endDate,
            boolean hideSeen,
            boolean mixedDays,
            int maxFilmsPerWeek,
            int maxEpisodesPerDay,
            List<Long> mediaIds
    ) {}

    // Esito della pianificazione: se non c'è tempo, requiredEndDate dice fino a quando servirebbe
    public record PlanResponse(
            boolean feasible,
            LocalDate requiredEndDate,
            int totalFilms,
            int totalEpisodes,
            int remainingUnits,
            int unscheduledUnits,
            int scheduledDays,
            String message
    ) {}

    public record MarathonSummary(
            Long id,
            String name,
            String background,
            String visionOrder,
            LocalDate startDate,
            LocalDate endDate,
            int totalUnits,
            int doneUnits,
            boolean feasible,
            LocalDate nextDate,
            LocalDate expectedEnd
    ) {}

    public record ItemResponse(
            Long mediaId,
            String title,
            String type,
            String posterPath,
            Integer episodes,
            boolean done,
            List<Integer> doneEpisodes,
            boolean watchLater // in "Guarda dopo": saltato nel calendario e nel conteggio
    ) {}

    // done: spuntato oggi, resta nel calendario di oggi (barrato) fino a domani
    public record UnitResponse(Long mediaId, String title, String type, String posterPath, Integer episode, Integer runtime, boolean done) {}

    public record DayResponse(LocalDate date, List<UnitResponse> units) {}

    public record MarathonDetail(
            Long id,
            String name,
            String background,
            String visionOrder,
            LocalDate startDate,
            LocalDate endDate,
            boolean hideSeen,
            boolean mixedDays,
            int maxFilmsPerWeek,
            int maxEpisodesPerDay,
            int totalUnits,
            int doneUnits,
            List<ItemResponse> items,
            List<DayResponse> days,
            PlanResponse plan,
            LocalDate expectedEnd
    ) {}

    public record PublicMarathon(
            Long id,
            String name,
            String background,
            String visionOrder,
            LocalDate startDate,
            LocalDate endDate,
            List<Long> mediaIds
    ) {}

    // Spunta (o annulla) un film o un episodio della maratona
    public record CheckRequest(Long mediaId, Integer episode, boolean done) {}
}
