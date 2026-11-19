package com.marvelist.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MediaJsonDTO {
    private String id;
    private String title;
    private Integer year;
    private Integer phase;
    private Integer chrono;    // Posizione nell'ordine cronologico della storia (solo MCU)
    private String chronoEra;  // Epoca della storia in cui si raggruppa nell'ordine cronologico
    private String type;
    private List<String> tags;
    private Integer tmdbId;
    private Integer episodes;
    private Boolean doomsday;
    private Boolean inArrivo;
}
