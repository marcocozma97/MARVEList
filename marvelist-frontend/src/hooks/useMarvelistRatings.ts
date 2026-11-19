import { useEffect, useState } from 'react';
import { communityService, type MediaRatings } from '../services/communityService';

// Voti MARVEList di un titolo; "refresh" cambia quando l'utente vota, così la media si aggiorna subito
export const useMarvelistRatings = (mediaId: number | undefined, refresh: unknown): MediaRatings | null => {
  const [data, setData] = useState<{ mediaId: number; ratings: MediaRatings } | null>(null);
  useEffect(() => {
    if (!mediaId) return;
    let active = true;
    communityService.getRatings(mediaId)
      .then(ratings => { if (active) setData({ mediaId, ratings }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [mediaId, refresh]);
  return data && data.mediaId === mediaId ? data.ratings : null;
};
