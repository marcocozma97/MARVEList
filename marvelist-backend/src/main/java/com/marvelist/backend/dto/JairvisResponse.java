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
    private String status; // OK, LIMIT (domande del giorno esaurite), MAINTENANCE (fondi IA esauriti), ERROR
    private int remaining; // Domande ancora disponibili nelle ultime 24 ore
    private Instant nextAskAt; // Da quando torna disponibile una domanda (null se ce n'è ancora una)
}
