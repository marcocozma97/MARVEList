import { api } from './api';
import { FAQ_KNOWLEDGE } from '../utils/faq';

export type JairvisReplyStatus = 'OK' | 'LIMIT' | 'MAINTENANCE' | 'ERROR';

export interface JairvisReply {
  reply: string;
  status: JairvisReplyStatus;
  nextAskAt: string | null;
}

export interface JairvisStatus {
  available: boolean;
  nextAskAt: string | null;
  maintenance: boolean;
  suggestions: string[];
}

export const jairvisService = {
  status: async (): Promise<JairvisStatus> => (await api.get('/jairvis/status')).data,

  sendMessage: async (message: string): Promise<JairvisReply> => {
    try {
      // Le FAQ viaggiano con ogni domanda, così J.A.I.R.V.I.S. risponde sempre in linea con la pagina FAQ
      const response = await api.post('/jairvis/ask', { prompt: message, faq: FAQ_KNOWLEDGE });
      return response.data;
    } catch (error) {
      console.error("Errore di comunicazione con J.A.I.R.V.I.S.", error);
      return { reply: "Errore di sistema. Impossibile connettersi ai server Stark al momento.", status: 'ERROR', nextAskAt: null };
    }
  }
};
