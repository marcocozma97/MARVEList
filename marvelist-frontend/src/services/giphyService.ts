import axios from 'axios';

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

export interface GifResult {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
  width: number;
  height: number;
}

interface GiphyImage { url: string; width: string; height: string }
interface GiphyGif { id: string; title: string; images: { fixed_height: GiphyImage; fixed_width_small: GiphyImage } }

const toResult = (gif: GiphyGif): GifResult => ({
  id: gif.id,
  title: gif.title,
  previewUrl: gif.images.fixed_width_small.url,
  url: gif.images.fixed_height.url,
  width: Number(gif.images.fixed_height.width),
  height: Number(gif.images.fixed_height.height)
});

export const giphyEnabled = Boolean(GIPHY_API_KEY);

export const giphyService = {
  search: async (query: string): Promise<GifResult[]> => {
    const q = query.trim();
    const response = await axios.get(`${GIPHY_BASE_URL}/${q ? 'search' : 'trending'}`, {
      params: { api_key: GIPHY_API_KEY, limit: 24, rating: 'pg-13', ...(q ? { q, lang: 'it' } : {}) }
    });
    return (response.data.data as GiphyGif[]).map(toResult);
  }
};
