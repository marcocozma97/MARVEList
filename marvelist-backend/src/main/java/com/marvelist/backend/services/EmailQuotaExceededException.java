package com.marvelist.backend.services;

// Gmail ha esaurito gli invii disponibili: la mail non è partita, ma non per colpa dell'utente
public class EmailQuotaExceededException extends RuntimeException {
    public EmailQuotaExceededException(String message) {
        super(message);
    }
}
