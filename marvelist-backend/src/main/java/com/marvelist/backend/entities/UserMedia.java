package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_media")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "UserMedia" diversi possono appartenere a un singolo "User"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Long tmdbId; // L'ID numerico del film/serie su TMDB

    @Column(nullable = false)
    private String mediaType; // "movie" per i film o "tv" per le serie

    private boolean watched; // Visto o non visto?

    private boolean inWatchlist; // Messo nella lista "Da vedere"?

    private Double rating; // Il voto da 1 a 10 scudi, inclusi i mezzi voti (può essere null se non votato)
}