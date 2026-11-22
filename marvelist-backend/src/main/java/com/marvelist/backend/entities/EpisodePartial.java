package com.marvelist.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EpisodePartial {
    @Column(name = "minutes")
    private Integer minutes;

    @Column(name = "runtime")
    private Integer runtime;
}
