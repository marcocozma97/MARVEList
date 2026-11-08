package com.marvelist.backend.entities;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "media")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tmdbId; // L'ID ufficiale di The Movie Database

    private String title;

    private String type; // "FILM" o "SERIE_TV"

    private String phase; // "Fase 1", "Fase 2", "Defenders Saga", ecc.

    private String visionOrder; // "MCU", "FAN" o "GOD"

    private String posterPath; // Il link all'immagine

    private Integer releaseYear;

    private Integer sortOrder; // Posizione nel marvel_data.json: è l'ordine di visione della Timeline

    private Integer episodes; // Numero di episodi (solo SERIE_TV)

    private Integer runtime; // Durata in minuti (solo FILM, arriva da TMDB)

    private Boolean upcoming; // "In arrivo": non ancora uscito, non conta nei progressi del grado

    private LocalDate releaseDate; // Data di uscita (da TMDB) dei titoli in arrivo: serve alle maratone

    private Boolean doomsday; // Fa parte della "Road to Doomsday"

    private String tags; // Tag del JSON separati da virgola (es. "mcu,spiderverse")

    private Instant addedAt;

    private LocalDate releasedOn;

    @Column(columnDefinition = "TEXT")
    private String episodeAirDates;

    private Instant episodesCheckedAt;
}
