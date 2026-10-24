import { useEffect, useState } from 'react';
import { mediaService, type MediaItem, type MediaProgress } from '../services/mediaService';

// Stato di visione dell'utente condiviso da Timeline e Road To: catalogo, visti, preferiti, "guarda dopo", progressi
export const useWatchState = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [seenItems, setSeenItems] = useState<number[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<number[]>([]);
  const [watchLaterItems, setWatchLaterItems] = useState<number[]>([]);
  const [progressById, setProgressById] = useState<Record<number, MediaProgress>>({});
  const [bulkPhase, setBulkPhase] = useState<string | null>(null); // fase in aggiornamento
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // I dati personali falliscono se non si è loggati
        const [mediaData, seenData, favData, laterData, progressData] = await Promise.all([
          mediaService.getAllMedia(),
          mediaService.getSeenIds().catch((): number[] => []),
          mediaService.getFavorites().catch((): number[] => []),
          mediaService.getWatchLater().catch((): number[] => []),
          mediaService.getAllProgress().catch((): MediaProgress[] => [])
        ]);
        setMediaList(mediaData);
        setSeenItems(seenData);
        setFavoriteItems(favData);
        setWatchLaterItems(laterData);
        setProgressById(Object.fromEntries(progressData.map(p => [p.mediaId, p])));
      } catch (err) {
        console.error('Errore nel recupero del catalogo', err);
        setError('Impossibile contattare i database Stark. Protocolli offline.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const toggleIn = (list: number[], id: number) => list.includes(id) ? list.filter(item => item !== id) : [...list, id];

  const applyProgress = (list: MediaProgress[]) => setProgressById(prev => {
    const next = { ...prev };
    list.forEach(p => { next[p.mediaId] = p; });
    return next;
  });

  const toggleSeen = async (id: number) => {
    setSeenItems(prev => toggleIn(prev, id));
    try {
      applyProgress([await mediaService.toggleSeen(id)]);
    } catch {
      setSeenItems(prev => toggleIn(prev, id));
    }
  };

  const toggleFavorite = async (id: number) => {
    setFavoriteItems(prev => toggleIn(prev, id));
    try {
      await mediaService.toggleFavorite(id);
    } catch {
      setFavoriteItems(prev => toggleIn(prev, id));
    }
  };

  // Presa visione dell'intera fase: se è tutto visto la azzera (voti e preferiti restano)
  const toggleSeenPhase = async (phase: string, items: MediaItem[]) => {
    const ids = items.map(m => m.id);
    const markSeen = !ids.every(id => seenItems.includes(id));
    const previous = seenItems;
    setBulkPhase(phase);
    setSeenItems(prev => markSeen ? [...new Set([...prev, ...ids])] : prev.filter(id => !ids.includes(id)));
    try {
      applyProgress(await mediaService.setSeenBulk(ids, markSeen));
    } catch {
      setSeenItems(previous);
    } finally {
      setBulkPhase(null);
    }
  };

  // "Guarda dopo" non ancora visto: il titolo resta visibile ma non conta nel completamento della fase
  const isSkipped = (id: number) => watchLaterItems.includes(id) && !seenItems.includes(id);

  return { mediaList, seenItems, favoriteItems, watchLaterItems, progressById, bulkPhase, isLoading, error, isSkipped, toggleSeen, toggleFavorite, toggleSeenPhase };
};

export type WatchState = ReturnType<typeof useWatchState>;
