import { PixelGrid } from './PixelArt';

// TV anni '50 a 8 bit con Wanda e Visione nella loro sitcom di Westview.
// Lo schermo è in bianco e nero; ogni tanto la magia di Wanda lo fa lampeggiare a colori.

const WANDA_PALETTE: Record<string, string> = {
  h: '#8a2b1f', s: '#f1c7a3', e: '#1d1d1d', m: '#c0392b', d: '#2f5fb3', w: '#f4f4f4',
};
const WANDA = [
  '...hhhh...',
  '..hhhhhh..',
  '.hhhhhhhh.',
  '.hhsssshh.',
  '.hsessesh.',
  '.hssssssh.',
  '.hssmmssh.',
  'hh.ssss.hh',
  'hh..ss..hh',
  'hhdwwwwdhh',
  '.dddwwddd.',
  'dddddddddd',
  'dddddddddd',
  'dddddddddd',
];

const VISION_PALETTE: Record<string, string> = {
  g: '#2e7d4f', v: '#c0392b', y: '#f1c40f', e: '#f5e6a8', m: '#7c1d14', k: '#2b2b33', w: '#f4f4f4', t: '#7a1f2b',
};
const VISION = [
  '..gggggg..',
  '.gggggggg.',
  '.ggvvyvvgg',
  '.gvvvvvvg.',
  '.gvevvevg.',
  '.gvvvvvvg.',
  '..vvmmvv..',
  '...vvvv...',
  'kkkwttwkkk',
  'kkkwttwkkk',
  'kkkkttkkkk',
  'kkkkttkkkk',
  'kkkkkkkkkk',
  'kkkkkkkkkk',
  'kkkkkkkkkk',
];

// Arredo della sitcom: parete, finestra con le tende e lampada
const SET_PALETTE: Record<string, string> = { f: '#e9e1d2', c: '#c46a5a', l: '#f3d27a', b: '#6b5a48' };
const WINDOW = [
  'cbbbbbbc',
  'cffbbffc',
  'cffbbffc',
  'cbbbbbbc',
  'cffbbffc',
  'cffbbffc',
  'cbbbbbbc',
];
const LAMP = [
  '.lll.',
  'lllll',
  '..b..',
  '..b..',
  '..b..',
  '.bbb.',
];

// La scena della sitcom: disegnata due volte, in bianco e nero e a colori
const Sitcom = ({ className }: { className: string }) => (
  <g className={className}>
    <rect x={9} y={14} width={35} height={26} fill="#d8cfbf" />
    <rect x={9} y={33} width={35} height={7} fill="#a8927a" />
    <PixelGrid rows={WINDOW} palette={SET_PALETTE} x={18} y={16} />
    <PixelGrid rows={LAMP} palette={SET_PALETTE} x={39} y={27} />
    <g className="tv-actor tv-wanda"><PixelGrid rows={WANDA} palette={WANDA_PALETTE} x={13} y={26} /></g>
    <g className="tv-actor tv-vision"><PixelGrid rows={VISION} palette={VISION_PALETTE} x={28} y={25} /></g>
  </g>
);

const WestviewTV = () => (
  <div className="westview-tv-wrap" aria-hidden="true">
  <svg viewBox="0 0 64 50" className="westview-tv" shapeRendering="crispEdges">
    {/* Antenne a coniglio */}
    <g className="tv-antenna" fill="#9aa4b1">
      {Array.from({ length: 7 }, (_, i) => <rect key={`l${i}`} x={27 - i} y={8 - i} width={1} height={1} />)}
      {Array.from({ length: 7 }, (_, i) => <rect key={`r${i}`} x={36 + i} y={8 - i} width={1} height={1} />)}
      <rect x={19} y={1} width={2} height={2} fill="#d9dee5" />
      <rect x={42} y={1} width={2} height={2} fill="#d9dee5" />
      <rect x={28} y={7} width={8} height={2} fill="#4a3a2a" />
    </g>

    {/* Mobile in legno */}
    <rect x={3} y={9} width={58} height={36} fill="#5c3a1e" />
    <rect x={4} y={9} width={56} height={36} fill="#8a5a2b" />
    <rect x={3} y={10} width={58} height={34} fill="#8a5a2b" />
    <rect x={4} y={10} width={56} height={1} fill="#b07a3e" />
    <rect x={4} y={43} width={56} height={1} fill="#6b4422" />
    <rect x={10} y={45} width={4} height={4} fill="#4a2e16" />
    <rect x={50} y={45} width={4} height={4} fill="#4a2e16" />

    {/* Cornice e schermo */}
    <rect x={7} y={12} width={39} height={30} fill="#2a1d12" />
    <filter id="westview-bw"><feColorMatrix type="saturate" values="0" /></filter>
    <g filter="url(#westview-bw)"><Sitcom className="tv-screen-bw" /></g>
    <Sitcom className="tv-screen-color" />
    {/* Angoli arrotondati dello schermo */}
    <g fill="#2a1d12">
      <rect x={9} y={14} width={2} height={1} /><rect x={9} y={15} width={1} height={1} />
      <rect x={42} y={14} width={2} height={1} /><rect x={43} y={15} width={1} height={1} />
      <rect x={9} y={39} width={2} height={1} /><rect x={9} y={38} width={1} height={1} />
      <rect x={42} y={39} width={2} height={1} /><rect x={43} y={38} width={1} height={1} />
    </g>

    {/* Pannello: manopole e griglia dell'altoparlante */}
    <rect x={48} y={12} width={10} height={30} fill="#734a24" />
    <rect x={50} y={15} width={6} height={6} fill="#2a1d12" />
    <rect x={51} y={16} width={4} height={4} fill="#d9b25a" className="tv-knob" />
    <rect x={50} y={23} width={6} height={6} fill="#2a1d12" />
    <rect x={51} y={24} width={4} height={4} fill="#d9b25a" />
    <g fill="#4a2e16">
      {[31, 33, 35, 37, 39].map(y => <rect key={y} x={49} y={y} width={8} height={1} />)}
    </g>
    <rect x={52} y={17} width={2} height={1} fill="#7a5a1e" />
  </svg>
  {/* Vetro del tubo catodico: righe di scansione, banda che scorre e bagliore */}
  <span className="tv-crt" />
  </div>
);

// Trailer mancante: al suo posto la "pubblicità" di Westview
export const NoTrailer = () => (
  <div className="no-trailer" role="note" aria-label="Non abbiamo un trailer... pubblicità">
    <div className="no-trailer-caption" aria-hidden="true">
      <span className="no-trailer-line">Non abbiamo un trailer...</span>
      <span className="no-trailer-ad">Pubblicità</span>
    </div>
    <WestviewTV />
  </div>
);

export default WestviewTV;
