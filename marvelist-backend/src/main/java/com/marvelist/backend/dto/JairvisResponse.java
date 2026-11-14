package com.marvelist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JairvisResponse {
    private String reply; // La risposta generata dall'IA
    private String status; // OK, LIMIT (domanda del giorno già usata), MAINTENANCE (fondi IA esauriti), ERROR
    private int remaining; // 1 se la domanda di oggi è ancora disponibile, altrimenti 0
    private Instant nextAskAt; // Da quando torna disponibile la domanda (null se è già disponibile)
}
