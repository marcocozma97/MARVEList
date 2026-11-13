import { useEffect, useState } from 'react';
import IronRunner from './IronRunner';

const GAME_DELAY = 1500;

interface SlowLoaderProps {
  text?: string;
  inline?: boolean;
}

// Caricamento: se i dati non arrivano subito (per esempio il server si sta risvegliando)
// sotto lo spinner compare il minigioco di Iron Man per ingannare l'attesa.
const SlowLoader = ({ text = 'Caricamento protocolli in corso...', inline = false }: SlowLoaderProps) => {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), GAME_DELAY);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`${inline ? 'page-loader-inline' : 'page-loader'} slow-loader`} role="status" aria-live="polite">
      <div className="spinner-border text-danger" aria-hidden="true"></div>
      <p className="slow-loader-text">{text}</p>
      {slow && (
        <div className="slow-loader-game">
          <p className="slow-loader-hint">I server Stark si stanno risvegliando: intanto aiuta Iron Man a non cadere.</p>
          <IronRunner />
        </div>
      )}
    </div>
  );
};

export default SlowLoader;
