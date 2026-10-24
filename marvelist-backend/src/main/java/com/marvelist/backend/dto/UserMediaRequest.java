package com.marvelist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserMediaRequest {
    private Long tmdbId;
    private String mediaType; // "movie" o "tv"
    private boolean watched;
    private boolean inWatchlist;
    private Double rating; // Ricezione precisa dei voti
}