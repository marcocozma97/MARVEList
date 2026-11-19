import { api } from './api';

// Esito dell'importazione di un salvataggio
export interface ImportResult {
  titles: number;
  marathons: number;
  following: number;
  nicknameRestored: boolean;
  notFound: string[];
}

export const accountService = {
  // Tutti i dati del profilo, da salvare come file JSON
  exportData: async (): Promise<unknown> => (await api.get('/account/export')).data,

  importData: async (backup: unknown): Promise<ImportResult> => (await api.post('/account/import', backup)).data,

  deleteAccount: async (password: string): Promise<void> => {
    await api.post('/account/delete', { password });
  },
};

// Scarica il salvataggio come file .json
export const downloadBackup = async (nickname: string) => {
  const data = await accountService.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const safeName = nickname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profilo';
  const link = document.createElement('a');
  link.href = url;
  link.download = `marvelist-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
