import { api } from './api';
import { FAQ_KNOWLEDGE } from '../utils/faq';

export const jairvisService = {
  sendMessage: async (message: string): Promise<string> => {
    try {
      // Le FAQ viaggiano con ogni domanda, così J.A.I.R.V.I.S. risponde sempre in linea con la pagina FAQ
      const response = await api.post('/jairvis/ask', { prompt: message, faq: FAQ_KNOWLEDGE });

      return response.data.reply;
    } catch (error) {
      console.error("Errore di comunicazione con J.A.I.R.V.I.S.", error);
      return "Errore di sistema. Impossibile connettersi ai server Stark al momento.";
    }
  }
};
