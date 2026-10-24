import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { marathonService, type MarathonDetail as Marathon, type MarathonUnit } from '../services/marathonService';
import { VISION_ORDER_LABELS } from '../utils/ordering';
import { dayLabel, errorMessage, formatDay, getBackgroundUrl } from '../utils/marathon';
import { getPosterUrl } from '../utils/poster';
import PosterFallback from '../components/PosterFallback';

const unitKey = (u: Pick<MarathonUnit, 'mediaId' | 'episode'>) => `${u.mediaId}-${u.episode ?? 'film'}`;

const MarathonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const marathonId = Number(id);
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [marathon, setMarathon] = useState<Marathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set()); // spunte in attesa di risposta dal server
  const [undo, setUndo] = useState<MarathonUnit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const undoTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) return;
    marathonService.get(marathonId)
      .then(setMarathon)
      .catch(e => setError(errorMessage(e, 'Maratona non trovata.')))
      .finally(() => setIsLoading(false));
    return () => window.clearTimeout(undoTimer.current);
  }, [isAuthenticated, marathonId]);

  // Spunta: il titolo viene barrato (resta nel giorno fino a domani) e segnato come visto anche nel profilo.
  // Una seconda spunta lo riporta da vedere.
  const toggle = async (unit: MarathonUnit) => {
    const key = unitKey(unit);
    const done = !unit.done;
    setPending(prev => new Set(prev).add(key));
    try {
      setMarathon(await marathonService.check(marathonId, unit.mediaId, unit.episode, done));
      window.clearTimeout(undoTimer.current);
      if (done) {
        setUndo(unit);
        undoTimer.current = window.setTimeout(() => setUndo(null), 6000);
      } else {
        setUndo(null);
      }
    } catch (e) {
      setError(errorMessage(e, 'Impossibile aggiornare la maratona.'));
    } finally {
      setPending(prev => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  const undoCheck = async () => {
    if (!undo) return;
    const unit = undo;
    setUndo(null);
    try { setMarathon(await marathonService.check(marathonId, unit.mediaId, unit.episode, false)); }
    catch (e) { setError(errorMessage(e, 'Impossibile annullare.')); }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await marathonService.remove(marathonId);
      navigate('/profile');
    } catch (e) {
      setError(errorMessage(e, 'Impossibile eliminare la maratona.'));
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (isLoading) return <div className="page-loader"><div className="spinner-border text-danger" role="status"></div></div>;
  if (!marathon) {
    return (
      <div className="container page">
        <div className="alert-marvel">{error ?? 'Maratona non trovata.'}</div>
        <Link to="/profile" className="btn-ghost">Torna al profilo</Link>
      </div>
    );
  }

  const percent = marathon.totalUnits ? Math.round((marathon.doneUnits / marathon.totalUnits) * 100) : 0;
  // Titoli in "Guarda dopo": restano nella maratona ma il calendario li salta
  const skipped = marathon.items.filter(i => i.watchLater);
  const completed = marathon.doneUnits >= marathon.totalUnits;
  const backgroundUrl = getBackgroundUrl(marathon.background);

  return (
    <div className="marathon-page">
      <header
        className="marathon-hero"
        style={backgroundUrl ? { backgroundImage: `url("${backgroundUrl}")` } : undefined}
      >
        <div className="marathon-hero-scrim" />
        <div className="container marathon-hero-content">
          <Link to="/profile" className="back-link">← Profilo</Link>
          <span className="chip chip-accent">{VISION_ORDER_LABELS[marathon.visionOrder]}</span>
          <h1 className="marathon-title">{marathon.name}</h1>
          <p className="marathon-dates">{formatDay(marathon.startDate)} → {formatDay(marathon.endDate)}</p>
          <div className="marathon-progress" aria-label={`Completata al ${percent}%`}>
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className="marathon-progress-label">
            <strong>{marathon.doneUnits}</strong> / {marathon.totalUnits} visti · {percent}%
            <span className="marathon-rules">
              · max {marathon.maxFilmsPerWeek} film/settimana · {marathon.maxEpisodesPerDay} episodi/giorno
              {marathon.mixedDays ? ' · film e serie insieme' : ' · film e serie in giorni separati'}
            </span>
          </p>
          <div className="marathon-actions">
            <Link to={`/marathons/${marathon.id}/edit`} className="btn-ghost btn-sm-pill">✎ Modifica</Link>
            {confirmDelete ? (
              <span className="confirm-inline">
                Eliminare la maratona?
                <button type="button" className="btn-danger-pill" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Elimino…' : 'Elimina'}</button>
                <button type="button" className="btn-ghost btn-sm-pill" onClick={() => setConfirmDelete(false)}>Annulla</button>
              </span>
            ) : (
              <button type="button" className="btn-ghost btn-sm-pill btn-danger-ghost" onClick={() => setConfirmDelete(true)}>🗑 Elimina</button>
            )}
          </div>
        </div>
      </header>

      <div className="container marathon-body">
        {error && <div className="alert-marvel">{error}</div>}

        {/* Il calendario parte da oggi: ciò che non hai visto nei giorni passati è già stato spostato avanti */}
        {!completed && !marathon.plan.feasible && (
          <div className="plan-warning" role="alert">
            <strong>⚠ Sei rimasto indietro</strong>
            <span>
              {marathon.plan.message} Restano {marathon.plan.unscheduledUnits} contenuti fuori dal calendario.
            </span>
            <Link to={`/marathons/${marathon.id}/edit`} className="btn-chip">Modifica la maratona</Link>
          </div>
        )}

        {skipped.length > 0 && (
          <div className="watch-later-note" role="status">
            <strong>⏱ Saltati con "Guarda dopo"</strong>
            <span>
              {skipped.map((i, idx) => (
                <span key={i.mediaId}>{idx > 0 && ', '}<Link to={`/media/${i.mediaId}`}>{i.title}</Link></span>
              ))}
              {' '}— non sono in calendario e non contano nel totale. Togli "Guarda dopo" dalla scheda per rimetterli.
            </span>
          </div>
        )}

        {completed ? (
          <div className="marathon-complete">
            <span className="marathon-complete-icon" aria-hidden="true">🏆</span>
            <h2>Maratona completata!</h2>
            <p>Hai visto tutti i {marathon.totalUnits} contenuti. Missione compiuta, Avenger.</p>
          </div>
        ) : (
          <ol className="day-list">
            {marathon.days.map(day => (
              <li key={day.date} className={`day-card ${dayLabel(day.date) === 'Oggi' ? 'is-today' : ''}`}>
                <div className="day-card-header">
                  <h2>{dayLabel(day.date)}</h2>
                  <span>{formatDay(day.date)} · {day.units.length} {day.units.length === 1 ? 'contenuto' : 'contenuti'}</span>
                </div>
                <ul className="day-units">
                  {day.units.map(unit => {
                    const key = unitKey(unit);
                    const isPending = pending.has(key);
                    const checked = isPending ? !unit.done : unit.done; // la spunta si vede subito, prima della risposta
                    return (
                      <li key={key} className={`day-unit ${checked ? 'is-done' : ''}`}>
                        <label className="day-unit-check">
                          <input type="checkbox" checked={checked} onChange={() => toggle(unit)} disabled={isPending} />
                          <span className="check-box" aria-hidden="true" />
                          <span className="visually-hidden">Segna come {unit.done ? 'da vedere' : 'visto'}: {unit.title}{unit.episode ? `, episodio ${unit.episode}` : ''}</span>
                        </label>
                        <Link to={`/media/${unit.mediaId}`} className="day-unit-thumb" tabIndex={-1} aria-hidden="true">
                          {unit.posterPath ? <img src={getPosterUrl(unit.posterPath, 'w92') ?? ''} alt="" loading="lazy" /> : <PosterFallback title={unit.title} />}
                        </Link>
                        <div className="day-unit-info">
                          <Link to={`/media/${unit.mediaId}`} className="day-unit-title">{unit.title}</Link>
                          <span className="day-unit-meta">
                            {unit.type === 'FILM'
                              ? `Film${unit.runtime ? ` · ${unit.runtime} min` : ''}`
                              : `Episodio ${unit.episode}`}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Annulla l'ultima spunta */}
      {undo && (
        <div className="undo-toast" role="status">
          <span>✔ {undo.title}{undo.episode ? ` · ep. ${undo.episode}` : ''} segnato come visto</span>
          <button type="button" onClick={undoCheck}>Annulla</button>
        </div>
      )}
    </div>
  );
};

export default MarathonDetail;
