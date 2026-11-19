import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const DISMISS_KEY = 'marvelist:install-dismissed';
const DISMISS_DAYS = 30;

const recentlyDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

// Avviso flottante con il pulsante "Installa", quando il browser lo permette (Chrome su Android).
// Nella home non compare: lì c'è già la guida sotto "Esplora la Timeline"
const InstallPrompt = () => {
  const { canInstall, installed, install } = useInstallPrompt();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(recentlyDismissed);

  if (!canInstall || installed || dismissed || pathname === '/') return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* memoria non disponibile */ }
    setDismissed(true);
  };

  return (
    <div className="install-prompt" role="dialog" aria-label="Installa MARVEList">
      <img src="/icon-192.png" alt="" className="install-prompt-icon" width={44} height={44} />
      <div className="install-prompt-text">
        <strong>Installa MARVEList</strong>
        <span>Aprila dalla schermata Home, a schermo intero, come un'app.</span>
      </div>
      <button type="button" className="btn-marvel btn-inline install-prompt-btn" onClick={install}>Installa</button>
      <button type="button" className="install-prompt-close" onClick={dismiss} aria-label="Chiudi">×</button>
    </div>
  );
};

export default InstallPrompt;
