package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Maratona personale: elenco ordinato di titoli da vedere tra due date, con limiti di film/episodi
@Entity
@Table(name = "marathons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Marathon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    // Immagine caricata (data URL compressa dal frontend) oppure locandina di un titolo
    @Column(columnDefinition = "TEXT")
    private String background;

    private String visionOrder; // Partenza: "MCU", "FAN" o "GOD"

    private LocalDate startDate;

    private LocalDate endDate;

    private boolean hideSeen; // "Non mostrare i contenuti già visti" al momento della creazione

    private boolean mixedDays; // Film e serie TV nello stesso giorno

    private int maxFilmsPerWeek;

    private int maxEpisodesPerDay;

    @Builder.Default
    @OneToMany(mappedBy = "marathon", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<MarathonItem> items = new ArrayList<>();
}
