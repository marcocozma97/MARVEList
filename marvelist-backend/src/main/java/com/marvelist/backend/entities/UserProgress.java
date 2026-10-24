package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

// Progresso personale di un utente su un titolo: minuti visti (film), episodi visti (serie) e voto
@Entity
@Table(name = "user_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "media_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    private Double rating; // Da 0.5 a 10 (mezzi voti inclusi), null se non votato

    @Builder.Default
    private Integer minutesWatched = 0;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "user_progress_episodes", joinColumns = @JoinColumn(name = "progress_id"))
    @Column(name = "episode_number")
    private Set<Integer> watchedEpisodes = new HashSet<>();

    // Un film iniziato o una serie con almeno un episodio visto
    public boolean isStarted() {
        return (minutesWatched != null && minutesWatched > 0) || !watchedEpisodes.isEmpty();
    }
}
