// App già aperta dalla schermata Home (installata)
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPhone e iPad (anche iPadOS, che si presenta come Mac con schermo touch)
export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isAndroid = () => /android/i.test(navigator.userAgent);

// Evento di Chrome/Edge/Samsung Internet che permette di aprire la finestra "Installa app".
// Chrome lo invia una sola volta e non subito (dopo che l'utente ha interagito con il sito):
// lo si conserva qui fin dall'avvio, così la home e l'avviso flottante possono usarlo quando vogliono
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  notify();
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  installed = true;
  notify();
});

export const installState = () => ({ canInstall: deferredPrompt !== null, installed: installed || isStandalone() });

export const subscribeInstall = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

// Apre la finestra di installazione del browser; true se l'utente ha accettato
export const promptInstall = async () => {
  const event = deferredPrompt;
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferredPrompt = null;
  if (outcome === 'accepted') installed = true;
  notify();
  return outcome === 'accepted';
};
