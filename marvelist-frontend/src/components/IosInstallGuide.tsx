import { useState } from 'react';
import { isIos, isStandalone } from '../utils/install';

// Guida per installare l'app su iPhone e iPad (Apple non ha un pulsante "Installa"):
// si vede nella home, sotto "Esplora la Timeline", solo finché l'app non è installata
const IosInstallGuide = () => {
  const [visible] = useState(() => isIos() && !isStandalone());
  if (!visible) return null;

  return (
    <div className="ios-install-guide" role="note" aria-label="Installa MARVEList su iPhone">
      <img src="/icon-192.png" alt="" className="ios-install-icon" width={40} height={40} />
      <div className="ios-install-text">
        <strong>Installa MARVEList su iPhone</strong>
        <ol>
          <li>
            Tocca <span className="ios-install-share" aria-label="Condividi">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>
            </span> <strong>Condividi</strong> nella barra del browser
          </li>
          <li>Scegli <strong>"Aggiungi alla schermata Home"</strong></li>
          <li>Tocca <strong>Aggiungi</strong>: MARVEList comparirà tra le tue app</li>
        </ol>
      </div>
    </div>
  );
};

export default IosInstallGuide;
