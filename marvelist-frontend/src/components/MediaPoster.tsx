import { useState, useEffect, useRef } from 'react';
import { mediaService, type MediaItem } from '../services/mediaService';
import { tmdbService } from '../services/tmdbService';
import { getPosterUrl } from '../utils/poster';
import PosterFallback from './PosterFallback';

// Cache in memoria: evita di ripetere la ricerca TMDB per lo stesso titolo tra una pagina e l'altra
const resolvedPosters = new Map<number, string | null>();

interface MediaPosterProps {
  media: MediaItem;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  showTitle?: boolean; // titolo dentro la locandina provvisoria (dove non c'è già un'etichetta)
}

const MediaPoster = ({ media, className = 'media-poster', style, onClick, showTitle = false }: MediaPosterProps) => {
  const [posterPath, setPosterPath] = useState<string | null>(media.posterPath || resolvedPosters.get(media.id) || null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Se manca la locandina, la cerchiamo su TMDB solo quando la card diventa visibile
  useEffect(() => {
    if (posterPath || resolvedPosters.has(media.id) || !frameRef.current) return;

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      const found = await tmdbService.findPoster(media);
      resolvedPosters.set(media.id, found?.posterPath ?? null);
      if (!found) return;

      setPosterPath(found.posterPath);
      // Salviamo nel DB così la prossima volta arriva già dal backend
      mediaService.syncTmdbData(media.id, found.tmdbId, found.posterPath).catch(console.error);
    }, { rootMargin: '200px' });

    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [media, posterPath]);

  const url = getPosterUrl(posterPath);
  const showImage = url && url !== failedUrl;
  // Le locandine TMDB sono percorsi relativi: un URL completo è una locandina provvisoria
  const isProvisional = Boolean(showImage && posterPath?.startsWith('http'));

  return (
    <div
      ref={frameRef}
      className={`poster-frame ${isProvisional ? 'is-provisional' : ''} ${className}`}
      style={{
        cursor: onClick ? 'pointer' : undefined,
        ...(isProvisional ? { '--poster-bg': `url("${url}")` } as React.CSSProperties : {}),
        ...style
      }}
      onClick={onClick}
    >
      {showImage ? (
        <img src={url} alt={media.title} loading="lazy" onError={() => setFailedUrl(url)} />
      ) : (
        // Nessuna locandina (né TMDB né Wikipedia): simbolo CSS legato al titolo
        <PosterFallback title={media.title} showTitle={showTitle} />
      )}
    </div>
  );
};

export default MediaPoster;
