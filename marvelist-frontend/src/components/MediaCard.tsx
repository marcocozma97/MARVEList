import { useNavigate } from 'react-router-dom';
import type { MediaItem } from '../services/mediaService';
import MediaPoster from './MediaPoster';
import { isUpcoming, releaseLabel } from '../utils/upcoming';

interface MediaCardProps {
  media: MediaItem;
  seen?: boolean;
  favorite?: boolean;
  watchLater?: boolean; // "Guarda dopo": bordo giallo attorno alla locandina
  rating?: number | null;
  progress?: number | null; // 0-100, per la watchlist
  onToggleSeen?: () => void;
  onToggleFavorite?: () => void;
}

// Card locandina in stile "vetro": titolo sopra la sfumatura, cuore a sinistra, cerchio visto a destra
const MediaCard = ({ media, seen = false, favorite = false, watchLater = false, rating, progress, onToggleSeen, onToggleFavorite }: MediaCardProps) => {
  const navigate = useNavigate();
  const open = () => navigate(`/media/${media.id}`);
  // Titolo non ancora uscito: fascia "IN ARRIVO" e niente cerchio visto/barra di avanzamento
  const upcoming = isUpcoming(media);

  return (
    <article className={`media-card ${seen ? 'is-seen' : ''} ${upcoming ? 'is-upcoming' : ''} ${watchLater ? 'is-watch-later' : ''}`}>
      <button type="button" className="media-card-open" onClick={open} aria-label={`Apri ${media.title}`}>
        <MediaPoster media={media} className="media-card-poster" />
        <span className="media-card-overlay" />
        {upcoming && (
          <span className="media-card-upcoming">
            <span className="media-card-upcoming-band">In arrivo</span>
            {/* Sotto la fascia: data precisa se TMDB la conosce, altrimenti l'anno */}
            <span className="media-card-upcoming-date">{releaseLabel(media)}</span>
          </span>
        )}
        <span className="media-card-content">
          {rating != null && <span className="media-card-rating">🛡 {String(rating).replace('.', ',')}</span>}
          {watchLater && <span className="media-card-later">Guarda dopo</span>}
          <span className="media-card-title">{media.title}</span>
          <span className="media-card-meta">{media.type === 'FILM' ? 'Film' : 'Serie TV'} · {media.releaseYear}</span>
        </span>
      </button>

      {onToggleFavorite && (
        <button
          type="button"
          className={`favorite-circle ${favorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          title={favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        >♥</button>
      )}

      {onToggleSeen && !upcoming && (
        <button
          type="button"
          className={`seen-circle ${seen ? 'active' : ''}`}
          onClick={onToggleSeen}
          aria-pressed={seen}
          aria-label={seen ? 'Segna come non visto' : 'Segna come visto'}
          title={seen ? 'Segna come non visto' : 'Segna come visto'}
        />
      )}

      {progress != null && !upcoming && (
        <span className="media-card-progress" aria-label={`Visto al ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </span>
      )}
    </article>
  );
};

export default MediaCard;
