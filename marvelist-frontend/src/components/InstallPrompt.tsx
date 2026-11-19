import { useEffect, useState } from 'react';
import { isStandalone } from '../utils/install';

// Evento di Chrome/Edge/Samsung Internet che permette di aprire la finestra "Installa app"
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

// Invito a installare l'app con il pulsante "Installa" (Android e browser che lo supportano).
// Su iPhone non esiste un pulsante automatico: la guida è nella home, sotto "Esplora la Timeline"
const InstallPrompt = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => isStandalone() || recentlyDismissed());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* memoria non disponibile */ }
    setHidden(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === 'accepted') setHidden(true);
  };

  if (hidden || !installEvent) return null;

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
