package com.marvelist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProgressResponse {
    private Long mediaId;
    private boolean seen;
    private boolean favorite;
    private boolean inWatchlist;
    private boolean watchLater; // "Guarda dopo": rimandato, saltato nelle maratone
    private Double rating;
    private Integer minutesWatched;
    private List<Integer> watchedEpisodes;
}
