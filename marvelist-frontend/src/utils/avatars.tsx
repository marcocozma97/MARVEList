import type { ReactNode } from 'react';

// Fuochi d'artificio dell'emblema di Jubilee
const FIREWORKS = [
  { cx: 22, cy: 22, color: '#ff4fa3', r: 11 },
  { cx: 44, cy: 26, color: '#ffd23f', r: 12 },
  { cx: 28, cy: 44, color: '#3ee0ff', r: 10 },
];

// Avatar predefiniti: emblemi Marvel disegnati in SVG (nessuna immagine esterna da caricare)
export const AVATARS: { id: string; label: string; svg: ReactNode }[] = [
  {
    id: 'shield', label: 'Captain America',
    svg: (
      <>
        <rect width="64" height="64" fill="#0d1b3d" />
        <circle cx="32" cy="32" r="26" fill="#ed1d24" />
        <circle cx="32" cy="32" r="20" fill="#f4f4f4" />
        <circle cx="32" cy="32" r="14" fill="#ed1d24" />
        <circle cx="32" cy="32" r="9" fill="#1f3a8a" />
        <polygon points="32,24.5 34.2,29.6 39.6,29.8 35.4,33.2 36.9,38.4 32,35.4 27.1,38.4 28.6,33.2 24.4,29.8 29.8,29.6" fill="#f4f4f4" />
      </>
    )
  },
  {
    id: 'reactor', label: 'Iron Man',
    svg: (
      <>
        <rect width="64" height="64" fill="#2a0a0a" />
        <circle cx="32" cy="32" r="24" fill="#b8141a" />
        <circle cx="32" cy="32" r="18" fill="#0b1720" stroke="#ffcc33" strokeWidth="2" />
        <circle cx="32" cy="32" r="13" fill="none" stroke="#7df9ff" strokeWidth="3" />
        <polygon points="32,22 41,38 23,38" fill="none" stroke="#7df9ff" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="4" fill="#e9feff" />
      </>
    )
  },
  {
    id: 'spider', label: 'Spider-Man',
    svg: (
      <>
        <rect width="64" height="64" fill="#c8102e" />
        <path d="M0 21h64M0 43h64M21 0v64M43 0v64" stroke="#8a0b20" strokeWidth="1.2" />
        <g stroke="#111" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M28 27 L19 18 L14 22" /><path d="M36 27 L45 18 L50 22" />
          <path d="M27 31 L15 29 L11 34" /><path d="M37 31 L49 29 L53 34" />
          <path d="M27 36 L17 41 L15 48" /><path d="M37 36 L47 41 L49 48" />
          <path d="M29 40 L23 49 L24 55" /><path d="M35 40 L41 49 L40 55" />
        </g>
        <ellipse cx="32" cy="26" rx="4.5" ry="5" fill="#111" />
        <ellipse cx="32" cy="37" rx="6" ry="8" fill="#111" />
      </>
    )
  },
  {
    id: 'hammer', label: 'Thor',
    svg: (
      <>
        <rect width="64" height="64" fill="#13294b" />
        <path d="M44 6 L36 20 L42 20 L34 34" stroke="#9ad8ff" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <rect x="29" y="30" width="6" height="26" rx="2" fill="#7a4a24" />
        <rect x="29" y="50" width="6" height="3" fill="#c9a227" />
        <rect x="16" y="16" width="32" height="18" rx="3" fill="#9aa4b1" />
        <rect x="16" y="16" width="32" height="5" rx="2" fill="#c3ccd6" />
        <path d="M26 25h12" stroke="#6b7480" strokeWidth="2" />
      </>
    )
  },
  {
    id: 'panther', label: 'Black Panther',
    svg: (
      <>
        <rect width="64" height="64" fill="#1a1024" />
        <circle cx="32" cy="32" r="25" fill="#2b1a3d" stroke="#8e5bd1" strokeWidth="2" />
        <g stroke="#e6e0f0" strokeWidth="3.5" strokeLinecap="round">
          <path d="M20 18 L30 46" /><path d="M29 15 L37 45" /><path d="M38 16 L44 42" />
        </g>
      </>
    )
  },
  {
    id: 'widow', label: 'Black Widow',
    svg: (
      <>
        <rect width="64" height="64" fill="#0e0e0e" />
        <circle cx="32" cy="32" r="25" fill="#1b1b1b" stroke="#ed1d24" strokeWidth="2" />
        <polygon points="20,18 44,18 32,32" fill="#ed1d24" />
        <polygon points="20,46 44,46 32,32" fill="#ed1d24" />
      </>
    )
  },
  {
    id: 'strange', label: 'Doctor Strange',
    svg: (
      <>
        <rect width="64" height="64" fill="#1c0f05" />
        <circle cx="32" cy="32" r="25" fill="none" stroke="#ff9a1f" strokeWidth="2.5" />
        <circle cx="32" cy="32" r="19" fill="none" stroke="#ff9a1f" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="19" y="19" width="26" height="26" fill="none" stroke="#ffb54d" strokeWidth="1.5" transform="rotate(45 32 32)" />
        <path d="M18 32 Q32 20 46 32 Q32 44 18 32 Z" fill="#c9a227" />
        <circle cx="32" cy="32" r="5" fill="#3cff8a" />
      </>
    )
  },
  {
    id: 'infinity', label: 'Guanto dell’Infinito',
    svg: (
      <>
        <rect width="64" height="64" fill="#3a2a05" />
        <circle cx="32" cy="32" r="25" fill="#c9a227" />
        <circle cx="32" cy="32" r="25" fill="none" stroke="#f1d36b" strokeWidth="2" />
        <circle cx="32" cy="32" r="6" fill="#f5a623" />
        <circle cx="32" cy="17" r="4.5" fill="#3b82f6" />
        <circle cx="45" cy="24.5" r="4.5" fill="#ef4444" />
        <circle cx="45" cy="39.5" r="4.5" fill="#a855f7" />
        <circle cx="32" cy="47" r="4.5" fill="#22c55e" />
        <circle cx="19" cy="39.5" r="4.5" fill="#facc15" />
        <circle cx="19" cy="24.5" r="4.5" fill="#f97316" />
      </>
    )
  },
  {
    id: 'deadpool', label: 'Deadpool',
    svg: (
      <>
        <rect width="64" height="64" fill="#160404" />
        <circle cx="32" cy="32" r="25" fill="#c8102e" stroke="#111" strokeWidth="3" />
        <rect x="29" y="7" width="6" height="50" fill="#111" />
        <ellipse cx="19" cy="30" rx="11" ry="9" fill="#111" />
        <ellipse cx="45" cy="30" rx="11" ry="9" fill="#111" />
        <path d="M14 30 Q20 24 27 29 Q21 34 14 30 Z" fill="#f4f4f4" />
        <path d="M50 30 Q44 24 37 29 Q43 34 50 30 Z" fill="#f4f4f4" />
      </>
    )
  },
  {
    id: 'loki', label: 'Loki',
    svg: (
      <>
        <rect width="64" height="64" fill="#0c2a1c" />
        <circle cx="32" cy="34" r="24" fill="#14482f" />
        <path d="M24 34 C20 24 16 14 8 6 C18 9 26 18 29 30 Z" fill="#e2b33a" stroke="#8a6512" strokeWidth="1.2" />
        <path d="M40 34 C44 24 48 14 56 6 C46 9 38 18 35 30 Z" fill="#e2b33a" stroke="#8a6512" strokeWidth="1.2" />
        <path d="M22 30 Q32 24 42 30 L42 44 Q37 52 32 52 Q27 52 22 44 Z" fill="#d9a62c" stroke="#8a6512" strokeWidth="1.2" />
        <path d="M27 32 Q32 30 37 32 L36 46 Q32 49 28 46 Z" fill="#0c2a1c" />
      </>
    )
  },
  {
    id: 'fantastic', label: 'Mr. Fantastic',
    svg: (
      <>
        <rect width="64" height="64" fill="#0b2a5b" />
        <path d="M6 50 C14 38 10 26 20 20 C30 14 30 30 40 26 C50 22 48 10 58 8" stroke="#3d7bd9" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
        <circle cx="32" cy="32" r="17" fill="#f4f4f4" stroke="#1d4fa3" strokeWidth="3" />
        <path d="M35 21 L24 36 L39 36 M35 21 L35 44" stroke="#1d4fa3" strokeWidth="4.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'thing', label: 'La Cosa',
    svg: (
      <>
        <rect width="64" height="64" fill="#3d1d06" />
        <g fill="#d9792b" stroke="#6b3410" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M8 10 L24 6 L28 20 L12 24 Z" /><path d="M28 6 L46 8 L44 22 L30 20 Z" /><path d="M48 8 L58 14 L56 26 L46 22 Z" />
          <path d="M6 28 L12 26 L22 30 L20 44 L8 42 Z" /><path d="M24 30 L42 26 L44 42 L26 46 Z" /><path d="M46 26 L58 30 L56 44 L46 42 Z" />
          <path d="M8 46 L22 48 L22 58 L10 58 Z" /><path d="M26 48 L44 46 L42 58 L26 58 Z" /><path d="M46 46 L56 48 L56 58 L46 58 Z" />
        </g>
        <circle cx="34" cy="36" r="7" fill="#1d4fa3" stroke="#f4f4f4" strokeWidth="1.5" />
        <path d="M35.5 31.5 L31 37.5 L37.5 37.5 M35.5 31.5 L35.5 40.5" stroke="#f4f4f4" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      </>
    )
  },
  {
    id: 'torch', label: 'Torcia Umana',
    svg: (
      <>
        <rect width="64" height="64" fill="#2a0b02" />
        <path d="M32 6 C40 18 52 22 50 38 C49 50 41 58 32 58 C23 58 15 50 14 40 C13 30 20 26 22 18 C26 24 26 28 28 30 C28 20 30 12 32 6 Z" fill="#ff6a13" />
        <path d="M32 22 C37 30 44 34 42 44 C41 51 37 54 32 54 C27 54 23 50 22 44 C21 38 26 34 27 30 C29 34 30 36 31 37 C31 31 31 27 32 22 Z" fill="#ffc53d" />
        <path d="M34 34 L27 44 L37 44 M34 34 L34 50" stroke="#a52a00" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'invisible', label: 'Sue Storm',
    svg: (
      <>
        <rect width="64" height="64" fill="#0a1f3d" />
        <circle cx="32" cy="32" r="25" fill="rgba(125, 200, 255, 0.12)" stroke="#8fd3ff" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="32" cy="32" r="17" fill="rgba(125, 200, 255, 0.18)" stroke="#bfe6ff" strokeWidth="1.5" />
        <path d="M35 21 L24 36 L39 36 M35 21 L35 44" stroke="#e8f6ff" strokeWidth="4" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.75" />
      </>
    )
  },
  {
    id: 'doom', label: 'Doctor Doom',
    svg: (
      <>
        <rect width="64" height="64" fill="#0f2a14" />
        <path d="M10 64 L10 30 Q10 6 32 6 Q54 6 54 30 L54 64 Z" fill="#1d5b2a" />
        <path d="M17 52 L17 26 Q17 12 32 12 Q47 12 47 26 L47 52 Q40 58 32 58 Q24 58 17 52 Z" fill="#9aa3ad" stroke="#5e666f" strokeWidth="1.5" />
        <rect x="21" y="27" width="9" height="3.5" rx="1" fill="#111" />
        <rect x="34" y="27" width="9" height="3.5" rx="1" fill="#111" />
        <path d="M32 31 L32 41" stroke="#5e666f" strokeWidth="2" />
        <g stroke="#3a4148" strokeWidth="1.6"><path d="M24 45h16" /><path d="M26 45v6M30 45v7M34 45v7M38 45v6" /></g>
      </>
    )
  },
  {
    id: 'magneto', label: 'Magneto',
    svg: (
      <>
        <rect width="64" height="64" fill="#2a0d38" />
        <path d="M12 46 L12 28 Q12 8 32 8 Q52 8 52 28 L52 46 L44 46 L44 30 L20 30 L20 46 Z" fill="#b5121b" stroke="#6d0a10" strokeWidth="1.5" />
        <path d="M32 8 L28 22 L36 22 Z" fill="#6d0a10" />
        <path d="M20 30 L44 30 L42 38 Q32 42 22 38 Z" fill="#6b2a8c" />
        <path d="M22 46 L22 56 M42 46 L42 56" stroke="#b5121b" strokeWidth="5" strokeLinecap="round" />
        <path d="M17 56 A15 10 0 0 0 47 56" stroke="#c9ced6" strokeWidth="3" fill="none" />
      </>
    )
  },
  {
    id: 'ultron', label: 'Ultron',
    svg: (
      <>
        <rect width="64" height="64" fill="#111418" />
        <path d="M14 22 Q14 6 32 6 Q50 6 50 22 L48 44 Q42 58 32 58 Q22 58 16 44 Z" fill="#b8c0ca" stroke="#6d7680" strokeWidth="1.5" />
        <path d="M20 26 L29 28 L28 32 L20 30 Z" fill="#ff2a2a" />
        <path d="M44 26 L35 28 L36 32 L44 30 Z" fill="#ff2a2a" />
        <path d="M24 42 Q32 48 40 42 L38 46 Q32 51 26 46 Z" fill="#ff2a2a" />
        <path d="M32 8 L32 22" stroke="#6d7680" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255, 42, 42, 0.25)" strokeWidth="2" />
      </>
    )
  },
  {
    id: 'scarlet', label: 'Scarlet Witch',
    svg: (
      <>
        <rect width="64" height="64" fill="#2a0410" />
        <g fill="none" stroke="#ff3b6b" strokeWidth="2" opacity="0.6" strokeLinecap="round">
          <path d="M8 50 Q20 40 14 30 Q8 20 20 14" /><path d="M56 50 Q44 40 50 30 Q56 20 44 14" />
        </g>
        <path d="M14 40 L20 18 L26 28 L32 8 L38 28 L44 18 L50 40 Q32 48 14 40 Z" fill="#c8102e" stroke="#ff5c87" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M32 18 L36 30 L32 36 L28 30 Z" fill="#ff8fab" />
        <circle cx="32" cy="54" r="4" fill="#ff3b6b" />
      </>
    )
  },
  {
    id: 'thanos', label: 'Thanos',
    svg: (
      <>
        <rect width="64" height="64" fill="#1e1030" />
        <path d="M16 24 Q16 8 32 8 Q48 8 48 24 L48 42 Q46 56 32 58 Q18 56 16 42 Z" fill="#7a5aa6" />
        <g stroke="#4b3170" strokeWidth="2.2" strokeLinecap="round"><path d="M24 44 L24 52" /><path d="M29 46 L29 56" /><path d="M35 46 L35 56" /><path d="M40 44 L40 52" /></g>
        <path d="M22 30 L29 31" stroke="#2a1a40" strokeWidth="3" strokeLinecap="round" />
        <path d="M42 30 L35 31" stroke="#2a1a40" strokeWidth="3" strokeLinecap="round" />
        <path d="M12 28 Q12 4 32 4 Q52 4 52 28 L48 26 Q46 12 32 12 Q18 12 16 26 Z" fill="#d4a62a" stroke="#8a6512" strokeWidth="1.2" />
      </>
    )
  },
  {
    id: 'shield-agency', label: 'S.H.I.E.L.D.',
    svg: (
      <>
        <rect width="64" height="64" fill="#0b1626" />
        <circle cx="32" cy="32" r="26" fill="#14263f" stroke="#c9ced6" strokeWidth="2.5" />
        <path d="M32 14 L36 20 L35 26 L44 22 L54 20 L46 28 L52 30 L42 33 L38 40 L40 50 L32 44 L24 50 L26 40 L22 33 L12 30 L18 28 L10 20 L20 22 L29 26 L28 20 Z" fill="#e6e9ee" />
        <circle cx="32" cy="20" r="1.6" fill="#14263f" />
      </>
    )
  },
  {
    id: 'hydra', label: 'HYDRA',
    svg: (
      <>
        <rect width="64" height="64" fill="#0d0d0d" />
        <circle cx="32" cy="32" r="27" fill="none" stroke="#c8102e" strokeWidth="2" />
        <g stroke="#c8102e" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M24 38 Q16 46 18 56" /><path d="M40 38 Q48 46 46 56" />
          <path d="M22 32 Q10 34 8 44" /><path d="M42 32 Q54 34 56 44" />
          <path d="M28 40 Q28 50 24 58" /><path d="M36 40 Q36 50 40 58" />
        </g>
        <path d="M20 24 Q20 10 32 10 Q44 10 44 24 Q44 32 39 35 L38 40 L26 40 L25 35 Q20 32 20 24 Z" fill="#c8102e" />
        <ellipse cx="27" cy="24" rx="3.5" ry="4" fill="#0d0d0d" />
        <ellipse cx="37" cy="24" rx="3.5" ry="4" fill="#0d0d0d" />
        <path d="M32 28 L30 32 L34 32 Z" fill="#0d0d0d" />
      </>
    )
  },
  {
    id: 'wolverine', label: 'Wolverine',
    svg: (
      <>
        <rect width="64" height="64" fill="#f2c21b" />
        <path d="M4 10 L24 26 L32 30 L40 26 L60 10 L52 34 L40 40 L32 38 L24 40 L12 34 Z" fill="#111" />
        <path d="M18 28 L28 32 L26 36 L19 33 Z" fill="#f4f4f4" />
        <path d="M46 28 L36 32 L38 36 L45 33 Z" fill="#f4f4f4" />
        <g stroke="#c9ced6" strokeWidth="2.6" strokeLinecap="round"><path d="M22 62 L26 46" /><path d="M32 62 L32 46" /><path d="M42 62 L38 46" /></g>
      </>
    )
  },
  {
    id: 'cyclops', label: 'Ciclope',
    svg: (
      <>
        <rect width="64" height="64" fill="#0e1f4d" />
        <path d="M14 22 Q14 8 32 8 Q50 8 50 22 L50 44 Q46 56 32 58 Q18 56 14 44 Z" fill="#1d3f99" />
        <rect x="8" y="24" width="48" height="11" rx="5" fill="#f2c21b" />
        <rect x="12" y="26.5" width="40" height="6" rx="3" fill="#ff2a2a" />
        <rect x="14" y="27.5" width="36" height="2" rx="1" fill="#ffb3b3" />
        <path d="M24 46 Q32 50 40 46" stroke="#e8c6a8" strokeWidth="6" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'gambit', label: 'Gambit',
    svg: (
      <>
        <rect width="64" height="64" fill="#1c0b26" />
        <g transform="rotate(-12 32 31)">
          <rect x="18" y="10" width="28" height="42" rx="3" fill="#f4f4f4" stroke="#ff2fb4" strokeWidth="3" />
          <path d="M32 22 C36 27 41 30 37 35 C35 37 33 36 32 34 C31 36 29 37 27 35 C23 30 28 27 32 22 Z M32 33 L34 40 L30 40 Z" fill="#111" />
        </g>
        <circle cx="46" cy="14" r="5" fill="#ff2fb4" opacity="0.8" />
        <circle cx="46" cy="14" r="9" fill="none" stroke="#ff2fb4" strokeWidth="1.5" opacity="0.5" />
      </>
    )
  },
  {
    id: 'nightcrawler', label: 'Nightcrawler',
    svg: (
      <>
        <rect width="64" height="64" fill="#10133a" />
        <g fill="#6a4fb3" opacity="0.75">
          <circle cx="20" cy="22" r="9" /><circle cx="30" cy="16" r="8" /><circle cx="42" cy="20" r="9" /><circle cx="26" cy="28" r="7" /><circle cx="38" cy="29" r="7" />
        </g>
        <path d="M12 54 C24 54 30 46 32 38 C34 30 42 30 46 36" stroke="#2b3a8f" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M46 36 L52 34 L50 42 Z M48 30 L46 36 L52 34 Z" fill="#2b3a8f" />
        <circle cx="27" cy="22" r="2.2" fill="#ffe14d" />
        <circle cx="36" cy="22" r="2.2" fill="#ffe14d" />
      </>
    )
  },
  {
    id: 'phoenix', label: 'Fenice',
    svg: (
      <>
        <rect width="64" height="64" fill="#3a0a02" />
        <circle cx="32" cy="32" r="26" fill="#1f7a3a" />
        <path d="M32 12 C34 18 34 22 32 26 C40 22 48 16 56 14 C50 24 44 30 36 34 L38 42 L32 52 L26 42 L28 34 C20 30 14 24 8 14 C16 16 24 22 32 26 C30 22 30 18 32 12 Z" fill="#f6c21b" stroke="#ff7a1a" strokeWidth="1.2" strokeLinejoin="round" />
      </>
    )
  },
  {
    id: 'storm', label: 'Tempesta',
    svg: (
      <>
        <rect width="64" height="64" fill="#1a1f2b" />
        <g fill="#5b6478">
          <circle cx="20" cy="22" r="10" /><circle cx="34" cy="16" r="12" /><circle cx="46" cy="24" r="9" /><rect x="12" y="22" width="40" height="10" rx="5" />
        </g>
        <path d="M34 30 L26 44 L32 44 L28 58 L42 40 L35 40 L40 30 Z" fill="#f4f8ff" />
        <path d="M14 38 L12 44 M20 40 L18 46 M48 38 L46 44" stroke="#8fb4ff" strokeWidth="2" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'jubilee', label: 'Jubilee',
    svg: (
      <>
        <rect width="64" height="64" fill="#1b0c33" />
        {FIREWORKS.map(({ cx, cy, color, r }) => (
          <g key={`${cx}-${cy}`} stroke={color} strokeWidth="2" strokeLinecap="round">
            {Array.from({ length: 8 }, (_, k) => {
              const a = (k * Math.PI) / 4;
              return <path key={k} d={`M${cx + Math.cos(a) * r * 0.35} ${cy + Math.sin(a) * r * 0.35} L${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`} />;
            })}
            <circle cx={cx} cy={cy} r="1.8" fill={color} stroke="none" />
          </g>
        ))}
        <circle cx="50" cy="48" r="2" fill="#ffd23f" /><circle cx="12" cy="52" r="1.6" fill="#ff4fa3" /><circle cx="52" cy="10" r="1.6" fill="#3ee0ff" />
      </>
    )
  },
];
