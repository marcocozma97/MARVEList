import { useEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';

// Memoria di una pagina per la sessione: quando si apre un titolo e si torna indietro
// la pagina viene ricreata da zero, quindi filtri, fasi aperte e scroll vanno salvati a parte.
// sessionStorage può non essere disponibile (navigazione privata): in quel caso si riparte dai default.
const PREFIX = 'marvelist_page_';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try { window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* ignorato */ }
};

// Come useState, ma il valore sopravvive all'uscita dalla pagina
export const usePageState = <T,>(key: string | null, initial: T) => {
  const [value, setValue] = useState<T>(() => key ? read(key, initial) : initial);
  useEffect(() => { if (key) write(key, value); }, [key, value]);
  return [value, setValue] as const;
};

// Salva lo scroll della finestra e lo ripristina quando si torna indietro (freccia del browser o pulsante "indietro")
export const useScrollMemory = (key: string, ready: boolean) => {
  const navigationType = useNavigationType();
  const restored = useRef(navigationType !== 'POP'); // arrivando da un link si parte dall'alto

  useEffect(() => {
    const onScroll = () => { if (restored.current) write(key + '_scroll', window.scrollY); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [key]);

  useEffect(() => {
    if (!ready || restored.current) return;
    const y = read(key + '_scroll', 0);
    // Un frame di attesa: le card devono essere già disegnate
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'instant' });
      restored.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [key, ready]);
};
