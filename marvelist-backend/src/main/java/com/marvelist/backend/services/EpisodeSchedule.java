package com.marvelist.backend.services;

import com.marvelist.backend.entities.Media;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

public final class EpisodeSchedule {

    public static final ZoneId ZONE = ZoneId.of("Europe/Rome");

    private EpisodeSchedule() {}

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static List<LocalDate> dates(Media media) {
        List<LocalDate> dates = new ArrayList<>();
        String raw = media.getEpisodeAirDates();
        if (raw == null || raw.isBlank()) return dates;
        for (String part : raw.split(",", -1)) {
            dates.add(part.isBlank() ? null : LocalDate.parse(part.strip()));
        }
        return dates;
    }

    public static String encode(List<LocalDate> dates) {
        return String.join(",", dates.stream().map(d -> d == null ? "" : d.toString()).toList());
    }

    public static boolean isOut(Media media, LocalDate today) {
        if (!Boolean.TRUE.equals(media.getUpcoming())) return true;
        return media.getReleaseDate() != null && !media.getReleaseDate().isAfter(today);
    }

    public static boolean isEpisodeOut(Media media, int episode, LocalDate today) {
        if (!isOut(media, today)) return false;
        List<LocalDate> dates = dates(media);
        if (dates.isEmpty()) return true;
        LocalDate date = episode <= dates.size() ? dates.get(episode - 1) : null;
        if (date != null) return !date.isAfter(today);
        return dates.stream().noneMatch(d -> d != null && d.isAfter(today));
    }

    public static boolean isFullyOut(Media media, LocalDate today) {
        if (!isOut(media, today)) return false;
        if (media.getEpisodes() == null) return true;
        for (int ep = 1; ep <= media.getEpisodes(); ep++) {
            if (!isEpisodeOut(media, ep, today)) return false;
        }
        return true;
    }

    public static boolean needsRefresh(Media media, LocalDate today) {
        if (media.getEpisodesCheckedAt() == null) return true;
        if (Boolean.TRUE.equals(media.getUpcoming())) return true;
        List<LocalDate> dates = dates(media);
        if (media.getEpisodes() != null && dates.size() < media.getEpisodes()) return true;
        return dates.stream().anyMatch(d -> d == null || d.isAfter(today.minusDays(1)));
    }
}
