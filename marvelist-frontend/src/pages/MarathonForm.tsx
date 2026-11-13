import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { mediaService, type MediaItem } from '../services/mediaService';
import { marathonService, type MarathonPlan, type MarathonRequest } from '../services/marathonService';
import { groupByPhase, matchesVisionOrder, sortByViewingOrder, VISION_ORDER_LABELS, type VisionOrder } from '../utils/ordering';
import { addDays, compressImage, errorMessage, formatDay, getBackgroundUrl, toIsoDay } from '../utils/marathon';
import { getPosterUrl } from '../utils/poster';
import PosterFallback from '../components/PosterFallback';
import { availableFrom, isUpcoming, releaseLabel } from '../utils/upcoming';
import SlowLoader from '../components/SlowLoader';

const LEVELS: VisionOrder[] = ['MCU', 'FAN', 'GOD'];
const MAX_BACKGROUND_LENGTH = 2_900_000;

const MarathonForm = () => {
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const today = toIsoDay(new Date());
  const [name, setName] = useState('');
  const [visionOrder, setVisionOrder] = useState<VisionOrder>('MCU');
  const [hideSeen, setHideSeen] = useState(false);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [background, setBackground] = useState<string | null>(null);
  const [backgroundTab, setBackgroundTab] = useState<'titles' | 'upload'>('titles');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 60));
  const [mixedDays, setMixedDays] = useState(true);
  const [maxFilmsPerWeek, setMaxFilmsPerWeek] = useState(3);
  const [maxEpisodesPerDay, setMaxEpisodesPerDay] = useState(3);
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());

  const [plan, setPlan] = useState<MarathonPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const planRequest = useRef(0);

  // Catalogo, visti e (in modifica) la maratona esistente
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const [media, seen, marathon] = await Promise.all([
          mediaService.getAllMedia(),
          mediaService.getSeenIds().catch(() => []),
          editingId ? marathonService.get(editingId) : Promise.resolve(null),
        ]);
        setAllMedia(media);
        setSeenIds(new Set(seen));
        if (marathon) {
          const itemIds = new Set(marathon.items.map(i => i.mediaId));
          setName(marathon.name);
          setVisionOrder(marathon.visionOrder);
          setHideSeen(marathon.hideSeen);
          setBackground(marathon.background);
          setBackgroundTab(marathon.background?.startsWith('data:') ? 'upload' : 'titles');
          setStartDate(marathon.startDate);
          setEndDate(marathon.endDate < today ? today : marathon.endDate);
          setMixedDays(marathon.mixedDays);
          setMaxFilmsPerWeek(marathon.maxFilmsPerWeek);
          setMaxEpisodesPerDay(marathon.maxEpisodesPerDay);
          // In modifica: tutto ciò che è nel livello ma non nella maratona risulta "tolto"
          setExcluded(new Set(media.filter(m => matchesVisionOrder(m, marathon.visionOrder) && !itemIds.has(m.id)).map(m => m.id)));
        }
      } catch (e) {
        setLoadError(errorMessage(e, 'Impossibile caricare i dati della maratona.'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated, editingId, today]);

  // Titoli: partenza scelta, meno quelli già visti (se richiesto) e quelli tolti a mano
  // I titoli in arrivo entrano solo se escono entro la data di fine della maratona
  const levelMedia = useMemo(() => allMedia.filter(m => matchesVisionOrder(m, visionOrder)), [allMedia, visionOrder]);
  const candidates = useMemo(
    () => sortByViewingOrder(levelMedia.filter(m => { const from = availableFrom(m); return !from || from <= endDate; })),
    [levelMedia, endDate]
  );
  const upcomingExcluded = levelMedia.length - candidates.length;
  const visible = useMemo(() => hideSeen ? candidates.filter(m => !seenIds.has(m.id)) : candidates, [candidates, hideSeen, seenIds]);
  const included = useMemo(() => visible.filter(m => !excluded.has(m.id)), [visible, excluded]);
  const hiddenSeenCount = candidates.length - visible.length;
  const phases = useMemo(() => [...groupByPhase(visible).entries()], [visible]);
  const mediaIds = useMemo(() => included.map(m => m.id), [included]);
  const mediaKey = mediaIds.join(',');

  const toggleTitle = (mediaId: number) => setExcluded(prev => {
    const next = new Set(prev);
    if (next.has(mediaId)) next.delete(mediaId); else next.add(mediaId);
    return next;
  });

  const setPhaseIncluded = (items: MediaItem[], include: boolean) => setExcluded(prev => {
    const next = new Set(prev);
    items.forEach(m => include ? next.delete(m.id) : next.add(m.id));
    return next;
  });

  const togglePhase = (phase: string) => setOpenPhases(prev => {
    const next = new Set(prev);
    if (next.has(phase)) next.delete(phase); else next.add(phase);
    return next;
  });

  const buildRequest = (): MarathonRequest => ({
    name: name.trim(),
    background,
    visionOrder,
    startDate,
    endDate,
    hideSeen,
    mixedDays,
    maxFilmsPerWeek,
    maxEpisodesPerDay,
    mediaIds,
  });

  // L'anteprima del piano si ricalcola poco dopo ogni modifica, prima di salvare
  useEffect(() => {
    if (isLoading || !mediaKey) return;
    const request = ++planRequest.current;
    const timer = window.setTimeout(async () => {
      setIsPlanning(true);
      try {
        const result = await marathonService.preview({
          name: 'Anteprima', background: null, visionOrder, startDate, endDate, hideSeen,
          mixedDays, maxFilmsPerWeek, maxEpisodesPerDay, mediaIds: mediaKey.split(',').map(Number),
        });
        if (request === planRequest.current) { setPlan(result); setPlanError(null); }
      } catch (e) {
        if (request === planRequest.current) { setPlan(null); setPlanError(errorMessage(e, 'Impossibile calcolare il calendario.')); }
      } finally {
        if (request === planRequest.current) setIsPlanning(false);
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [isLoading, mediaKey, visionOrder, startDate, endDate, hideSeen, mixedDays, maxFilmsPerWeek, maxEpisodesPerDay]);

  // Sfondo: locandina di un titolo inserito oppure immagine caricata
  const posterChoices = useMemo(() => included.filter(m => m.posterPath).slice(0, 36), [included]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await compressImage(file);
      if (dataUrl.length > MAX_BACKGROUND_LENGTH) throw new Error("L'immagine è troppo pesante anche dopo la compressione.");
      setBackground(dataUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Caricamento non riuscito.');
    }
  };

  const canSave = name.trim().length > 0 && mediaIds.length > 0 && plan?.feasible === true && !isPlanning && !planError;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = editingId
        ? await marathonService.update(editingId, buildRequest())
        : await marathonService.create(buildRequest());
      navigate(`/marathons/${saved.id}`);
    } catch (err) {
      setSaveError(errorMessage(err, 'Salvataggio non riuscito. Riprova.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (isLoading) return <SlowLoader />;
  if (loadError) return <div className="container page"><div className="alert-marvel">{loadError}</div><Link to="/profile" className="btn-ghost">Torna al profilo</Link></div>;

  const backgroundUrl = getBackgroundUrl(background);

  return (
    <div className="container page marathon-form-page">
      <Link to={editingId ? `/marathons/${editingId}` : '/profile'} className="back-link">← {editingId ? 'Torna alla maratona' : 'Torna al profilo'}</Link>
      <h1 className="page-title">{editingId ? 'Modifica maratona' : 'Crea la tua maratona'}</h1>

      <form onSubmit={handleSave} className="marathon-form">

        <section className="form-card">
          <div
            className="marathon-preview-banner"
            style={backgroundUrl ? { backgroundImage: `linear-gradient(100deg, rgba(10,4,4,.9), rgba(10,4,4,.35)), url("${backgroundUrl}")` } : undefined}
          >
            <span className="chip chip-accent">{VISION_ORDER_LABELS[visionOrder]}</span>
            <strong>{name.trim() || 'La tua maratona'}</strong>
            <span>{formatDay(startDate)} → {formatDay(endDate)}</span>
          </div>
          <label className="field">
            <span className="field-label">Nome della maratona</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Es. Road to Secret Wars" required />
          </label>
        </section>

        <section className="form-card">
          <h2 className="form-card-title">1 · Partenza e titoli</h2>
          <div className="segmented" role="radiogroup" aria-label="Partenza">
            {LEVELS.map(level => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={visionOrder === level}
                className={`segmented-option ${visionOrder === level ? 'active' : ''}`}
                onClick={() => setVisionOrder(level)}
              >{VISION_ORDER_LABELS[level]}</button>
            ))}
          </div>

          <label className="check-row">
            <input type="checkbox" checked={hideSeen} onChange={(e) => setHideSeen(e.target.checked)} />
            <span className="check-box" aria-hidden="true" />
            <span>Non mostrare i contenuti già visti <small>(film visti per intero, stagioni complete e singoli episodi già visti)</small></span>
          </label>

          <p className="form-hint">
            <strong>{included.length}</strong> titoli nella maratona
            {excluded.size > 0 && <> · {visible.filter(m => excluded.has(m.id)).length} tolti</>}
            {hideSeen && hiddenSeenCount > 0 && <> · {hiddenSeenCount} già visti nascosti</>}
            {upcomingExcluded > 0 && <> · {upcomingExcluded} in arrivo esclusi (escono dopo la fine)</>}
          </p>

          <div className="title-groups">
            {phases.map(([phase, items]) => {
              const inPhase = items.filter(m => !excluded.has(m.id)).length;
              const open = openPhases.has(phase);
              return (
                <div key={phase} className={`title-group ${open ? 'open' : ''}`}>
                  <div className="title-group-header">
                    <button type="button" className="title-group-toggle" onClick={() => togglePhase(phase)} aria-expanded={open}>
                      <span className="title-group-caret" aria-hidden="true">›</span>
                      <span className="title-group-name">{phase}</span>
                      <span className="title-group-count">{inPhase}/{items.length}</span>
                    </button>
                    <button type="button" className="btn-chip" onClick={() => setPhaseIncluded(items, inPhase !== items.length)}>
                      {inPhase === items.length ? 'Togli tutti' : 'Rimetti tutti'}
                    </button>
                  </div>
                  {open && (
                    <ul className="title-list">
                      {items.map(m => {
                        const isOut = excluded.has(m.id);
                        return (
                          <li key={m.id} className={`title-row ${isOut ? 'is-out' : ''}`}>
                            <span className="title-thumb">
                              {m.posterPath ? <img src={getPosterUrl(m.posterPath, 'w92') ?? ''} alt="" loading="lazy" /> : <PosterFallback title={m.title} />}
                            </span>
                            <span className="title-info">
                              <span className="title-name">{m.title}</span>
                              <span className="title-meta">
                                {isUpcoming(m)
                                  ? `In arrivo · esce ${m.releaseDate ? `il ${releaseLabel(m)}` : `nel ${m.releaseYear}`}`
                                  : m.type === 'FILM' ? `Film · ${m.releaseYear}` : `Serie TV · ${m.episodes ?? '?'} episodi`}
                                {seenIds.has(m.id) && ' · visto'}
                              </span>
                            </span>
                            <button
                              type="button"
                              className={`title-toggle ${isOut ? 'restore' : ''}`}
                              onClick={() => toggleTitle(m.id)}
                              aria-label={isOut ? `Rimetti ${m.title}` : `Togli ${m.title}`}
                              title={isOut ? 'Rimetti nella maratona' : 'Togli dalla maratona'}
                            >{isOut ? '↺' : '×'}</button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
            {phases.length === 0 && <div className="empty-box">Nessun titolo disponibile con questi filtri.</div>}
          </div>
        </section>

        <section className="form-card">
          <h2 className="form-card-title">2 · Sfondo</h2>
          <div className="segmented" role="tablist" aria-label="Tipo di sfondo">
            <button type="button" role="tab" aria-selected={backgroundTab === 'titles'} className={`segmented-option ${backgroundTab === 'titles' ? 'active' : ''}`} onClick={() => setBackgroundTab('titles')}>Dai titoli inseriti</button>
            <button type="button" role="tab" aria-selected={backgroundTab === 'upload'} className={`segmented-option ${backgroundTab === 'upload' ? 'active' : ''}`} onClick={() => setBackgroundTab('upload')}>Carica un'immagine</button>
          </div>

          {backgroundTab === 'titles' ? (
            posterChoices.length ? (
              <div className="poster-picker">
                {posterChoices.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`poster-option ${background === m.posterPath ? 'selected' : ''}`}
                    onClick={() => setBackground(m.posterPath)}
                    aria-pressed={background === m.posterPath}
                    title={m.title}
                  >
                    <img src={getPosterUrl(m.posterPath, 'w185') ?? ''} alt={m.title} loading="lazy" />
                  </button>
                ))}
              </div>
            ) : <p className="form-hint">Nessuna locandina disponibile tra i titoli scelti.</p>
          ) : (
            <div className="upload-box">
              <label className="btn-ghost upload-button">
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} hidden />
                Scegli un'immagine
              </label>
              <span className="form-hint">JPG o PNG: viene ridimensionata automaticamente.</span>
              {uploadError && <p className="form-error" role="alert">{uploadError}</p>}
            </div>
          )}
          {background && <button type="button" className="btn-chip mt-2" onClick={() => setBackground(null)}>Rimuovi sfondo</button>}
        </section>

        <section className="form-card">
          <h2 className="form-card-title">3 · Calendario</h2>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Data di inizio</span>
              <input type="date" className="field-input" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} required />
            </label>
            <label className="field">
              <span className="field-label">Data di fine</span>
              <input type="date" className="field-input" value={endDate} min={startDate > today ? startDate : today} onChange={(e) => e.target.value && setEndDate(e.target.value)} required />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Film al massimo a settimana</span>
              <input type="number" className="field-input" min={0} max={50} value={maxFilmsPerWeek} onChange={(e) => setMaxFilmsPerWeek(Math.max(0, Math.min(50, Number(e.target.value) || 0)))} />
            </label>
            <label className="field">
              <span className="field-label">Episodi al massimo al giorno</span>
              <input type="number" className="field-input" min={0} max={50} value={maxEpisodesPerDay} onChange={(e) => setMaxEpisodesPerDay(Math.max(0, Math.min(50, Number(e.target.value) || 0)))} />
            </label>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={mixedDays} onChange={(e) => setMixedDays(e.target.checked)} />
            <span className="check-box" aria-hidden="true" />
            <span>Nello stesso giorno posso vedere sia film che serie TV</span>
          </label>

          {/* ESITO: se non c'è il tempo materiale si chiede di cambiare date o limiti prima di salvare */}
          <div className="plan-box" aria-live="polite">
            {!mediaIds.length ? (
              <p className="form-hint">Aggiungi almeno un titolo per calcolare il calendario.</p>
            ) : isPlanning && !plan ? (
              <p className="form-hint">Calcolo del calendario…</p>
            ) : planError ? (
              <div className="plan-warning" role="alert"><strong>⚠ Controlla i dati</strong><span>{planError}</span></div>
            ) : plan && !plan.feasible ? (
              <div className="plan-warning" role="alert">
                <strong>⚠ Non c'è il tempo per vedere tutto</strong>
                <span>{plan.message}</span>
                {plan.requiredEndDate && (
                  <button type="button" className="btn-chip" onClick={() => setEndDate(plan.requiredEndDate!)}>
                    Sposta la fine al {formatDay(plan.requiredEndDate)}
                  </button>
                )}
              </div>
            ) : plan ? (
              <div className="plan-ok">
                <strong>✔ Calendario pronto</strong>
                <span>
                  {plan.totalFilms} film e {plan.totalEpisodes} episodi in {plan.scheduledDays} giorni
                  {plan.requiredEndDate && <> · finirai il {formatDay(plan.requiredEndDate)}</>}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {saveError && <p className="form-error" role="alert">{saveError}</p>}

        <div className="form-actions">
          <Link to={editingId ? `/marathons/${editingId}` : '/profile'} className="btn-ghost">Annulla</Link>
          <button type="submit" className="btn-marvel btn-inline" disabled={!canSave || isSaving}>
            {isSaving ? 'Salvataggio…' : editingId ? 'Salva modifiche' : 'Crea maratona'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarathonForm;
