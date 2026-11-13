import { useEffect, useState } from 'react';
import { playWatcherSound } from '../utils/sfx';
import watcherAnim from '../assets/watcher_anim.jpg';

const DURATION = 3600;

// L'Osservatore emerge dal buio, gli occhi si accendono sempre di più finché la loro luce
// riempie lo schermo; quando il bagliore svanisce sotto ci sono le FAQ.
const WatcherIntro = ({ onDone }: { onDone: () => void }) => {
  const [leaving, setLeaving] = useState(false);
  // Se la scheda non è in primo piano l'animazione resta in pausa: parte solo quando la si guarda davvero
  const [running, setRunning] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    if (running) return;
    const onVisible = () => { if (document.visibilityState === 'visible') setRunning(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [running]);

  // Il suono parte insieme all'animazione e si ferma se la si salta
  useEffect(() => (running ? playWatcherSound() : undefined), [running]);

  useEffect(() => {
    const skip = () => { setLeaving(true); window.setTimeout(onDone, 250); };
    const onKey = (e: KeyboardEvent) => { if (['Escape', 'Enter', ' '].includes(e.key)) skip(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = running ? window.setTimeout(onDone, DURATION) : undefined;
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onDone, running]);

  return (
    <div
      className={`watcher-intro ${running ? '' : 'is-paused'} ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-label="L'Osservatore: domande frequenti"
      onClick={() => { setLeaving(true); window.setTimeout(onDone, 250); }}
    >
      <div className="watcher-stage" aria-hidden="true">
        <img src={watcherAnim} alt="" className="watcher-face" />
        <span className="watcher-eye is-left" />
        <span className="watcher-eye is-right" />
      </div>
      <span className="watcher-flash" aria-hidden="true" />
      <span className="watcher-quote">«Io osservo. Non interferisco.»</span>
      <span className="watcher-skip">Salta</span>
    </div>
  );
};

export default WatcherIntro;
