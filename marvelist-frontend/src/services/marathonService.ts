import { api } from './api';
import { PROGRESS_CHANGED_EVENT } from './mediaService';
import type { VisionOrder } from '../utils/ordering';

export interface MarathonRequest {
  name: string;
  background: string | null;
  visionOrder: VisionOrder;
  startDate: string; // yyyy-mm-dd
  endDate: string;
  hideSeen: boolean;
  mixedDays: boolean;
  maxFilmsPerWeek: number;
  maxEpisodesPerDay: number;
  mediaIds: number[];
}

export interface MarathonPlan {
  feasible: boolean;
  requiredEndDate: string | null;
  totalFilms: number;
  totalEpisodes: number;
  remainingUnits: number;
  unscheduledUnits: number;
  scheduledDays: number;
  message: string | null;
}

export interface MarathonSummary {
  id: number;
  name: string;
  background: string | null;
  visionOrder: VisionOrder;
  startDate: string;
  endDate: string;
  totalUnits: number;
  doneUnits: number;
  feasible: boolean;
  nextDate: string | null;
  expectedEnd: string | null;
}

export interface MarathonUnit {
  mediaId: number;
  title: string;
  type: 'FILM' | 'SERIE_TV';
  posterPath: string | null;
  episode: number | null;
  runtime: number | null;
  done: boolean; // spuntato oggi: resta nel giorno, barrato, fino a domani
}

export interface MarathonDay {
  date: string;
  units: MarathonUnit[];
}

export interface MarathonItem {
  mediaId: number;
  title: string;
  type: 'FILM' | 'SERIE_TV';
  posterPath: string | null;
  episodes: number | null;
  done: boolean;
  doneEpisodes: number[];
  watchLater: boolean; // in "Guarda dopo": saltato nel calendario e nel conteggio
}

export interface MarathonDetail extends Omit<MarathonSummary, 'feasible' | 'nextDate'> {
  expectedEnd: string | null;
  hideSeen: boolean;
  mixedDays: boolean;
  maxFilmsPerWeek: number;
  maxEpisodesPerDay: number;
  items: MarathonItem[];
  days: MarathonDay[];
  plan: MarathonPlan;
}

export const marathonService = {
  list: async (): Promise<MarathonSummary[]> => (await api.get('/marathons')).data,

  get: async (id: number): Promise<MarathonDetail> => (await api.get(`/marathons/${id}`)).data,

  // Controlla date e limiti senza salvare
  preview: async (data: MarathonRequest): Promise<MarathonPlan> => (await api.post('/marathons/preview', data)).data,

  create: async (data: MarathonRequest): Promise<MarathonDetail> => (await api.post('/marathons', data)).data,

  update: async (id: number, data: MarathonRequest): Promise<MarathonDetail> => (await api.put(`/marathons/${id}`, data)).data,

  remove: async (id: number): Promise<void> => { await api.delete(`/marathons/${id}`); },

  // Spunta (o annulla) un film o un episodio
  check: async (id: number, mediaId: number, episode: number | null, done: boolean): Promise<MarathonDetail> => {
    const response = await api.post(`/marathons/${id}/check`, { mediaId, episode, done });
    window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT));
    return response.data;
  },
};
