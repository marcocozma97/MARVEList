export const TOKEN_KEY = 'marvelist_token';
const EXPIRED_KEY = 'marvelist:session-expired';

// Scadenza del JWT letta dal token stesso (campo exp, in secondi)
export const tokenExpiresAt = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && expiresAt <= Date.now() + 5000;
};

export const readToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

// Avviso per la pagina di accesso quando la sessione non si è potuta rinnovare
export const markSessionExpired = () => {
  try { sessionStorage.setItem(EXPIRED_KEY, '1'); } catch { /* memoria non disponibile */ }
};

export const wasSessionExpired = () => {
  try { return sessionStorage.getItem(EXPIRED_KEY) === '1'; } catch { return false; }
};

export const clearSessionExpired = () => {
  try { sessionStorage.removeItem(EXPIRED_KEY); } catch { /* memoria non disponibile */ }
};
