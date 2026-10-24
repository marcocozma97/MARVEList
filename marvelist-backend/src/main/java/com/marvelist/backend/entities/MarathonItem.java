package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

// Un titolo dentro una maratona, con ciò che è già stato spuntato (film intero o singoli episodi)
@Entity
@Table(name = "marathon_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarathonItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marathon_id", nullable = false)
    private Marathon marathon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    private int position;

    private boolean done; // Solo FILM

    private LocalDate doneDate; // Solo FILM: giorno della spunta (fino a fine giornata resta nel calendario, barrato)

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "marathon_item_episodes", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "episode_number")
    private Set<Integer> doneEpisodes = new HashSet<>(); // Solo SERIE_TV

    // Solo SERIE_TV: giorno della spunta di ogni episodio
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "marathon_item_episode_dates", joinColumns = @JoinColumn(name = "item_id"))
    @MapKeyColumn(name = "episode_number")
    @Column(name = "done_date")
    private Map<Integer, LocalDate> episodeDoneDates = new HashMap<>();
}
