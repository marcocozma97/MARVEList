package com.marvelist.backend.services;

import com.marvelist.backend.services.CommunityService.TopRated;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CommunityRankingTest {

    @Test
    void aParitaDiVotoPassaSopraChiHaPiuVoti() {
        var ranking = CommunityService.sortTopRated(List.of(
                new TopRated(1L, 8.3, 20),
                new TopRated(2L, 9.0, 5),
                new TopRated(3L, 8.3, 50)));

        assertEquals(List.of(2L, 3L, 1L), ranking.stream().map(TopRated::mediaId).toList());
    }

    @Test
    void restanoSoloIPrimiDieci() {
        var many = LongStream.rangeClosed(1, 15).mapToObj(i -> new TopRated(i, 5 + i * 0.1, 5)).toList();
        var ranking = CommunityService.sortTopRated(many);

        assertEquals(10, ranking.size());
        assertEquals(15L, ranking.get(0).mediaId());
    }
}
