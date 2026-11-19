import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { isAndroid, isIos } from '../utils/install';

const ShareIcon = () => (
  <span className="ios-install-share" aria-label="Condividi">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>
  </span>
);

// Guida per installare l'app, nella home sotto "Esplora la Timeline", finché l'app non è installata:
// su iPhone i passaggi di Safari, su Android il pulsante "Installa" (se Chrome lo permette) o i passaggi del menu ⋮
const InstallGuide = () => {
  const { canInstall, installed, install } = useInstallPrompt();
  const [platform] = useState(() => (isIos() ? 'ios' : isAndroid() ? 'android' : 'other'));

  if (installed || (platform === 'other' && !canInstall)) return null;

  return (
    <div className="ios-install-guide" role="note" aria-label="Installa MARVEList">
      <img src="/icon-192.png" alt="" className="ios-install-icon" width={40} height={40} />
      <div className="ios-install-text">
        {platform === 'ios' ? (
          <>
            <strong>Installa MARVEList su iPhone</strong>
            <ol>
              <li>Tocca <ShareIcon /> <strong>Condividi</strong> nella barra del browser</li>
              <li>Scegli <strong>"Aggiungi alla schermata Home"</strong></li>
              <li>Tocca <strong>Aggiungi</strong>: MARVEList comparirà tra le tue app</li>
            </ol>
          </>
        ) : canInstall ? (
          <>
            <strong>Installa MARVEList sul telefono</strong>
            <span className="ios-install-line">Aprila dalla schermata Home, a schermo intero, come un'app.</span>
            <button type="button" className="btn-marvel btn-inline install-guide-btn" onClick={install}>Installa MARVEList</button>
          </>
        ) : (
          <>
            <strong>Installa MARVEList su Android</strong>
            <ol>
              <li>Tocca <strong>⋮</strong> in alto a destra nel browser</li>
              <li>Scegli <strong>"Installa app"</strong> (o <strong>"Aggiungi a schermata Home"</strong>)</li>
              <li>Conferma: MARVEList comparirà tra le tue app</li>
            </ol>
          </>
        )}
      </div>
    </div>
  );
};

export default InstallGuide;
