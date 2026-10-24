// Stesse regole del backend (RegisterRequest): il controllo qui serve solo a dare subito l'errore all'utente

// Email con dominio ed estensione (es. nome@dominio.it)
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

// Almeno 6 caratteri, di cui almeno uno speciale (né lettera, né numero, né spazio)
export const PASSWORD_RULE = 'Almeno 6 caratteri, di cui almeno uno speciale (es. ! ? @ # $ %)';
export const isValidPassword = (password: string) => password.length >= 6 && /[^A-Za-z0-9\s]/.test(password);
