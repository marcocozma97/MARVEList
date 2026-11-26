import { Link } from 'react-router-dom';
import type { MediaItem } from '../services/mediaService';
import { getPosterUrl } from '../utils/poster';
import PosterFallback from './PosterFallback';

export const TopPoster = ({ media, size = 'w342' }: { media: MediaItem; size?: string }) => {
  const url = getPosterUrl(media.posterPath, size);
  return url
    ? <img src={url} alt="" loading="lazy" className="cm-poster-img" />
    : <PosterFallback title={media.title} className="cm-poster-img" />;
};

const TopList = ({ items, empty, label, size = 0 }: { items: { media: MediaItem; detail: React.ReactNode }[]; empty: React.ReactNode; label: string; size?: number }) => (
  items.length === 0 ? <div className="empty-box">{empty}</div> : (
    <ol className="release-row top-row-list" aria-label={label}>
      {items.map(({ media, detail }, i) => (
        <li key={media.id}>
          <Link to={`/media/${media.id}`} className="release-card top-card" aria-label={`${i + 1}° posto: ${media.title}`}>
            <span className="top-card-poster">
              <TopPoster media={media} />
              <span className={`top-card-rank ${i < 3 ? 'is-podium' : ''}`} aria-hidden="true">{i + 1}</span>
            </span>
            <span className="release-title">{media.title}</span>
            <span className="top-detail">{detail}</span>
          </Link>
        </li>
      ))}
      {Array.from({ length: Math.max(0, size - items.length) }, (_, k) => items.length + k + 1).map(rank => (
        <li key={`free-${rank}`}>
          <div className="release-card top-card is-free" aria-label={`${rank}° posto: libero`}>
            <span className="top-card-poster">
              <span className="cm-poster-img top-card-free" />
              <span className={`top-card-rank ${rank <= 3 ? 'is-podium' : ''}`} aria-hidden="true">{rank}</span>
            </span>
            <span className="release-title">Posto libero</span>
            <span className="top-detail">Vota un titolo</span>
          </div>
        </li>
      ))}
    </ol>
  )
);

export default TopList;
