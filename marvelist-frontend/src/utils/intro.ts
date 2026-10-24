// Intro delle Gemme dell'Infinito: una volta per sessione, alla prima apertura della Timeline
// e di nuovo dopo ogni login. sessionStorage può non essere disponibile (navigazione privata): in quel caso niente intro.
const SEEN = 'marvelist_intro_seen';
const PENDING = 'marvelist_intro_pending';

const storage = () => {
  try { return window.sessionStorage; } catch { return null; }
};

// Da chiamare subito dopo login/registrazione: rimette in coda l'intro della Timeline
export const markIntroPending = () => {
  try {
    storage()?.removeItem(SEEN);
    storage()?.setItem(PENDING, '1');
  } catch { /* storage bloccato: nessuna intro */ }
};

export const shouldShowIntro = (pathname: string) => {
  try {
    const s = storage();
    if (!s) return false;
    if (s.getItem(PENDING)) return true;
    return pathname === '/timeline' && !s.getItem(SEEN);
  } catch {
    return false;
  }
};

// Al logout l'intro in sospeso non deve restare per il prossimo utente
export const clearIntroPending = () => {
  try { localStorage.removeItem('marvelist_bugle_pending'); } catch { /* chiave delle vecchie versioni */ }
  try { storage()?.removeItem(PENDING); } catch { /* ignorato */ }
};

export const markIntroSeen = () => {
  try {
    storage()?.setItem(SEEN, '1');
    storage()?.removeItem(PENDING);
  } catch { /* ignorato */ }
};
