import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RANK_LADDER, type Rank, type RankTone } from '../utils/rank';

// Distintivo del grado: colore e icona cambiano con la "famiglia" (S.H.I.E.L.D., Avenger, cosmico, GOD)
const ICONS: Record<RankTone, string> = {
  grey: 'shield', red: 'shield', 'red-bright': 'shield',
  yellow: 'star', 'yellow-bright': 'star',
  'sky-1': 'orbit', 'sky-2': 'orbit', 'sky-3': 'orbit', 'sky-4': 'orbit',
  infinity: 'gems',
};

const POPOVER_WIDTH = 380;

const BadgePill = ({ title, tone, small = false }: { title: string; tone: RankTone; small?: boolean }) => (
  <span className={`rank-badge tone-${tone} ${small ? 'rank-badge-sm' : ''}`}>
    <span className={`rank-badge-icon icon-${ICONS[tone]}`} aria-hidden="true" />
    <span className="rank-badge-text">{title}</span>
  </span>
);

// Il badge spiega se stesso: da PC compare passandoci sopra col mouse, da telefono toccandolo.
// Si chiude togliendo il mouse, toccando fuori o con Esc.
const RankBadge = ({ rank }: { rank: Rank }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const lastPointer = useRef<string>('mouse');
  const [asSheet, setAsSheet] = useState(false); // su telefono: foglio dal basso invece del menu a tendina
  const [shiftX, setShiftX] = useState(0);         // sposta il menu a sinistra se dovesse uscire dallo schermo

  const place = () => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setShiftX(Math.min(0, window.innerWidth - 16 - POPOVER_WIDTH - rect.left));
  };
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const currentIndex = RANK_LADDER.findIndex(r => r.title === rank.title);

  const panel = (
    <span ref={popoverRef} id={popoverId} className={`rank-popover ${asSheet ? 'is-sheet' : ''}`} style={asSheet ? undefined : { left: shiftX }} role="dialog" aria-label="Cos'è il grado">
      <span className="rank-popover-title">Il tuo grado</span>
      <span className="rank-popover-text">
        Il badge cresce con quello che completi: prima l'MCU, poi Marvel Fan e infine tutto Marvel GOD.
        I titoli non ancora usciti non contano.
      </span>
      <span className="rank-ladder">
        {RANK_LADDER.map((r, i) => (
          <span key={r.title} className={`rank-ladder-row ${i === currentIndex ? 'is-current' : ''} ${i < currentIndex ? 'is-done' : ''}`}>
            <BadgePill title={r.title} tone={r.tone} small />
            <span className="rank-ladder-req">{i === currentIndex ? 'Sei qui · ' : ''}{r.requirement}</span>
          </span>
        ))}
      </span>
    </span>
  );

  return (
    <span
      ref={wrapRef}
      className="rank-badge-wrap"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') { place(); setOpen(true); } }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setOpen(false); }}
    >
      <button
        type="button"
        className="rank-badge-button"
        onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
        onClick={() => {
          setAsSheet(window.matchMedia('(max-width: 767.98px)').matches);
          place();
          // Col mouse è già aperto dal passaggio sopra; al tocco (o da tastiera) apre/chiude
          if (lastPointer.current !== 'mouse') setOpen(v => !v);
          else setOpen(true);
          lastPointer.current = 'keyboard';
        }}
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`Grado: ${rank.title}. Mostra tutti i gradi`}
      >
        <BadgePill title={rank.title} tone={rank.tone} />
      </button>

      {open && !asSheet && panel}
      {/* Su telefono il foglio va nel body: così non esce mai dallo schermo */}
      {open && asSheet && createPortal(<span className="rank-sheet-backdrop">{panel}</span>, document.body)}
    </span>
  );
};

export { BadgePill as RankPill };
export default RankBadge;
