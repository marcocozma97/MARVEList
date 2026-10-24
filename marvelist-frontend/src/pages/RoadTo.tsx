import { useMemo, useRef, useState } from 'react';
import { useWatchState } from '../hooks/useWatchState';
import type { MediaItem } from '../services/mediaService';
import { groupByPhase } from '../utils/ordering';
import PhaseList from '../components/PhaseList';
import doomImg from '../assets/roadto/doom.png';
import thanosImg from '../assets/roadto/thano.png';
import spidermanImg from '../assets/roadto/spiderman.png';

type RoadId = 'doomsday' | 'endgame' | 'spiderverse';

interface Road {
  id: RoadId;
  title: string;
  hero: string;
  tagline: string;
  image: string; // personaggio su sfondo trasparente
  theme: { accent: string; accentText: string; accentRgb: string; glow: string };
  pick: (list: MediaItem[]) => MediaItem[];
}

const hasTag = (media: MediaItem, tag: string) => (media.tags ?? '').split(',').includes(tag);

const ROADS: Road[] = [
  {
    id: 'doomsday',
    title: 'Road to Doomsday',
    hero: 'Doctor Doom',
    tagline: 'Tutto quello che serve prima di Avengers: Doomsday',
    image: doomImg,
    theme: { accent: '#22c55e', accentText: '#86efac', accentRgb: '34, 197, 94', glow: '#052e16' },
    // Solo i titoli segnati "doomsday" nel marvel_data.json: la preparazione al film
    pick: list => list.filter(m => m.doomsday === true),
  },
  {
    id: 'endgame',
    title: 'Road to Endgame',
    hero: 'Thanos',
    tagline: "La Saga dell'Infinito, fino ad Avengers: Endgame",
    image: thanosImg,
    theme: { accent: '#a855f7', accentText: '#e9d5ff', accentRgb: '168, 85, 247', glow: '#2e1065' },
    pick: list => {
      const endgame = list.find(m => m.title === 'Avengers: Endgame');
      return list.filter(m => m.visionOrder === 'MCU' && (endgame?.sortOrder != null && m.sortOrder != null
        ? m.sortOrder <= endgame.sortOrder
        : m.releaseYear <= 2019));
    },
  },
  {
    id: 'spiderverse',
    title: 'Road to Spiderverse',
    hero: 'Spider-Man',
    tagline: 'Ogni film e serie del mondo di Spider-Man',
    image: spidermanImg,
    theme: { accent: '#ef4444', accentText: '#fecaca', accentRgb: '239, 68, 68', glow: '#1e3a8a' },
    // Tutti i titoli con il tag "spiderverse" nel marvel_data.json
    pick: list => list.filter(m => hasTag(m, 'spiderverse')),
  },
];

// Card "selezione personaggio": inclinazione 3D che segue il puntatore
const RoadCard = ({ road, count, seen, selected, dimmed, onSelect }: {
  road: Road; count: number; seen: number; selected: boolean; dimmed: boolean; onSelect: () => void;
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-y * 14).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(x * 18).toFixed(2)}deg`);
    el.style.setProperty('--shine-x', `${((x + 0.5) * 100).toFixed(1)}%`);
    // Valori numerici per il parallasse: i livelli del disegno si spostano a profondità diverse
    el.style.setProperty('--px', x.toFixed(3));
    el.style.setProperty('--py', y.toFixed(3));
  };
  const onLeave = () => {
    ['--tilt-x', '--tilt-y'].forEach(v => ref.current?.style.setProperty(v, '0deg'));
    ['--px', '--py'].forEach(v => ref.current?.style.setProperty(v, '0'));
  };

  const percent = count ? Math.round((seen / count) * 100) : 0;

  return (
    <button
      ref={ref}
      type="button"
      className={`road-card road-${road.id} ${selected ? 'is-selected' : ''} ${dimmed ? 'is-dimmed' : ''}`}
      style={{ '--accent': road.theme.accent, '--accent-rgb': road.theme.accentRgb, '--road-glow': road.theme.glow } as React.CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="road-card-inner">
        <span className="road-card-bg" aria-hidden="true" />
        <span className="road-card-particles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <span className="road-card-hero-name" aria-hidden="true">{road.hero}</span>
        <span className="road-card-art">
          <img src={road.image} alt={road.hero} className="road-card-img" draggable={false} />
        </span>
        <span className="road-card-shine" aria-hidden="true" />
        <span className="road-card-footer">
          <span className="road-card-kicker">Road to</span>
          <span className="road-card-title">{road.title.replace(/^Road to /, '')}</span>
          <span className="road-card-meta">{count} titoli · {percent}% visto</span>
          <span className="road-card-progress"><span style={{ width: `${percent}%` }} /></span>
        </span>
      </span>
      {selected && <span className="road-card-pointer" aria-hidden="true">▼</span>}
    </button>
  );
};

const RoadTo = () => {
  const watch = useWatchState();
  const { mediaList, seenItems, isLoading, error, isSkipped } = watch;
  const [selectedId, setSelectedId] = useState<RoadId | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const lists = useMemo(
    () => Object.fromEntries(ROADS.map(r => [r.id, r.pick(mediaList)])) as Record<RoadId, MediaItem[]>,
    [mediaList]
  );

  const select = (id: RoadId) => {
    setSelectedId(prev => prev === id ? null : id);
    // Dopo la selezione si scende agli accordion del percorso scelto
    window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const selected = ROADS.find(r => r.id === selectedId) ?? null;
  // Un backend non aggiornato non invia i segni "doomsday" e i tag del JSON
  const missingRoadData = !isLoading && mediaList.length > 0 && mediaList.every(m => m.doomsday == null && m.tags == null);

  return (
    <div className="road-page">
      <div className="container road-header">
        <h1 className="road-heading"><span>Road</span> to</h1>
        <p className="road-subheading">Scegli il tuo percorso: ogni personaggio ti prepara a un grande evento Marvel.</p>
      </div>

      <div className="container">
        {error && <div className="alert-marvel">{error}</div>}
        {missingRoadData && (
          <div className="alert-marvel" role="status">
            Il server non sta inviando i dati delle Road To (segni "doomsday" e tag "spiderverse"): riavvia il backend per caricarli.
          </div>
        )}
        <div className="road-select" role="group" aria-label="Scegli una Road To">
          {ROADS.map(road => {
            // Come negli accordion: i titoli in "Guarda dopo" riempiono la percentuale del percorso
            const items = lists[road.id] ?? [];
            return (
              <RoadCard
                key={road.id}
                road={road}
                count={items.length}
                seen={items.filter(m => seenItems.includes(m.id) || isSkipped(m.id)).length}
                selected={selectedId === road.id}
                dimmed={selectedId !== null && selectedId !== road.id}
                onSelect={() => select(road.id)}
              />
            );
          })}
        </div>
      </div>

      <div ref={listRef} className="container road-list-anchor">
        {selected && (
          <section
            key={selected.id}
            className="road-list"
            style={{ '--accent': selected.theme.accent, '--accent-text': selected.theme.accentText, '--accent-rgb': selected.theme.accentRgb } as React.CSSProperties}
          >
            <div className="road-list-header">
              <h2>{selected.title}</h2>
              <p>{selected.tagline}</p>
            </div>
            {isLoading
              ? <div className="page-loader-inline"><div className="spinner-border" role="status"></div></div>
              : <PhaseList groups={groupByPhase(lists[selected.id])} watch={watch} emptyText="Nessun titolo in questo percorso." />}
          </section>
        )}
      </div>
    </div>
  );
};

export default RoadTo;
