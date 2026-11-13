import type { MediaItem } from '../services/mediaService';
import type { WatchState } from '../hooks/useWatchState';
import { getProgressPercent } from '../utils/progress';
import MediaCard from './MediaCard';
import { usePageState } from '../hooks/usePageMemory';
import { isUpcoming } from '../utils/upcoming';

interface PhaseListProps {
  groups: Map<string, MediaItem[]>; // fase -> titoli, già in ordine di visione
  watch: WatchState;
  forceOpen?: boolean;              // es. durante la ricerca tutte le fasi restano aperte
  emptyText?: string;
  memoryKey?: string;               // se presente, le fasi aperte restano salvate tornando sulla pagina
}

// Accordion delle fasi con presa visione dell'intera fase e card dei titoli.
// Il colore segue le variabili del contenitore (tema MCU/Fan/GOD o della Road To).
const PhaseList = ({ groups, watch, forceOpen = false, emptyText = 'Nessun titolo trovato.', memoryKey }: PhaseListProps) => {
  // null = solo la prima aperta (default). Array e non Set perché va salvato in sessionStorage
  const [savedPhases, setOpenPhases] = usePageState<string[] | null>(memoryKey ?? null, null);
  const openPhases = savedPhases && new Set(savedPhases);
  const phases = [...groups.keys()];
  const { seenItems, favoriteItems, watchLaterItems, progressById, bulkPhase, isSkipped, toggleSeen, toggleFavorite, toggleSeenPhase } = watch;

  const isOpen = (phase: string) => forceOpen || (openPhases ? openPhases.has(phase) : phase === phases[0]);
  const togglePhase = (phase: string) => {
    const next = new Set(openPhases ?? (phases[0] ? [phases[0]] : []));
    if (next.has(phase)) next.delete(phase); else next.add(phase);
    setOpenPhases([...next]);
  };

  if (phases.length === 0) return <div className="empty-box">{emptyText}</div>;

  return (
    <div className="phase-list">
      {phases.map((phase) => {
        const items = groups.get(phase)!;
        // I titoli in arrivo si vedono nella fase ma non contano e non si possono segnare come visti.
        // Quelli in "Guarda dopo" (non ancora visti) restano nel totale ma riempiono la barra come se fossero
        // fatti: con tutto il resto visto la fase risulta completata. Il grado del profilo invece conta solo i visti.
        const available = items.filter(m => !isUpcoming(m));
        const released = available.filter(m => !isSkipped(m.id)); // quelli che la presa visione della fase segna
        const skippedCount = available.length - released.length;
        const seenCount = released.filter(m => seenItems.includes(m.id)).length;
        const total = available.length;
        const allSeen = total > 0 && seenCount + skippedCount === total;
        const seenPercent = total ? (seenCount / total) * 100 : 0;
        const skippedPercent = total ? (skippedCount / total) * 100 : 0;
        const open = isOpen(phase);
        return (
          <section key={phase} className={`phase-section ${open ? '' : 'collapsed'}`}>
            <div className="phase-header">
              <button type="button" className="phase-header-toggle" onClick={() => togglePhase(phase)} aria-expanded={open}>
                <span className="phase-title">{phase}</span>
                <span className="phase-count">
                  <span className="phase-count-part">{seenCount}/{total} visti</span>
                  {skippedCount > 0 && <> <span className="phase-count-part">{skippedCount} guarda dopo</span></>}
                  {available.length < items.length && <> <span className="phase-count-part">{items.length - available.length} in arrivo</span></>}
                </span>
              </button>
              {/* Anello che si riempie con la percentuale vista; a fase completa si accende e compare la spunta */}
              {released.length > 0 && (
                <button
                  type="button"
                  className={`phase-watch-all ${allSeen ? 'active' : ''} ${bulkPhase === phase ? 'is-busy' : ''}`}
                  style={{ '--p': `${Math.round(seenPercent + skippedPercent)}%` } as React.CSSProperties}
                  onClick={() => toggleSeenPhase(phase, released)}
                  disabled={bulkPhase === phase}
                  aria-pressed={allSeen}
                  aria-label={allSeen ? `Segna tutta la ${phase} come non vista` : `Segna tutta la ${phase} come vista`}
                  title={allSeen ? 'Segna tutta la fase come non vista' : 'Segna tutta la fase come vista'}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path className="phase-watch-check" d="M6 12.5l4 4 8-9" />
                  </svg>
                </button>
              )}
              <button type="button" className="phase-toggle" onClick={() => togglePhase(phase)} aria-hidden="true" tabIndex={-1}>
                <svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" /></svg>
              </button>
              {/* Barra: visti nel colore accento, poi i "Guarda dopo" in giallo */}
              <span className="phase-completion">
                <span style={{ width: `${seenPercent}%` }} />
                <span className="is-later" style={{ width: `${skippedPercent}%` }} />
              </span>
            </div>

            <div className="phase-grid-wrap" inert={!open}>
              <div className="phase-grid-inner">
                <div className="media-grid">
                  {items.map((media) => (
                    <MediaCard
                      key={media.id}
                      media={media}
                      seen={seenItems.includes(media.id)}
                      favorite={favoriteItems.includes(media.id)}
                      watchLater={watchLaterItems.includes(media.id)}
                      rating={progressById[media.id]?.rating}
                      progress={seenItems.includes(media.id) ? 100 : getProgressPercent(media, progressById[media.id]) || null}
                      onToggleSeen={() => toggleSeen(media.id)}
                      onToggleFavorite={() => toggleFavorite(media.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default PhaseList;
