import { PixelGrid } from './PixelArt';

// Guanto dell'Infinito a 8 bit visto dal dorso: gemme Mente (mignolo), Potere (anulare), Realtà (medio),
// Spazio (indice), Anima (pollice) e Tempo (al centro della mano).
const PALETTE: Record<string, string> = {
  G: '#e0b23a', H: '#ffe08a', D: '#a87b10', O: '#6b4a08',
  y: '#facc15', p: '#a855f7', r: '#ef2b2b', b: '#3b82f6', o: '#f97316', g: '#22c55e',
  W: '#ffffff',
};
const GEM_CLASSES = { y: 'gem', p: 'gem', r: 'gem', b: 'gem', o: 'gem', g: 'gem' };

const PALM = [
  '.yy.GG.GG.GG.GG.',
  '.yy.GG.GG.GG.oG.',
  '.GG.GG.GG.GG.GG.',
  '.GGGGGGGGGGGGGG.',
  '.GHHHHHHHHHHGGG.',
  '.GGGGGOggOGGGG..',
  '.GGGGGOggOGGGG..',
  '..GGGGGGGGGGGG..',
  '...DDDDDDDDDD...',
  '...HHHHHHHHHH...',
  '...DDDDDDDDDD...',
];

// Prima dello schiocco: il medio è alzato
const READY = [
  '................',
  '................',
  '.......GG.......',
  '.......GG.......',
  '....GG.rr.GG....',
  '....GG.rr.GG....',
  '....pp.GG.bb....',
  '.GG.pp.GG.bb....',
  '.GG.GG.GG.GG....',
  ...PALM,
];

// Lo schiocco: il medio scatta giù sul palmo e tra le dita esplode la scintilla
const SNAP = [
  '................',
  '................',
  '................',
  '................',
  '....GG....GG....',
  '....GG....GG.W..',
  '....pp.GG.bbWWW.',
  '.GG.pp.rr.bb.W..',
  '.GG.GG.rr.GG....',
  ...PALM,
];

// Pixel di "polvere" che volano via dopo lo schiocco, come la trama
const DUST = [
  { x: 15, y: 6, dx: 9, dy: -7, c: '#cfc6b8', d: 0 },
  { x: 14, y: 9, dx: 12, dy: -3, c: '#a855f7', d: 0.06 },
  { x: 15, y: 11, dx: 10, dy: 2, c: '#e0b23a', d: 0.12 },
  { x: 13, y: 4, dx: 7, dy: -9, c: '#cfc6b8', d: 0.18 },
  { x: 15, y: 8, dx: 13, dy: -6, c: '#ffe08a', d: 0.1 },
  { x: 14, y: 13, dx: 11, dy: 5, c: '#cfc6b8', d: 0.22 },
];

const SnapGauntlet = ({ className = '' }: { className?: string }) => (
  <svg viewBox="-1 -1 27 22" className={`snap-gauntlet ${className}`} shapeRendering="crispEdges" aria-hidden="true">
    <PixelGrid rows={READY} palette={PALETTE} classes={GEM_CLASSES} className="snap-frame snap-ready" />
    <PixelGrid rows={SNAP} palette={PALETTE} classes={GEM_CLASSES} className="snap-frame snap-done" />
    <g className="snap-dust">
      {DUST.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          fill={p.c}
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--delay': `${p.d}s` } as React.CSSProperties}
        />
      ))}
    </g>
  </svg>
);

// Trama mancante: Thanos ha schioccato le dita
export const MissingOverview = ({ compact = false }: { compact?: boolean }) => (
  <div className={`snap-missing ${compact ? 'is-compact' : ''}`} role="note">
    <div className="snap-missing-art"><SnapGauntlet /></div>
    <div className="snap-missing-text">
      <strong>Blip! Thanos ha fatto sparire la trama!</strong>
      <span>Uno schiocco di dita e la sinossi è svanita nel nulla. Tornerà quando le Gemme lo vorranno.</span>
    </div>
  </div>
);

export default SnapGauntlet;
