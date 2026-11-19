package com.marvelist.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

// File JSON scaricato da "Modifica profilo": tutto ciò che l'utente ha fatto su MARVEList.
// I titoli sono identificati da titolo e anno (gli ID cambiano tra un database e l'altro).
public record AccountBackup(
        String format,
        int version,
        Instant exportedAt,
        Profile profile,
        List<TitleData> titles,
        List<MarathonData> marathons,
        List<String> following,
        List<CommentData> comments
) {
    public static final String FORMAT = "marvelist-backup";
    public static final int VERSION = 1;

    public record Profile(String name, String surname, String nickname, String avatar) {}

    public record TitleData(
            String title,
            Integer year,
            String type,
            boolean seen,
            boolean favorite,
            boolean watchLater,
            Double rating,
            Integer minutesWatched,
            List<Integer> watchedEpisodes,
            Map<Integer, Double> episodeRatings
    ) {}

    public record MarathonData(
            String name,
            String background,
            String visionOrder,
            LocalDate startDate,
            LocalDate endDate,
            boolean hideSeen,
            boolean mixedDays,
            int maxFilmsPerWeek,
            int maxEpisodesPerDay,
            List<MarathonItemData> items
    ) {}

    public record MarathonItemData(
            String title,
            Integer year,
            int position,
            boolean done,
            LocalDate doneDate,
            List<Integer> doneEpisodes,
            Map<Integer, LocalDate> episodeDoneDates
    ) {}

    // Solo da conservare: i commenti non vengono ripubblicati con l'importazione
    public record CommentData(String title, Integer year, Integer episode, String text, String gifUrl,
                              boolean spoiler, Instant createdAt, boolean reply) {}

    // Esito dell'importazione mostrato all'utente
    public record ImportResult(int titles, int marathons, int following, boolean nicknameRestored, List<String> notFound) {}
}
