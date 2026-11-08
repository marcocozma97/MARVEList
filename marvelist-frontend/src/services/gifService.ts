import axios from 'axios';

const KLIPY_API_KEY = import.meta.env.VITE_KLIPY_API_KEY;
const KLIPY_BASE_URL = 'https://api.klipy.com/api/v1';

export interface GifResult {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
}

interface KlipyFile { url: string; width: number; height: number }
interface KlipyFormats { gif?: KlipyFile; webp?: KlipyFile }
interface KlipyItem { id: number | string; title?: string; file?: { md?: KlipyFormats; sm?: KlipyFormats } }

const pick = (formats?: KlipyFormats) => formats?.webp?.url || formats?.gif?.url;

const toResult = (item: KlipyItem): GifResult | null => {
  const url = pick(item.file?.md) || pick(item.file?.sm);
  const previewUrl = pick(item.file?.sm) || url;
  return url && previewUrl ? { id: String(item.id), title: item.title ?? '', previewUrl, url } : null;
};

export const gifsEnabled = Boolean(KLIPY_API_KEY);

export const gifService = {
  search: async (query: string): Promise<GifResult[]> => {
    const q = query.trim();
    const response = await axios.get(`${KLIPY_BASE_URL}/${KLIPY_API_KEY}/gifs/${q ? 'search' : 'trending'}`, {
      params: { page: 1, per_page: 24, locale: 'it', content_filter: 'medium', ...(q ? { q } : {}) }
    });
    const items = (response.data?.data?.data ?? []) as KlipyItem[];
    return items.map(toResult).filter((gif): gif is GifResult => gif !== null);
  }
};
