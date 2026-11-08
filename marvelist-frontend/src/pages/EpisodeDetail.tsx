import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { mediaService, type MediaItem, type MediaProgress } from '../services/mediaService';
import { tmdbService, type TmdbDetails, type TmdbEpisode } from '../services/tmdbService';
import ShieldRating from '../components/ShieldRating';
import Community from '../components/Community';
import { isUpcoming, releaseLabel } from '../utils/upcoming';
import { seasonNumber, seriesTitle } from '../utils/community';

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const EpisodeDetail = () => {
  const { id, episode: episodeParam } = useParams<{ id: string; episode: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const episode = Number(episodeParam);

  const [media, setMedia] = useState<MediaItem | null>(null);
  const [series, setSeries] = useState<Partial<TmdbDetails>>({});
  const [loaded, setLoaded] = useState<{ episode: number; data: TmdbEpisode | null } | null>(null);
  const [progress, setProgress] = useState<MediaProgress | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const progressRequest = useRef(0);

  useEffect(() => {
    let active = true;
    mediaService.getMediaById(Number(id))
      .then(async m => {
        if (!active) return;
        setMedia(m);
        if (isAuthenticated) {
          mediaService.getProgress(m.id).then(p => active && setProgress(p)).catch(() => undefined);
          mediaService.getEpisodeRatings(m.id).then(r => active && setRatings(r)).catch(() => undefined);
        }
        if (m.tmdbId) tmdbService.getDetails(m.tmdbId, 'SERIE_TV').then(s => active && setSeries(s)).catch(() => undefined);
      })
      .catch(() => active && setMedia(null))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!media?.tmdbId) return;
    let active = true;
    tmdbService.getEpisode(media.tmdbId, seasonNumber(media.title), episode)
      .then(data => { if (active) setLoaded({ episode, data }); });
    window.scrollTo({ top: 0 });
    return () => { active = false; };
  }, [media, episode]);

  const isDetailsLoading = !!media?.tmdbId && loaded?.episode !== episode;
  const details = loaded?.episode === episode ? loaded.data : null;

  const close = useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(`/media/${id}`);
  }, [navigate, id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isEditable(e.target)) close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  if (isLoading) {
    return <div className="page-loader"><div className="spinner-border text-danger" role="status"></div></div>;
  }

  const total = media?.episodes ?? series.number_of_episodes ?? 0;
  if (!media || media.type !== 'SERIE_TV' || !Number.isInteger(episode) || episode < 1 || (total > 0 && episode > total)) {
    return (
      <div className="container page-empty">
        <h3>Episodio non trovato.</h3>
        <Link to={media ? `/media/${media.id}` : '/timeline'} className="btn-marvel btn-inline mt-3">Torna alla scheda</Link>
      </div>
    );
  }

  const upcoming = isUpcoming(media);
  const season = seasonNumber(media.title);
  const show = series.name || seriesTitle(media.title);
  const watched = progress?.watchedEpisodes.includes(episode) ?? false;
  const rating = ratings[episode] ?? null;
  const name = details?.name && !/^Episodio \d+$/i.test(details.name) ? details.name : `Episodio ${episode}`;
  const overview = details?.overview?.trim();
  const airDate = details?.air_date ? new Date(details.air_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const tmdbVote = details?.vote_average && details.vote_average > 0 ? details.vote_average.toFixed(1) : null;
  const backdrop = details?.still_path || series.backdrop_path;
  const goTo = (n: number) => navigate(`/media/${media.id}/episodes/${n}`, { replace: true });

  const saveEpisodes = async (episodes: number[]) => {
    if (!progress) return;
    const previous = progress;
    const request = ++progressRequest.current;
    setProgress({ ...progress, watchedEpisodes: episodes, seen: total > 0 && episodes.length >= total });
    try {
      const saved = await mediaService.updateProgress(media.id, { watchedEpisodes: episodes });
      if (request === progressRequest.current) setProgress(saved);
    } catch {
      if (request === progressRequest.current) setProgress(previous);
    }
  };

  const toggleWatched = () => {
    if (!progress) return;
    const list = progress.watchedEpisodes;
    saveEpisodes(watched ? list.filter(e => e !== episode) : [...list, episode].sort((a, b) => a - b));
  };

  const watchAndNext = () => {
    if (!progress) return;
    if (!watched) saveEpisodes([...progress.watchedEpisodes, episode].sort((a, b) => a - b));
    goTo(episode + 1);
  };

  const rate = async (value: number | null) => {
    const previous = ratings;
    setRatings(r => {
      const next = { ...r };
      if (value === null) delete next[episode];
      else next[episode] = value;
      return next;
    });
    try { setRatings(await mediaService.rateEpisode(media.id, episode, value)); }
    catch { setRatings(previous); }
  };

  return (
    <div className="detail-page episode-page">
      <div
        className={`detail-backdrop ${backdrop ? '' : 'is-empty'}`}
        style={backdrop ? { backgroundImage: `url(https://image.tmdb.org/t/p/w1280${backdrop})` } : undefined}
        aria-hidden="true"
      />

      <div className="container detail-container">
        <section className="detail-panel" aria-labelledby="episode-title">
          <div className="detail-top-actions">
            {progress && !upcoming && (
              <button
                type="button"
                className={`seen-circle seen-circle-lg ${watched ? 'active' : ''}`}
                onClick={toggleWatched}
                aria-pressed={watched}
                aria-label={watched ? 'Segna come non visto' : 'Segna come visto'}
                title={watched ? 'Segna come non visto' : 'Segna come visto'}
              />
            )}
            <button type="button" className="close-btn" onClick={close} aria-label="Chiudi e torna alla stagione" title="Chiudi">×</button>
          </div>

          <div className="detail-body episode-body">
            <div className="episode-still-wrap">
              {details?.still_path ? (
                <img className="episode-still" src={`https://image.tmdb.org/t/p/w780${details.still_path}`} alt={`Immagine di ${name}`} />
              ) : (
                <div className={`episode-still is-empty ${isDetailsLoading ? 'is-loading' : ''}`} aria-hidden="true">
                  <span className="episode-still-number">{episode}</span>
                  <span className="episode-still-label">Episodio</span>
                </div>
              )}
            </div>

            <div className="detail-info">
              <span className="detail-kicker">
                <Link to={`/media/${media.id}`} className="episode-kicker-link">{show}</Link> · Stagione {season} · Episodio {episode}{total ? ` di ${total}` : ''}
              </span>
              <h1 id="episode-title" className="detail-title">{name}</h1>

              <div className="detail-chips">
                {airDate && <span className="chip chip-accent">{airDate}</span>}
                {upcoming && <span className="chip chip-upcoming">In arrivo · {releaseLabel(media)}</span>}
                {details?.runtime ? <span className="chip">{details.runtime} min</span> : null}
                {tmdbVote && <span className="chip chip-gold">★ {tmdbVote} TMDB</span>}
                {watched && <span className="chip chip-success">✔ Visto</span>}
                {rating !== null && <span className="chip">Il tuo voto: {String(rating).replace('.', ',')}</span>}
              </div>

              {isDetailsLoading ? (
                <div className="episode-overview-skeleton" aria-busy="true"><span /><span /><span /></div>
              ) : (
                <p className={`detail-overview ${overview ? '' : 'is-missing'}`}>{overview || 'Sinossi non disponibile per questo episodio.'}</p>
              )}

              {!isAuthenticated && (
                <p className="detail-login-hint"><Link to="/login">Accedi</Link> per votare l'episodio e segnarlo come visto.</p>
              )}

              {upcoming && (
                <div className="upcoming-note">
                  <strong>In arrivo</strong>
                  <span>La stagione non è ancora uscita: quando sarà disponibile potrai segnare e votare i singoli episodi.</span>
                </div>
              )}

              {progress && !upcoming && (
                <div className="detail-block">
                  <h2 className="section-label">Il tuo voto all'episodio</h2>
                  <ShieldRating value={rating} onChange={rate} />
                </div>
              )}

              <nav className="episode-nav" aria-label="Episodi della stagione">
                <button type="button" className="btn-ghost episode-nav-btn" onClick={() => goTo(episode - 1)} disabled={episode <= 1}>
                  <span aria-hidden="true">←</span> Precedente
                </button>
                <Link to={`/media/${media.id}`} className="btn-ghost episode-nav-btn episode-nav-all">Tutti gli episodi</Link>
                {progress && !upcoming && !watched && total > 0 && episode < total ? (
                  <button type="button" className="btn-marvel btn-inline episode-nav-btn" onClick={watchAndNext}>
                    Visto, vai al prossimo <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <button type="button" className="btn-ghost episode-nav-btn" onClick={() => goTo(episode + 1)} disabled={total > 0 && episode >= total}>
                    Successivo <span aria-hidden="true">→</span>
                  </button>
                )}
              </nav>
            </div>
          </div>
        </section>

        <Community key={`${media.id}-${episode}`} mediaId={media.id} episode={episode} kind="episode" seen={watched} />
      </div>
    </div>
  );
};

export default EpisodeDetail;
