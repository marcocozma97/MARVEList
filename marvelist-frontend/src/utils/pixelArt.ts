// Sprite a 8 bit: ogni carattere è un pixel (il punto è trasparente), la palette dà il colore.
// Il componente PixelSprite li disegna in CSS puro con un box-shadow per pixel.
export interface SpriteDef { rows: string[]; palette: Record<string, string> }

export const IRON_MAN: SpriteDef = {
  palette: { k: '#2a0607', r: '#c8102e', g: '#f5b700', w: '#e9feff', c: '#7df9ff', f: '#ff9a1f' },
  rows: [
    '...kkkkkk...',
    '..krrrrrrk..',
    '.krggggggrk.',
    '.kgwwggwwgk.',
    '.kggggggggk.',
    '.krggkkggrk.',
    '..krrrrrrk..',
    '.kkrrrrrrkk.',
    'krrrrccrrrrk',
    'krgrrccrrgrk',
    'krgrrrrrrgrk',
    'kgkkrrrrkkgk',
    '...krrrrk...',
    '...krkkrk...',
    '...kgkkgk...',
  ],
};

// Fiamme dei propulsori sotto i piedi (sprite separato per farle tremolare)
export const IRON_MAN_FLAMES: SpriteDef = {
  palette: { f: '#ff9a1f', y: '#ffe066' },
  rows: ['...yf..fy...', '....f..f....'],
};

export const WOLVERINE: SpriteDef = {
  palette: { k: '#111111', y: '#facc15', b: '#1e3a8a', s: '#e0a878', w: '#ffffff' },
  rows: [
    'k..........k',
    'kk........kk',
    '.kkyyyyyykk.',
    '..yyyyyyyy..',
    '..ywwyywwy..',
    '..yssssssy..',
    '...yssssy...',
    '..bbyyyybb..',
    '.bbbyyyybbb.',
    '.bbyybbyybb.',
    'ss.yyyyyy.ss',
    '...kkkkkk...',
    '...bbyybb...',
    '...yy..yy...',
    '...yy..yy...',
    '..bbb..bbb..',
  ],
};

export const CAPTAIN_AMERICA: SpriteDef = {
  palette: { b: '#1d4ed8', w: '#ffffff', r: '#dc2626', s: '#e8b48a', k: '#0b1020' },
  rows: [
    '...bbbbbb...',
    '..bbbwwbbb..',
    '..bbwbbwbb..',
    '..bssssssb..',
    '..bskssksb..',
    '...ssssss...',
    '..bbbwwbbb..',
    '.bbbwwwwbbb.',
    '.bbbbwwbbbb.',
    '.rwrwrwrwrw.',
    's.rwrwrwrw.s',
    '...bbbbbb...',
    '...bbbbbb...',
    '...bb..bb...',
    '...rr..rr...',
    '..rrr..rrr..',
  ],
};

export const SHIELD: SpriteDef = {
  palette: { r: '#dc2626', w: '#ffffff', b: '#1d4ed8' },
  rows: [
    '..rrrr..',
    '.rwwwwr.',
    'rwbbbbwr',
    'rwbwwbwr',
    'rwbwwbwr',
    'rwbbbbwr',
    '.rwwwwr.',
    '..rrrr..',
  ],
};

export const spriteShadow = ({ rows, palette }: SpriteDef, px: number) => {
  const shadows: string[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const color = palette[ch];
    if (color) shadows.push(`${x * px}px ${y * px}px 0 ${color}`);
  }));
  return shadows.join(',');
};
