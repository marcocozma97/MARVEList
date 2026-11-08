import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { mediaService, type MediaItem, type MediaProgress } from '../services/mediaService';
import { tmdbService, type TmdbDetails } from '../services/tmdbService';
import { POSTER_PLACEHOLDER } from '../utils/poster';
import { shortenOverview } from '../utils/progress';
import ShieldRating from '../components/ShieldRating';
import MediaPoster from '../components/MediaPoster';
import Community from '../components/Community';
import { isUpcoming, releaseLabel } from '../utils/upcoming';
import { matchesVisionOrder, sortByViewingOrder, VISION_ORDER_LABELS, type VisionOrder } from '../utils/ordering';
import { readPageState, writePageState } from '../hooks/usePageMemory';

const EMPTY_PROGRESS = (mediaId: number): MediaProgress => ({
  mediaId, seen: false, favorite: false, inWatchlist: false, watchLater: false, rating: null, minutesWatched: 0, watchedEpisodes: []
});

const MediaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [dbMedia, setDbMedia] = useState<MediaItem | null>(null);
  const [tmdbData, setTmdbData] = useState<Partial<TmdbDetails>>({});
  const [progress, setProgress] = useState<MediaProgress | null>(null);
  const [minutes, setMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const minutesTimer = useRef<number | undefined>(undefined);
  const progressRequest = useRef(0); // Click veloci: applichiamo solo la risposta dell'ultima richiesta
  const [isSavingMinutes, setIsSavingMinutes] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [episodeRatings, setEpisodeRatings] = useState<Record<number, number>>({});
  const [catalog, setCatalog] = useState<MediaItem[]>([]);

  useEffect(() => {
    mediaService.getAllMedia().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const media = await mediaService.getMediaById(Number(id));
        setDbMedia(media);

        // Progressi personali (solo se loggato)
        if (isAuthenticated) {
          mediaService.getProgress(media.id)
            .then(p => { setProgress(p); setMinutes(p.minutesWatched); })
            .catch(() => setProgress(EMPTY_PROGRESS(media.id)));
          if (media.type === 'SERIE_TV') {
            mediaService.getEpisodeRatings(media.id).then(setEpisodeRatings).catch(() => setEpisodeRatings({}));
          }
        }

        let tmdbDetails: TmdbDetails | null = null;
        try {
          tmdbDetails = media.tmdbId
            ? await tmdbService.getDetails(media.tmdbId, media.type)
            : await tmdbService.searchByName(media.title, media.releaseYear, media.type);
        } catch (tmdbError) {
          console.error("Errore TMDB:", tmdbError);
        }

        // Se nel DB mancano ID, locandina, durata o episodi li salviamo da TMDB
        if (tmdbDetails?.poster_path) {
          const runtime = media.type === 'FILM' && !media.runtime && tmdbDetails.runtime ? tmdbDetails.runtime : undefined;
          const episodes = media.type === 'SERIE_TV' && !media.episodes && tmdbDetails.number_of_episodes ? tmdbDetails.number_of_episodes : undefined;
          // Una locandina provvisoria (URL completo da Wikipedia) viene sostituita da quella TMDB
          if (!media.tmdbId || !media.posterPath || media.posterPath.startsWith('http') || runtime || episodes) {
            mediaService.syncTmdbData(media.id, tmdbDetails.id, tmdbDetails.poster_path, { runtime, episodes })
              .then(() => setDbMedia(prev => prev && { ...prev, runtime: prev.runtime ?? runtime ?? null, episodes: prev.episodes ?? episodes ?? null }))
              .catch(console.error);
          }
        }

        setTmdbData(tmdbDetails ?? {});
      } catch (error) {
        console.error("Errore nel recupero dettagli:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetails();
    return () => window.clearTimeout(minutesTimer.current);
  }, [id, isAuthenticated]);

  // X in alto a destra: torna alla pagina precedente (o alla Timeline se si è arrivati da un link diretto)
  const close = useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate('/timeline');
  }, [navigate]);

  const timelineOrder = readPageState<VisionOrder>('timeline_filter', 'MCU');
  const order: VisionOrder = dbMedia && !matchesVisionOrder(dbMedia, timelineOrder) ? dbMedia.visionOrder : timelineOrder;
  const sequence = sortByViewingOrder(catalog.filter(m => matchesVisionOrder(m, order)));
  const position = dbMedia ? sequence.findIndex(m => m.id === dbMedia.id) : -1;
  const prevMedia = position > 0 ? sequence[position - 1] : null;
  const nextMedia = position >= 0 && position < sequence.length - 1 ? sequence[position + 1] : null;

  const goToMedia = useCallback((target: MediaItem | null) => {
    if (!target) return;
    writePageState('timeline_filter', order);
    writePageState('timeline_phases', [target.phase || 'Sconosciuta']);
    writePageState('timeline_focus', target.id);
    navigate(`/media/${target.id}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [navigate, order]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (typing) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') goToMedia(prevMedia);
      else if (e.key === 'ArrowRight') goToMedia(nextMedia);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, goToMedia, prevMedia, nextMedia]);

  if (isLoading) {
    return <div className="page-loader"><div className="spinner-border text-danger" role="status"></div></div>;
  }

  if (!dbMedia) {
    return <div className="container page-empty"><h3>Dati classificati o non trovati.</h3><Link to="/timeline" className="btn-marvel btn-inline mt-3">Torna alla Timeline</Link></div>;
  }

  const isFilm = dbMedia.type === 'FILM';
  const upcoming = isUpcoming(dbMedia); // non ancora uscito: niente visto/voto/progressi
  const runtime: number | null = dbMedia.runtime ?? (isFilm ? tmdbData.runtime : null) ?? null;
  const totalEpisodes: number = dbMedia.episodes ?? tmdbData.number_of_episodes ?? 0;
  const watchedEpisodes = progress?.watchedEpisodes ?? [];
  const allEpisodesSeen = totalEpisodes > 0 && watchedEpisodes.length >= totalEpisodes;

  const hasOverview = Boolean(tmdbData.overview?.trim());
  const overview = hasOverview ? tmdbData.overview! : 'Trama non trovata.';
  const year = tmdbData.release_date?.substring(0, 4) || tmdbData.first_air_date?.substring(0, 4) || dbMedia.releaseYear;
  const tmdbVote = typeof tmdbData.vote_average === 'number' && tmdbData.vote_average > 0 ? tmdbData.vote_average.toFixed(1) : null;
  // Cerca il trailer di YouTube nei risultati (spesso in italiano o in inglese)
  const trailer = tmdbData.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  // Azioni: aggiornamento ottimistico, poi allineamento con la risposta del backend
  const applyServer = (p: MediaProgress) => { setProgress(p); setMinutes(p.minutesWatched); };

  const toggleSeen = async () => {
    if (!progress) return;
    setProgress({ ...progress, seen: !progress.seen });
    try { applyServer(await mediaService.toggleSeen(dbMedia.id)); }
    catch { setProgress(progress); }
  };

  const toggleFavorite = async () => {
    if (!progress) return;
    setProgress({ ...progress, favorite: !progress.favorite });
    try { await mediaService.toggleFavorite(dbMedia.id); }
    catch { setProgress(progress); }
  };

  // "Guarda dopo": il titolo viene saltato nelle maratone e non conta nel completamento delle fasi
  const toggleWatchLater = async () => {
    if (!progress) return;
    setProgress({ ...progress, watchLater: !progress.watchLater });
    try { applyServer(await mediaService.toggleWatchLater(dbMedia.id)); }
    catch { setProgress(progress); }
  };

  const rate = async (rating: number | null) => {
    if (!progress) return;
    setProgress({ ...progress, rating });
    try { applyServer(await mediaService.updateRating(dbMedia.id, rating)); }
    catch { setProgress(progress); }
  };

  // Lo slider cambia solo il valore a schermo: si salva con il pulsante "Salva"
  // (o subito con "Azzera"/"Visto tutto"), e il profilo aggiorna "Continua a guardare"
  const clampMinutes = (value: number) => Math.max(0, Math.min(runtime ?? 600, Math.round(value || 0)));

  const changeMinutes = (value: number) => {
    setMinutes(clampMinutes(value));
    setSaveNote(null);
  };

  const saveMinutes = async (value = minutes) => {
    const next = clampMinutes(value);
    setMinutes(next);
    setIsSavingMinutes(true);
    const request = ++progressRequest.current;
    try {
      const saved = await mediaService.updateProgress(dbMedia.id, { minutesWatched: next });
      if (request === progressRequest.current) {
        applyServer(saved);
        setSaveNote(saved.seen ? '✔ Film segnato come visto' : saved.inWatchlist ? '✔ Salvato in "Continua a guardare"' : '✔ Salvato');
        window.clearTimeout(minutesTimer.current);
        minutesTimer.current = window.setTimeout(() => setSaveNote(null), 3500);
      }
    } catch (e) {
      setSaveNote(null);
      console.error(e);
    } finally {
      setIsSavingMinutes(false);
    }
  };

  const minutesDirty = !!progress && minutes !== progress.minutesWatched;

  const saveEpisodes = async (episodes: number[]) => {
    if (!progress) return;
    const previous = progress;
    const request = ++progressRequest.current;
    setProgress({ ...progress, watchedEpisodes: episodes, seen: totalEpisodes > 0 && episodes.length >= totalEpisodes });
    try {
      const saved = await mediaService.updateProgress(dbMedia.id, { watchedEpisodes: episodes });
      if (request === progressRequest.current) applyServer(saved);
    } catch {
      if (request === progressRequest.current) setProgress(previous);
    }
  };

  const toggleAllEpisodes = () => {
    saveEpisodes(allEpisodesSeen ? [] : Array.from({ length: totalEpisodes }, (_, i) => i + 1));
  };

  const minutesPercent = runtime ? Math.round((minutes / runtime) * 100) : 0;

  return (
    <div className="detail-page">
      <div
        className={`detail-backdrop ${tmdbData.backdrop_path ? '' : 'is-empty'}`}
        style={tmdbData.backdrop_path ? { backgroundImage: `url(https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path})` } : undefined}
        aria-hidden="true"
      />

      <div className="container detail-container">
        <section className="detail-panel" aria-labelledby="detail-title">

          {position >= 0 && (
            <nav className="detail-step" aria-label={`Timeline ${VISION_ORDER_LABELS[order]}`}>
              <button
                type="button"
                className="detail-step-btn detail-step-prev"
                onClick={() => goToMedia(prevMedia)}
                disabled={!prevMedia}
                aria-label={prevMedia ? `Titolo precedente: ${prevMedia.title}` : 'Nessun titolo precedente'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                {prevMedia && <span className="detail-step-label">{prevMedia.title}</span>}
              </button>
              <button
                type="button"
                className="detail-step-btn detail-step-next"
                onClick={() => goToMedia(nextMedia)}
                disabled={!nextMedia}
                aria-label={nextMedia ? `Titolo successivo: ${nextMedia.title}` : 'Nessun titolo successivo'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                {nextMedia && <span className="detail-step-label">{nextMedia.title}</span>}
              </button>
            </nav>
          )}

          {/* In alto a destra: cerchio "visto" e X per tornare indietro */}
          <div className="detail-top-actions">
            {progress && !upcoming && (
              <button
                type="button"
                className={`seen-circle seen-circle-lg ${progress.seen ? 'active' : ''}`}
                onClick={toggleSeen}
                aria-pressed={progress.seen}
                aria-label={progress.seen ? 'Segna come non visto' : 'Segna come visto'}
                title={progress.seen ? 'Segna come non visto' : 'Segna come visto'}
              />
            )}
            <button type="button" className="close-btn" onClick={close} aria-label="Chiudi e torna indietro" title="Chiudi">×</button>
          </div>

          <div className="detail-body">
            <div className="detail-poster-wrap">
              {/* Locandina TMDB, poi quella provvisoria (Wikipedia), infine il simbolo CSS */}
              <MediaPoster
                media={{ ...dbMedia, posterPath: tmdbData.poster_path || dbMedia.posterPath }}
                className={`detail-poster ${progress?.watchLater ? 'is-watch-later' : ''}`}
                showTitle
              />
              {progress && (
                <button
                  type="button"
                  className={`btn-watch-later ${progress.watchLater ? 'active' : ''}`}
                  onClick={toggleWatchLater}
                  aria-pressed={progress.watchLater}
                  title={progress.watchLater ? 'Torna a contarlo nelle fasi e nelle maratone' : 'Saltalo nelle maratone e nel completamento delle fasi'}
                >
                  {progress.watchLater ? '✔ In "Guarda dopo"' : '⏱ Guarda dopo'}
                </button>
              )}
            </div>

            <div className="detail-info">
              <span className="detail-kicker">{dbMedia.phase} · {isFilm ? 'Film' : 'Serie TV'}</span>
              <div className="detail-title-row">
                <h1 id="detail-title" className="detail-title">{tmdbData.title || tmdbData.name || dbMedia.title}</h1>
                {progress && (
                  <button
                    type="button"
                    className={`favorite-toggle ${progress.favorite ? 'active' : ''}`}
                    onClick={toggleFavorite}
                    aria-pressed={progress.favorite}
                    aria-label={progress.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                    title={progress.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                  >♥</button>
                )}
              </div>

              <div className="detail-chips">
                <span className="chip chip-accent">{year}</span>
                {upcoming && <span className="chip chip-upcoming">In arrivo · {releaseLabel(dbMedia)}</span>}
                {isFilm && runtime ? <span className="chip">{runtime} min</span> : null}
                {!isFilm && totalEpisodes > 0 ? <span className="chip">{totalEpisodes} episodi</span> : null}
                <span className="chip">{dbMedia.visionOrder}</span>
                {tmdbVote && <span className="chip chip-gold">★ {tmdbVote} TMDB</span>}
                {progress?.seen && <span className="chip chip-success">✔ Visto</span>}
                {progress?.inWatchlist && <span className="chip chip-info">In corso</span>}
                {progress?.watchLater && <span className="chip chip-later">Guarda dopo</span>}
              </div>

              <p className={`detail-overview ${hasOverview ? "" : "is-missing"}`} title={overview}>{shortenOverview(overview)}</p>

              {!isAuthenticated && (
                <p className="detail-login-hint"><Link to="/login">Accedi</Link> per votare e tracciare cosa hai visto.</p>
              )}

              {upcoming && (
                <div className="upcoming-note">
                  <strong>In arrivo</strong>
                  <span>Uscita prevista: {releaseLabel(dbMedia)}. Quando sarà disponibile potrai segnarlo come visto, votarlo e tracciare i progressi. Intanto puoi aggiungerlo ai preferiti.</span>
                </div>
              )}

              {progress && !upcoming && (
                <>
                  <div className="detail-block">
                    <h2 className="section-label">Il tuo voto</h2>
                    <ShieldRating value={progress.rating} onChange={rate} />
                  </div>

                  {/* PROGRESSO: minuti per i film, episodi per le serie */}
                  {isFilm ? (
                    <div className="detail-block">
                      <div className="section-label-row">
                        <h2 className="section-label">Minuti visti</h2>
                        <span className="minutes-readout"><strong>{minutes}</strong>{runtime ? ` / ${runtime} min` : ' min'}</span>
                      </div>
                      {runtime ? (
                        <input
                          type="range"
                          className="minutes-range"
                          min={0}
                          max={runtime}
                          step={1}
                          value={minutes}
                          onChange={(e) => changeMinutes(Number(e.target.value))}
                          style={{ '--fill': `${minutesPercent}%` } as React.CSSProperties}
                          aria-label="Minuti visti"
                        />
                      ) : null}
                      <div className="minutes-actions">
                        <input
                          type="number"
                          className="minutes-input"
                          min={0}
                          max={runtime ?? undefined}
                          value={minutes}
                          onChange={(e) => changeMinutes(Number(e.target.value))}
                          aria-label="Minuti visti (numero)"
                        />
                        <button type="button" className="btn-chip" onClick={() => saveMinutes(0)}>Azzera</button>
                        {runtime ? <button type="button" className="btn-chip" onClick={() => saveMinutes(runtime)}>Visto tutto</button> : null}
                        {minutesDirty && (
                          <button type="button" className="btn-marvel btn-inline btn-save-minutes" onClick={() => saveMinutes()} disabled={isSavingMinutes}>
                            {isSavingMinutes ? 'Salvo…' : 'Salva'}
                          </button>
                        )}
                      </div>
                      {minutesDirty && !isSavingMinutes && <p className="detail-hint">Modifica non ancora salvata.</p>}
                      {saveNote && <p className="save-note" role="status">{saveNote}</p>}
                      {!runtime && <p className="detail-hint">Durata non disponibile: segna il film come visto con il cerchio in alto.</p>}
                    </div>
                  ) : (
                    <div className="detail-block">
                      <div className="section-label-row">
                        <h2 className="section-label">Episodi <span className="text-muted-soft">{watchedEpisodes.length}/{totalEpisodes || '?'}</span></h2>
                        {totalEpisodes > 0 && (
                          <button
                            type="button"
                            className={`btn-all-episodes ${allEpisodesSeen ? 'active' : ''}`}
                            onClick={toggleAllEpisodes}
                            aria-pressed={allEpisodesSeen}
                            title={allEpisodesSeen ? 'Segna tutti come non visti' : 'Segna tutti come visti'}
                          >ALL</button>
                        )}
                      </div>
                      {totalEpisodes > 0 ? (
                        <>
                          <div className="episodes-grid">
                            {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map(ep => {
                              const isWatched = watchedEpisodes.includes(ep);
                              const epRating = episodeRatings[ep];
                              return (
                                <Link
                                  key={ep}
                                  to={`/media/${dbMedia.id}/episodes/${ep}`}
                                  className={`ep-box ${isWatched ? 'watched' : ''} ${epRating ? 'rated' : ''}`}
                                  aria-label={`Episodio ${ep}${isWatched ? ', visto' : ''}${epRating ? `, voto ${epRating}` : ''}: apri la scheda`}
                                  title={epRating ? `Il tuo voto: ${String(epRating).replace('.', ',')}` : `Apri l'episodio ${ep}`}
                                >{ep}</Link>
                              );
                            })}
                          </div>
                          <p className="detail-hint episodes-hint">Apri un episodio per leggerne la sinossi, votarlo e commentarlo.</p>
                        </>
                      ) : (
                        <p className="detail-hint">Numero di episodi non disponibile.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <div className="row g-4 detail-extras">
          <div className="col-lg-7">
            <h2 className="section-title">Cast principale</h2>
            {tmdbData.credits?.cast?.length ? (
              <div className="cast-row">
                {tmdbData.credits.cast.slice(0, 12).map(actor => (
                  <div key={actor.id} className="cast-card">
                    <img
                      src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : POSTER_PLACEHOLDER}
                      alt={actor.name}
                      loading="lazy"
                    />
                    <span className="cast-name">{actor.name}</span>
                    <span className="cast-character">{actor.character}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-box">Cast non disponibile</div>
            )}
          </div>

          <div className="col-lg-5">
            <h2 className="section-title">Trailer</h2>
            {trailer ? (
              <div className="ratio ratio-16x9 trailer-frame">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={`Trailer di ${dbMedia.title}`}
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="empty-box">Trailer non disponibile</div>
            )}
          </div>
        </div>

        <Community key={dbMedia.id} mediaId={dbMedia.id} kind={isFilm ? 'film' : 'season'} seen={!!progress?.seen || (!isFilm && allEpisodesSeen)} />
      </div>
    </div>
  );
};

export default MediaDetail;
