import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { mediaService, type MediaItem } from '../services/mediaService';
import { communityService, type Rankings } from '../services/communityService';
import { getPosterUrl } from '../utils/poster';
import { availableFrom, episodeAirDate, formatDay, isUpcoming, todayIso } from '../utils/upcoming';
import PosterFallback from '../components/PosterFallback';
import SlowLoader from '../components/SlowLoader';

const MAX_RELEASES = 12;
const RECENT_TITLE_DAYS = 30;   // film e serie usciti nell'ultimo mese
const RECENT_EPISODE_DAYS = 14; // nuovi episodi delle ultime due settimane

interface Release {
  key: string;
  media: MediaItem;
  date: string | null; // yyyy-mm-dd
  label: string;
  to: string;
}

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return todayIso(d);
};

const shortDay = (iso: string) => formatDay(iso, { day: 'numeric', month: 'short' });

const airDates = (media: MediaItem) => (media.episodeAirDates ?? '').split(',').map(d => d.trim());

// Prossime uscite: titoli in arrivo e prossimo episodio delle serie in corso
const upcomingReleases = (media: MediaItem[], today: string): Release[] => {
  const titles: Release[] = media.filter(m => isUpcoming(m, today)).map(m => {
    const date = availableFrom(m);
    return {
      key: `t-${m.id}`, media: m, date,
      label: m.releaseDate ? formatDay(m.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' }) : `Nel ${m.releaseYear}`,
      to: `/media/${m.id}`,
    };
  });
  const episodes: Release[] = media.filter(m => m.type === 'SERIE_TV' && !isUpcoming(m, today) && m.episodeAirDates).flatMap(m => {
    const next = airDates(m).findIndex(d => d > today);
    if (next < 0) return [];
    const date = episodeAirDate(m, next + 1);
    return date ? [{ key: `e-${m.id}`, media: m, date, label: `Ep. ${next + 1} · ${shortDay(date)}`, to: `/media/${m.id}/episodes/${next + 1}` }] : [];
  });
  return [...titles, ...episodes]
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
    .slice(0, MAX_RELEASES);
};

// Usciti da poco: titoli arrivati nell'ultimo mese e ultimo episodio uscito nelle ultime due settimane
const recentReleases = (media: MediaItem[], today: string): Release[] => {
  const titleSince = daysAgo(RECENT_TITLE_DAYS);
  const episodeSince = daysAgo(RECENT_EPISODE_DAYS);
  const titles: Release[] = media
    .filter(m => m.releaseDate && m.releaseDate >= titleSince && m.releaseDate <= today)
    .map(m => ({ key: `t-${m.id}`, media: m, date: m.releaseDate, label: `Uscito il ${shortDay(m.releaseDate!)}`, to: `/media/${m.id}` }));
  const withTitle = new Set(titles.map(t => t.media.id));
  const episodes: Release[] = media.filter(m => m.type === 'SERIE_TV' && m.episodeAirDates && !withTitle.has(m.id)).flatMap(m => {
    const dates = airDates(m);
    let last = -1;
    dates.forEach((d, i) => { if (d && d >= episodeSince && d <= today) last = i; });
    if (last < 0) return [];
    return [{ key: `e-${m.id}`, media: m, date: dates[last], label: `Nuovo ep. ${last + 1} · ${shortDay(dates[last])}`, to: `/media/${m.id}/episodes/${last + 1}` }];
  });
  return [...titles, ...episodes]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, MAX_RELEASES);
};

const Poster = ({ media, size = 'w342' }: { media: MediaItem; size?: string }) => {
  const url = getPosterUrl(media.posterPath, size);
  return url
    ? <img src={url} alt="" loading="lazy" className="cm-poster-img" />
    : <PosterFallback title={media.title} className="cm-poster-img" />;
};

const ReleaseRow = ({ items, empty }: { items: Release[]; empty: string }) => (
  items.length === 0 ? <div className="empty-box">{empty}</div> : (
    <div className="release-row">
      {items.map(r => (
        <Link key={r.key} to={r.to} className="release-card">
          <Poster media={r.media} />
          <span className="release-title">{r.media.title}</span>
          <span className="release-label">{r.label}</span>
        </Link>
      ))}
    </div>
  )
);

const TopList = ({ items, empty }: { items: { media: MediaItem; detail: React.ReactNode }[]; empty: string }) => (
  items.length === 0 ? <div className="empty-box">{empty}</div> : (
    <ol className="top-list">
      {items.map(({ media, detail }, i) => (
        <li key={media.id}>
          <Link to={`/media/${media.id}`} className="top-row">
            <span className={`top-rank ${i < 3 ? 'is-podium' : ''}`}>{i + 1}</span>
            <span className="top-poster"><Poster media={media} size="w154" /></span>
            <span className="top-info">
              <span className="top-title">{media.title}</span>
              <span className="top-detail">{detail}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
);

const CommunityPage = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [rankings, setRankings] = useState<Rankings>({ topWatched: [], topRated: [], updatedAt: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    Promise.all([
      mediaService.getAllMedia(),
      communityService.getRankings().catch((): Rankings => ({ topWatched: [], topRated: [], updatedAt: null })),
    ]).then(([all, ranks]) => {
      if (!active) return;
      setMedia(all);
      setRankings(ranks);
    }).catch(err => console.error('Errore nel caricamento della Community', err))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (isLoading) return <SlowLoader text="Collegamento con la rete degli Avengers..." />;

  const today = todayIso();
  const byId = new Map(media.map(m => [m.id, m]));
  const watchedItems = rankings.topWatched.flatMap(t => {
    const m = byId.get(t.mediaId);
    return m ? [{ media: m, detail: t.users === 1 ? '1 utente questa settimana' : `${t.users} utenti questa settimana` }] : [];
  });
  const ratedItems = rankings.topRated.flatMap(t => {
    const m = byId.get(t.mediaId);
    return m ? [{
      media: m,
      detail: <><strong className="top-vote">★ {t.average.toFixed(1).replace('.', ',')}</strong> · {t.count === 1 ? '1 voto' : `${t.count} voti`}</>,
    }] : [];
  });

  return (
    <div className="container page community-page">
      <h1 className="page-title">Community</h1>

      <section className="profile-section">
        <div className="section-heading">
          <h2 className="section-title">Prossime uscite</h2>
          <span className="section-hint">Film, serie e nuovi episodi in arrivo</span>
        </div>
        <ReleaseRow items={upcomingReleases(media, today)} empty="Nessuna uscita in programma per ora." />
      </section>

      <section className="profile-section">
        <div className="section-heading">
          <h2 className="section-title">Usciti da poco</h2>
          <span className="section-hint">Titoli dell'ultimo mese e nuovi episodi delle ultime due settimane</span>
        </div>
        <ReleaseRow items={recentReleases(media, today)} empty="Nessuna novità nelle ultime settimane." />
      </section>

      <p className="rankings-updated">
        Classifiche aggiornate ogni ora{rankings.updatedAt ? ` · ultimo aggiornamento alle ${new Date(rankings.updatedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : ''}
      </p>
      <div className="top-grid">
        <section className="profile-section">
          <div className="section-heading">
            <h2 className="section-title">Top 10 visti della settimana</h2>
            <span className="section-hint">Persone che negli ultimi 7 giorni hanno segnato il titolo come visto</span>
          </div>
          <TopList items={watchedItems} empty="Ancora nessuna visione questa settimana: segna qualcosa come visto e apri la classifica!" />
        </section>

        <section className="profile-section">
          <div className="section-heading">
            <h2 className="section-title">Top 10 più votati</h2>
            <span className="section-hint">Voto MARVEList di ogni titolo, solo con almeno 5 voti</span>
          </div>
          <TopList items={ratedItems} empty="Ancora nessun titolo con almeno 5 voti: vota con gli scudi i titoli che hai visto!" />
        </section>
      </div>
    </div>
  );
};

export default CommunityPage;
