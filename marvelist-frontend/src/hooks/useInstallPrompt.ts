import { useSyncExternalStore } from 'react';
import { installState, promptInstall, subscribeInstall } from '../utils/install';

let snapshot = installState();
const getSnapshot = () => {
  const next = installState();
  if (next.canInstall !== snapshot.canInstall || next.installed !== snapshot.installed) snapshot = next;
  return snapshot;
};

// Stato dell'installazione dell'app (PWA) e azione per aprire la finestra "Installa" del browser
export const useInstallPrompt = () => {
  const state = useSyncExternalStore(subscribeInstall, getSnapshot);
  return { ...state, install: promptInstall };
};
