package com.marvelist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JairvisRequest {
    private String prompt; // La domanda che l'utente scriverà nel frontend
    private String faq; // Le FAQ di MARVEList in testo semplice, inviate dal frontend
}