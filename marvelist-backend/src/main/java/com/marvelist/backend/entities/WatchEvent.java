package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

// Quando un utente segna come visto un film o nuovi episodi di una serie: serve alla "Top 10 visti della settimana"
@Entity
@Table(name = "watch_events", indexes = @Index(columnList = "watched_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    @Column(name = "watched_at", nullable = false)
    private Instant watchedAt;
}
