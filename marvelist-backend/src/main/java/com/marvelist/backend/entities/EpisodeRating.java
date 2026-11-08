package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "episode_ratings", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "media_id", "episode_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpisodeRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    @Column(name = "episode_number", nullable = false)
    private Integer episodeNumber;

    @Column(nullable = false)
    private Double rating;
}
