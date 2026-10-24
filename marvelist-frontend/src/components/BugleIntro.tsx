import { useEffect, useState } from 'react';
import { SpiderArt } from './RoadCharacters';

// Ritagli di giornale che riempiono lo schermo prima delle News
const ARTICLES: { headline: string; kicker: string; photo?: boolean; tall?: boolean }[] = [
  { kicker: 'Esclusiva', headline: 'Spider-Man: eroe o minaccia?', photo: true, tall: true },
  { kicker: 'Cronaca', headline: 'Uomo in armatura avvistato sopra Manhattan' },
  { kicker: 'Editoriale', headline: 'Jameson: «Voglio foto di quel ragno!»' },
  { kicker: 'Città', headline: 'Strano portale si apre al Greenwich Village' },
  { kicker: 'Esteri', headline: 'Il Wakanda apre i suoi confini al mondo' },
  { kicker: 'Scienza', headline: 'Il Multiverso esiste davvero?', tall: true },
  { kicker: 'Politica', headline: 'Doctor Doom minaccia le Nazioni Unite' },
  { kicker: 'Sport', headline: 'Un dio del tuono batte ogni record di lancio del martello' },
  { kicker: 'Ultim\'ora', headline: 'Gli Avengers salvano di nuovo la città' },
  { kicker: 'Lettere', headline: 'Lettori divisi sul vigilante in maschera' },
  { kicker: 'Economia', headline: 'Stark Industries annuncia nuove tecnologie' },
  { kicker: 'Meteo', headline: 'Tempeste improvvise: c\'entra Asgard?' },
  { kicker: 'Cultura', headline: 'Le maratone Marvel conquistano New York' },
  { kicker: 'Annunci', headline: 'Cercasi fotografo: pagamento in contanti' },
];

const DURATION = 3000;

// Schermo pieno di articoli con la testata DAILY BUGLE; poi una ragnatela scende dall'alto
// e li porta via tutti insieme, rivelando le News.
const BugleIntro = ({ onDone }: { onDone: () => void }) => {
  const [leaving, setLeaving] = useState(false);
  // Se la scheda non è in primo piano l'animazione resta in pausa: parte solo quando la si guarda davvero
  const [running, setRunning] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    if (running) return;
    const onVisible = () => { if (document.visibilityState === 'visible') setRunning(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [running]);

  useEffect(() => {
    const skip = () => { setLeaving(true); window.setTimeout(onDone, 250); };
    const onKey = (e: KeyboardEvent) => { if (['Escape', 'Enter', ' '].includes(e.key)) skip(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Il conto alla rovescia (e quindi il "già vista") parte solo con l'animazione in corso
    const timer = running ? window.setTimeout(onDone, DURATION) : undefined;
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onDone, running]);

  return (
    <div
      className={`bugle-intro ${running ? '' : 'is-paused'} ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-label="Daily Bugle: ultime notizie"
      onClick={() => { setLeaving(true); window.setTimeout(onDone, 250); }}
    >
      <div className="bugle-stage" aria-hidden="true">
        <div className="bugle-articles">
          {ARTICLES.map((a, i) => (
            <article
              key={a.headline}
              className={`bugle-article ${a.tall ? 'is-tall' : ''}`}
              style={{ '--i': i, '--tilt': `${((i * 37) % 7) - 3}deg` } as React.CSSProperties}
            >
              <span className="bugle-article-kicker">{a.kicker}</span>
              <h3>{a.headline}</h3>
              {a.photo && <span className="bugle-photo"><SpiderArt /></span>}
              <span className="bugle-lines" />
            </article>
          ))}
        </div>

        <div className="bugle-masthead">
          <span className="bugle-masthead-top">New York · Edizione speciale</span>
          <span className="bugle-masthead-title">Daily Bugle</span>
          <span className="bugle-masthead-sub">Le ultime notizie dal mondo Marvel</span>
        </div>

        {/* La ragnatela scende dall'alto, si attacca ai giornali e li porta via */}
        <svg className="bugle-web" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: 13 }, (_, k) => {
            const x = -20 + k * 11.66;
            return <path key={`s${k}`} d={`M50 -8 L${x} 108`} />;
          })}
          {[18, 36, 56, 78, 100].map(r => {
            const pts = Array.from({ length: 13 }, (_, k) => {
              const x = -20 + k * 11.66;
              const t = r / 116;
              return [50 + (x - 50) * t, -8 + 116 * t];
            });
            const d = pts.reduce((acc, [x, y], k) => {
              if (k === 0) return `M${x} ${y}`;
              const [px, py] = pts[k - 1];
              return `${acc} Q${(px + x) / 2} ${(py + y) / 2 - 3} ${x} ${y}`; // il filo "cede" un po'
            }, '');
            return <path key={`r${r}`} d={d} />;
          })}
        </svg>
      </div>
      <span className="bugle-skip">Salta</span>
    </div>
  );
};

export default BugleIntro;
