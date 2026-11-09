package com.marvelist.backend.services;

import com.marvelist.backend.entities.Media;

import java.util.Collection;
import java.util.Set;

public final class RankCalculator {

    public record RankInfo(String title, String tone) {}

    private record Pool(long seen, long total) {
        boolean done() { return seen >= total; }
        double pct() { return total == 0 ? 1 : (double) seen / total; }
    }

    private RankCalculator() {}

    private static Pool pool(Collection<Media> all, Set<Long> seen, String order) {
        var list = all.stream().filter(m -> order.equals(m.getVisionOrder()) && !Boolean.TRUE.equals(m.getUpcoming())).toList();
        return new Pool(list.stream().filter(m -> seen.contains(m.getId())).count(), list.size());
    }

    public static RankInfo compute(Collection<Media> all, Set<Long> seen) {
        Pool mcu = pool(all, seen, "MCU"), fan = pool(all, seen, "FAN"), god = pool(all, seen, "GOD");

        if (god.seen() > 0 && ((mcu.done() && fan.done()) || god.done())) {
            if (mcu.done() && fan.done() && god.done()) return new RankInfo("GOD OF MARVEL", "infinity");
            double g = god.pct();
            if (g >= 0.75) return new RankInfo("Multiverse Avenger", "sky-4");
            if (g >= 0.5) return new RankInfo("Galaxy Avenger", "sky-3");
            if (g >= 0.25) return new RankInfo("Universe Avenger", "sky-2");
            return new RankInfo("Solar Avenger", "sky-1");
        }
        if (mcu.done() && fan.seen() > 0) {
            if (fan.done()) return new RankInfo("Planet Avenger", "yellow-bright");
            if (fan.pct() >= 0.5) return new RankInfo("Avenger OG", "yellow");
            return new RankInfo("Avenger", "yellow");
        }
        if (mcu.seen() > 0) {
            if (mcu.done()) return new RankInfo("Eroe", "red-bright");
            if (mcu.pct() >= 0.5) return new RankInfo("Generale S.H.I.E.L.D.", "red");
            return new RankInfo("Soldato S.H.I.E.L.D.", "red");
        }
        return new RankInfo("Recluta S.H.I.E.L.D.", "grey");
    }
}
