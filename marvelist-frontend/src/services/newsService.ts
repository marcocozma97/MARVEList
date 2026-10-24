import { api } from './api';

export interface NewsArticle {
  title: string;
  source: string;
  link: string;        // articolo originale sul sito della testata
  publishedAt: string; // ISO 8601
}

export const newsService = {
  getLatest: async (): Promise<NewsArticle[]> => {
    const response = await api.get('/news');
    return response.data;
  },
};
