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
    private String type;
    private List<String> tags;
    private Integer tmdbId;
    private Integer episodes;
    private Boolean doomsday;
    private Boolean inArrivo;
}
