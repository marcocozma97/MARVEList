package com.marvelist.backend.auth;

// Almeno 6 caratteri, di cui almeno uno speciale (né lettera, né numero, né spazio): registrazione, cambio e recupero
public final class PasswordRules {
    public static final String REGEX = "^(?=.*[^A-Za-z0-9\\s]).{6,}$";
    public static final String MESSAGE = "La password deve avere almeno 6 caratteri, di cui almeno uno speciale";

    private PasswordRules() {}
}
