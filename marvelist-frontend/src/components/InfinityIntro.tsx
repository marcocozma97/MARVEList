import { useEffect, useState } from 'react';

// Le sei Gemme dell'Infinito, ognuna parte da un punto diverso dello schermo
const GEMS = [
  { name: 'Spazio', color: '#3b82f6', rgb: '59, 130, 246' },
  { name: 'Mente', color: '#facc15', rgb: '250, 204, 21' },
  { name: 'Realtà', color: '#ef4444', rgb: '239, 68, 68' },
  { name: 'Potere', color: '#a855f7', rgb: '168, 85, 247' },
  { name: 'Tempo', color: '#22c55e', rgb: '34, 197, 94' },
  { name: 'Anima', color: '#f97316', rgb: '249, 115, 22' },
];

const DURATION = 4200; // totali, dissolvenza finale compresa
const FADE = 550;

interface InfinityIntroProps {
  onDone: () => void;
}

// Schermo nero: le gemme arrivano al centro con una scia del loro colore, si dispongono
// in cerchio e ruotano, poi compare "Il mondo Marvel ti aspetta" e si apre la Timeline.
const InfinityIntro = ({ onDone }: InfinityIntroProps) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const total = reduceMotion ? 1600 : DURATION;
    const fadeTimer = window.setTimeout(() => setLeaving(true), total - FADE);
    const doneTimer = window.setTimeout(onDone, total);

    // Click, Esc, Invio o spazio: si salta l'intro
    const skip = () => { setLeaving(true); window.setTimeout(onDone, 250); };
    const onKey = (e: KeyboardEvent) => { if (['Escape', 'Enter', ' '].includes(e.key)) skip(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onDone]);

  return (
    <div
      className={`infinity-intro ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-label="Il mondo Marvel ti aspetta"
      onClick={() => { setLeaving(true); window.setTimeout(onDone, 250); }}
    >
      <div className="infinity-stage" aria-hidden="true">
        <span className="infinity-burst" />
        <span className="infinity-ring-line" />
        <div className="infinity-ring">
          {GEMS.map((gem, i) => (
            <span
              key={gem.name}
              className="infinity-orbit"
              style={{ '--angle': `${i * 60 - 90}deg`, '--delay': `${i * 0.12}s`, '--gem': gem.color, '--gem-rgb': gem.rgb } as React.CSSProperties}
            >
              <span className="infinity-flight">
                <span className="infinity-trail" />
                <span className="infinity-gem-glow" />
                <span className="infinity-gem" />
              </span>
            </span>
          ))}
        </div>
      </div>
      <p className="infinity-text">Il mondo Marvel ti aspetta</p>
      <span className="infinity-skip">Salta</span>
    </div>
  );
};

export default InfinityIntro;
