package com.marvelist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressRequest {
    private Integer minutesWatched; // Solo FILM
    private List<Integer> watchedEpisodes; // Solo SERIE_TV
}
