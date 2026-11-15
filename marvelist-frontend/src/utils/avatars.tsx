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
    id: 'hawkeye', label: 'Hawkeye',
    svg: (
      <>
        <rect width="64" height="64" fill="#1e0f33" />
        <circle cx="32" cy="32" r="24" fill="#5b2a96" />
        <circle cx="32" cy="32" r="17" fill="#f4f4f4" />
        <circle cx="32" cy="32" r="11" fill="#5b2a96" />
        <circle cx="32" cy="32" r="5" fill="#f4f4f4" />
        <path d="M10 54 L32 32" stroke="#2a1a10" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 32 L27 31 L31 27 Z" fill="#c9ced6" />
        <path d="M10 54 L8 47 M10 54 L17 56 M13 51 L11 44 M13 51 L20 53" stroke="#c8102e" strokeWidth="2" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'hulk', label: 'Hulk',
    svg: (
      <>
        <rect width="64" height="64" fill="#0f2410" />
        <path d="M14 26 Q14 8 32 8 Q50 8 50 26 L50 40 Q48 56 32 58 Q16 56 14 40 Z" fill="#4c9a2a" />
        <path d="M14 26 Q14 8 32 8 Q50 8 50 26 Q46 16 40 18 Q34 12 28 18 Q20 14 14 26 Z" fill="#1a1a1a" />
        <path d="M19 30 L29 33 M45 30 L35 33" stroke="#1f4d12" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="25" cy="36" rx="3" ry="2" fill="#f4f4f4" />
        <ellipse cx="39" cy="36" rx="3" ry="2" fill="#f4f4f4" />
        <path d="M22 47 Q32 42 42 47 L40 51 Q32 48 24 51 Z" fill="#1f4d12" />
        <path d="M25 47 L39 47 L38 49 L26 49 Z" fill="#f4f4f4" />
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
        <rect width="64" height="64" fill="#1c1030" />
        <circle cx="31" cy="34" r="24" fill="#6d28d9" opacity="0.22" />
        <rect x="18" y="49" width="26" height="13" rx="2" fill="#8a6510" />
        <rect x="18" y="51" width="26" height="2.5" fill="#f3d36b" />
        <rect x="14.5" y="19" width="6.5" height="20" rx="3.2" fill="#c99a1a" />
        <rect x="21.5" y="13" width="6.5" height="26" rx="3.2" fill="#d4a62a" />
        <rect x="28.5" y="10" width="6.5" height="29" rx="3.2" fill="#dcae2e" />
        <rect x="35.5" y="13" width="6.5" height="26" rx="3.2" fill="#d4a62a" />
        <path d="M41 42 L46 30 Q48 26 51 28 Q53 30 51.5 33 L46 46 Z" fill="#c99a1a" />
        <path d="M14.5 34 Q15 31 18 31 L42 31 Q46 33 46.5 38 L46 46 Q44 53 31 53 Q17 53 15.5 46 Z" fill="#e0b23a" />
        <path d="M17 34 Q30 30 44 34" stroke="#f3d36b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M15 28 h6 M22 26 h6 M29 25 h6 M36 26 h6" stroke="#8a6510" strokeWidth="1.2" />
        <circle cx="17.75" cy="23.5" r="2.3" fill="#facc15" stroke="#8a6510" strokeWidth="0.8" />
        <circle cx="24.75" cy="19" r="2.3" fill="#a855f7" stroke="#8a6510" strokeWidth="0.8" />
        <circle cx="31.75" cy="16.5" r="2.3" fill="#ef2b2b" stroke="#8a6510" strokeWidth="0.8" />
        <circle cx="38.75" cy="19" r="2.3" fill="#3b82f6" stroke="#8a6510" strokeWidth="0.8" />
        <circle cx="49.2" cy="31" r="2.2" fill="#f97316" stroke="#8a6510" strokeWidth="0.8" />
        <circle cx="30.5" cy="42" r="5.6" fill="#8a6510" />
        <circle cx="30.5" cy="42" r="4.2" fill="#22c55e" />
        <circle cx="29.2" cy="40.6" r="1.3" fill="#bbf7d0" />
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
        <path d="M11 12 L24 26 L32 30 L40 26 L53 12 L52 34 L40 40 L32 38 L24 40 L12 34 Z" fill="#111" />
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
  {
    id: 'starlord', label: 'Star-Lord',
    svg: (
      <>
        <rect width="64" height="64" fill="#1b0f24" />
        <rect x="10" y="27" width="7" height="15" rx="3" fill="#b9c0c9" />
        <rect x="47" y="27" width="7" height="15" rx="3" fill="#b9c0c9" />
        <path d="M14 30 Q14 10 32 10 Q50 10 50 30 L50 42 Q48 54 32 56 Q16 54 14 42 Z" fill="#8b1e1e" />
        <path d="M32 11 L32 24" stroke="#5c1212" strokeWidth="4" strokeLinecap="round" />
        <path d="M18 28 Q24 23 30 30 Q26 36 19 34 Z" fill="#ff2d2d" />
        <path d="M46 28 Q40 23 34 30 Q38 36 45 34 Z" fill="#ff2d2d" />
        <ellipse cx="22" cy="29" rx="2" ry="1.2" fill="#ffb3b3" />
        <ellipse cx="42" cy="29" rx="2" ry="1.2" fill="#ffb3b3" />
        <path d="M20 39 L26 43 M44 39 L38 43" stroke="#b9c0c9" strokeWidth="2" strokeLinecap="round" />
        <path d="M25 46 H39 M26 50 H38" stroke="#3a0b0b" strokeWidth="2" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'gamora', label: 'Gamora',
    svg: (
      <>
        <rect width="64" height="64" fill="#0f1d14" />
        <path d="M12 34 Q10 8 32 8 Q54 8 52 34 L54 60 L10 60 Z" fill="#1a1020" />
        <path d="M10 46 Q14 54 11 60 L19 60 Q16 52 17 44 Z" fill="#d23c95" />
        <path d="M54 46 Q50 54 53 60 L45 60 Q48 52 47 44 Z" fill="#d23c95" />
        <ellipse cx="32" cy="33" rx="13" ry="16" fill="#4f9a55" />
        <path d="M19 27 Q20 12 32 12 Q44 12 45 27 Q38 18 32 20 Q26 18 19 27 Z" fill="#1a1020" />
        <ellipse cx="26" cy="31" rx="2.6" ry="1.8" fill="#111" />
        <ellipse cx="38" cy="31" rx="2.6" ry="1.8" fill="#111" />
        <path d="M21 35 L25 39 M43 35 L39 39" stroke="#d6dde6" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="24" cy="26" r="1" fill="#d6dde6" />
        <circle cx="40" cy="26" r="1" fill="#d6dde6" />
        <path d="M28 42 Q32 44 36 42" stroke="#2a5e2f" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'drax', label: 'Drax',
    svg: (
      <>
        <rect width="64" height="64" fill="#1d1310" />
        <path d="M16 26 Q16 8 32 8 Q48 8 48 26 L48 40 Q46 56 32 58 Q18 56 16 40 Z" fill="#7d8a86" />
        <path d="M32 9 Q29 16 32 23 Q35 16 32 9 Z" fill="#a3221c" />
        <path d="M18 22 Q24 17 26 23 M46 22 Q40 17 38 23 M20 44 Q24 48 22 54 M44 44 Q40 48 42 54" stroke="#a3221c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M21 29 L29 31 M43 29 L35 31" stroke="#3b4441" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="25" cy="34" rx="2.4" ry="1.8" fill="#1a1a1a" />
        <ellipse cx="39" cy="34" rx="2.4" ry="1.8" fill="#1a1a1a" />
        <path d="M26 46 L38 46" stroke="#3b4441" strokeWidth="2.5" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'rocket', label: 'Rocket',
    svg: (
      <>
        <rect width="64" height="64" fill="#14202a" />
        <path d="M12 24 L16 6 L27 17 Z" fill="#6b4a33" />
        <path d="M52 24 L48 6 L37 17 Z" fill="#6b4a33" />
        <path d="M15 19 L17 11 L22 16 Z" fill="#d9b99a" />
        <path d="M49 19 L47 11 L42 16 Z" fill="#d9b99a" />
        <ellipse cx="32" cy="34" rx="20" ry="18" fill="#8a6446" />
        <path d="M20 40 Q32 30 44 40 Q42 54 32 56 Q22 54 20 40 Z" fill="#e7d3bd" />
        <path d="M12 30 Q22 24 32 30 Q42 24 52 30 Q50 38 42 38 Q36 36 32 34 Q28 36 22 38 Q14 38 12 30 Z" fill="#2b1d14" />
        <path d="M32 18 L32 27" stroke="#2b1d14" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="32" r="3" fill="#f4f4f4" />
        <circle cx="40" cy="32" r="3" fill="#f4f4f4" />
        <circle cx="24" cy="32" r="1.6" fill="#111" />
        <circle cx="40" cy="32" r="1.6" fill="#111" />
        <ellipse cx="32" cy="44" rx="3.5" ry="2.5" fill="#111" />
        <path d="M28 49 Q32 52 36 49" stroke="#5a3e2b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'groot', label: 'Groot',
    svg: (
      <>
        <rect width="64" height="64" fill="#10200f" />
        <path d="M24 13 L20 6 M41 12 L44 5" stroke="#5a3b21" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="18" cy="6" rx="5" ry="3" fill="#5fbf4a" transform="rotate(-30 18 6)" />
        <ellipse cx="47" cy="6" rx="5" ry="3" fill="#5fbf4a" transform="rotate(25 47 6)" />
        <path d="M16 28 Q16 10 32 10 Q48 10 48 28 L47 44 Q44 58 32 58 Q20 58 17 44 Z" fill="#7a5230" />
        <path d="M21 15 Q19 30 22 50 M32 12 L32 22 M43 15 Q45 30 42 50" stroke="#5a3b21" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M20 28 Q26 25 30 29 M44 28 Q38 25 34 29" stroke="#4a2f1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="25" cy="33" r="3.2" fill="#1e140b" />
        <circle cx="39" cy="33" r="3.2" fill="#1e140b" />
        <circle cx="26" cy="32" r="1" fill="#f4f4f4" />
        <circle cx="40" cy="32" r="1" fill="#f4f4f4" />
        <path d="M25 45 Q32 51 39 45" stroke="#3a2412" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'mantis', label: 'Mantis',
    svg: (
      <>
        <rect width="64" height="64" fill="#1b1430" />
        <path d="M26 14 Q22 7 18 5 M38 14 Q42 7 46 5" stroke="#2a3a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="18" cy="5" r="2.6" fill="#b6ff6a" />
        <circle cx="46" cy="5" r="2.6" fill="#b6ff6a" />
        <path d="M13 34 Q12 12 32 12 Q52 12 51 34 L52 56 L12 56 Z" fill="#111" />
        <ellipse cx="32" cy="35" rx="13" ry="16" fill="#9fd28a" />
        <path d="M18 27 Q17 13 32 13 Q47 13 46 27 Z" fill="#111" />
        <ellipse cx="26" cy="33" rx="4" ry="3" fill="#111" />
        <ellipse cx="38" cy="33" rx="4" ry="3" fill="#111" />
        <circle cx="27" cy="32" r="1" fill="#f4f4f4" />
        <circle cx="39" cy="32" r="1" fill="#f4f4f4" />
        <path d="M29 45 Q32 47 35 45" stroke="#4d7a3f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'nebula', label: 'Nebula',
    svg: (
      <>
        <rect width="64" height="64" fill="#0d0f22" />
        <path d="M17 28 Q17 9 32 9 Q47 9 47 28 L46 42 Q43 56 32 57 Q21 56 18 42 Z" fill="#3e6fb8" />
        <path d="M17 27 Q18 16 25 12 L25 24 Z" fill="#9aa4b1" />
        <path d="M32 10 L32 20 M44 17 Q40 21 40 25 L44 29" stroke="#6b2a7a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="26" cy="33" rx="3.2" ry="2.4" fill="#0a0a14" />
        <ellipse cx="38" cy="33" rx="3.2" ry="2.4" fill="#0a0a14" />
        <path d="M21 38 L26 42 M43 38 L38 42" stroke="#2a4f8a" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 47 L36 47" stroke="#1f3a66" strokeWidth="2.2" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'vision', label: 'Visione',
    svg: (
      <>
        <rect width="64" height="64" fill="#0f2a1c" />
        <path d="M12 30 Q12 6 32 6 Q52 6 52 30 L52 50 Q46 60 32 61 Q18 60 12 50 Z" fill="#2f7d3a" />
        <path d="M18 30 Q18 12 32 12 Q46 12 46 30 L46 42 Q44 54 32 56 Q20 54 18 42 Z" fill="#c4263c" />
        <path d="M32 12 L32 17 M24 15 Q27 22 26 28 M40 15 Q37 22 38 28" stroke="#e8b33a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M32 17 L36 21 L32 25 L28 21 Z" fill="#ffd84a" stroke="#a87b10" strokeWidth="0.8" />
        <ellipse cx="25.5" cy="33" rx="3" ry="1.8" fill="#f6e7a8" />
        <ellipse cx="38.5" cy="33" rx="3" ry="1.8" fill="#f6e7a8" />
        <path d="M24 38 L26 45 M40 38 L38 45" stroke="#8f1a2a" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M28 47 Q32 48.5 36 47" stroke="#7a1422" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'daredevil', label: 'Daredevil',
    svg: (
      <>
        <rect width="64" height="64" fill="#140608" />
        <path d="M17 34 Q17 16 32 14 Q47 16 47 34 L46 44 Q43 56 32 57 Q21 56 18 44 Z" fill="#e0ad86" />
        <path d="M16 38 L16 24 Q16 10 32 10 Q48 10 48 24 L48 38 Q40 36 38 40 L26 40 Q24 36 16 38 Z" fill="#b0121b" />
        <path d="M20 16 L16 4 L26 12 Z" fill="#b0121b" />
        <path d="M44 16 L48 4 L38 12 Z" fill="#b0121b" />
        <path d="M20 29 Q25 25 30 30 Q25 33 20 29 Z" fill="#4a070c" />
        <path d="M44 29 Q39 25 34 30 Q39 33 44 29 Z" fill="#4a070c" />
        <path d="M32 18 L32 26" stroke="#7d0c13" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M27 49 Q32 50.5 37 49" stroke="#9a6a4c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'punisher', label: 'The Punisher',
    svg: (
      <>
        <rect width="64" height="64" fill="#101010" />
        <path d="M14 26 Q14 8 32 8 Q50 8 50 26 Q50 34 45 38 L19 38 Q14 34 14 26 Z" fill="#f2f2f2" />
        <path d="M19 38 L21 56 L25 58 L27 39 L29 59 L32 60 L35 59 L37 39 L39 58 L43 56 L45 38 Z" fill="#f2f2f2" />
        <path d="M18 24 Q24 19 30 25 Q29 32 22 32 Q18 30 18 24 Z" fill="#101010" />
        <path d="M46 24 Q40 19 34 25 Q35 32 42 32 Q46 30 46 24 Z" fill="#101010" />
        <path d="M32 30 L29.5 36 L34.5 36 Z" fill="#101010" />
      </>
    )
  },
  {
    id: 'jessica', label: 'Jessica Jones',
    svg: (
      <>
        <rect width="64" height="64" fill="#2a1638" />
        <path d="M12 36 Q10 8 32 8 Q54 8 52 36 L54 60 L10 60 Z" fill="#17121c" />
        <ellipse cx="32" cy="33" rx="12.5" ry="15.5" fill="#f0cfb6" />
        <path d="M19 30 Q19 13 33 13 Q45 14 45 28 Q39 18 30 20 Q23 22 19 30 Z" fill="#17121c" />
        <path d="M23 31 Q26 29.5 29 31 M35 31 Q38 29.5 41 31" stroke="#2a1a14" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="33" r="1.3" fill="#2a1a14" />
        <circle cx="38" cy="33" r="1.3" fill="#2a1a14" />
        <path d="M28.5 42 Q32 41 35.5 42" stroke="#b5675e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M18 54 Q32 46 46 54 L48 64 L16 64 Z" fill="#8c8f99" />
        <path d="M22 52 Q32 49 42 52" stroke="#6f727c" strokeWidth="1.4" fill="none" />
      </>
    )
  },
  {
    id: 'lukecage', label: 'Luke Cage',
    svg: (
      <>
        <rect width="64" height="64" fill="#2b2410" />
        <path d="M10 64 L12 46 Q32 36 52 46 L54 64 Z" fill="#f2c21b" />
        <path d="M26 44 L32 54 L38 44" fill="#5c3a22" />
        <circle cx="20" cy="54" r="1.6" fill="#7a5a10" />
        <circle cx="45" cy="57" r="1.6" fill="#7a5a10" />
        <circle cx="40" cy="50" r="1.3" fill="#7a5a10" />
        <path d="M18 28 Q18 9 32 9 Q46 9 46 28 L45 38 Q42 48 32 48 Q22 48 19 38 Z" fill="#5c3a22" />
        <path d="M22 12 Q32 8 42 12" stroke="#b9c0c9" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M22 28 L29 29 M42 28 L35 29" stroke="#2a1a10" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="26" cy="32" rx="2" ry="1.4" fill="#16100a" />
        <ellipse cx="38" cy="32" rx="2" ry="1.4" fill="#16100a" />
        <path d="M26 40 Q32 38 38 40 L36 46 Q32 48 28 46 Z" fill="#1c140d" />
        <path d="M29 42 L35 42" stroke="#7a4c30" strokeWidth="1.3" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'ironfist', label: 'Iron Fist',
    svg: (
      <>
        <rect width="64" height="64" fill="#0d2414" />
        <circle cx="32" cy="34" r="22" fill="#ffd84a" opacity="0.2" />
        <path d="M14 32 Q14 8 32 8 Q50 8 50 32 L50 46 Q46 58 32 59 Q18 58 14 46 Z" fill="#1f8a43" />
        <path d="M20 44 Q20 38 24 38 L40 38 Q44 38 44 44 Q42 54 32 55 Q22 54 20 44 Z" fill="#e8b48e" />
        <path d="M14 24 Q22 18 28 25 L32 28 L36 25 Q42 18 50 24 L48 34 Q40 36 34 33 L32 34 L30 33 Q24 36 16 34 Z" fill="#f5c518" />
        <path d="M14 24 L9 18 L16 22 M50 24 L55 18 L48 22" stroke="#f5c518" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="24" cy="28.5" rx="3.6" ry="2.2" fill="#f7fbff" />
        <ellipse cx="40" cy="28.5" rx="3.6" ry="2.2" fill="#f7fbff" />
        <path d="M28 49 Q32 50.5 36 49" stroke="#a8765a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M32 12 Q28 16 32 19 Q36 16 32 12 Z" fill="#f5c518" />
      </>
    )
  },
  {
    id: 'venom', label: 'Venom',
    svg: (
      <>
        <rect width="64" height="64" fill="#1a1d2e" />
        <path d="M12 30 Q12 6 32 6 Q52 6 52 30 Q52 50 32 60 Q12 50 12 30 Z" fill="#0b0b10" />
        <path d="M14 22 Q20 14 30 26 Q28 34 22 36 Q14 34 14 22 Z" fill="#f4f4f4" />
        <path d="M50 22 Q44 14 34 26 Q36 34 42 36 Q50 34 50 22 Z" fill="#f4f4f4" />
        <path d="M17 40 Q32 34 47 40 Q44 54 32 56 Q20 54 17 40 Z" fill="#7a0f1e" />
        <path d="M17 40 L20 45 L22 39.5 L25 45 L27 38.5 L30 44.5 L32 38 L34 44.5 L37 38.5 L39 45 L42 39.5 L44 45 L47 40 Z" fill="#f4f4f4" />
        <path d="M19 49 L22 45.5 L25 50 L28 46 L32 51 L36 46 L39 50 L42 45.5 L45 49 Q40 55 32 55.5 Q24 55 19 49 Z" fill="#f4f4f4" />
        <path d="M30 47 Q26 56 33 60 Q30 54 34 48 Z" fill="#e0405a" />
      </>
    )
  },
  {
    id: 'miles', label: 'Miles Morales',
    svg: (
      <>
        <rect width="64" height="64" fill="#1a1030" />
        <path d="M0 50 L64 38 L64 44 L0 56 Z" fill="#e0245e" opacity="0.35" />
        <path d="M0 14 L64 22 L64 26 L0 18 Z" fill="#26c6ff" opacity="0.3" />
        <path d="M14 30 Q14 7 32 7 Q50 7 50 30 Q50 52 32 59 Q14 52 14 30 Z" fill="#141418" />
        <g stroke="#d4123a" strokeWidth="1.1" fill="none">
          <path d="M32 7 L32 59 M14 30 L50 30 M18 16 L46 46 M46 16 L18 46" />
          <path d="M22 13 Q32 20 42 13 M17 23 Q32 30 47 23 M16 38 Q32 32 48 38 M20 49 Q32 42 44 49" />
        </g>
        <path d="M17 25 Q23 20 30 28 Q27 35 20 34 Q16 31 17 25 Z" fill="#f4f4f4" stroke="#000" strokeWidth="1.6" />
        <path d="M47 25 Q41 20 34 28 Q37 35 44 34 Q48 31 47 25 Z" fill="#f4f4f4" stroke="#000" strokeWidth="1.6" />
      </>
    )
  },
  {
    id: 'goblin', label: 'Green Goblin',
    svg: (
      <>
        <rect width="64" height="64" fill="#1a0f26" />
        <path d="M10 40 Q8 10 32 6 Q56 10 54 40 L50 34 Q50 14 32 12 Q14 14 14 34 Z" fill="#6b2f8f" />
        <path d="M16 30 L6 22 L17 26 Z" fill="#4e9a2c" />
        <path d="M48 30 L58 22 L47 26 Z" fill="#4e9a2c" />
        <path d="M16 28 Q16 12 32 12 Q48 12 48 28 L47 42 Q44 56 32 58 Q20 56 17 42 Z" fill="#5fb336" />
        <path d="M20 26 L30 30 M44 26 L34 30" stroke="#24521a" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M21 30 Q25 28 29 32 Q25 35 21 30 Z" fill="#ffe14a" />
        <path d="M43 30 Q39 28 35 32 Q39 35 43 30 Z" fill="#ffe14a" />
        <path d="M32 31 Q30 38 33 40" stroke="#3a7a20" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M21 44 Q32 54 43 44 Q32 49 21 44 Z" fill="#1d1d1d" />
        <path d="M23 45 L25 47.5 L27 46 L29 48.5 L32 47 L35 48.5 L37 46 L39 47.5 L41 45" stroke="#f4f4f4" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </>
    )
  },
  {
    id: 'docock', label: 'Doctor Octopus',
    svg: (
      <>
        <rect width="64" height="64" fill="#13221c" />
        <g stroke="#9aa4b1" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M20 54 Q6 50 8 36 Q10 26 4 20" />
          <path d="M44 54 Q58 50 56 36 Q54 26 60 20" />
          <path d="M22 56 Q10 60 6 52" />
          <path d="M42 56 Q54 60 58 52" />
        </g>
        <circle cx="4" cy="20" r="3" fill="#c94b2a" />
        <circle cx="60" cy="20" r="3" fill="#c94b2a" />
        <path d="M18 30 Q18 12 32 12 Q46 12 46 30 L45 42 Q42 54 32 55 Q22 54 19 42 Z" fill="#e8b48e" />
        <path d="M17 30 Q16 10 32 10 Q48 10 47 30 L45 24 Q40 18 32 19 Q24 18 19 24 Z" fill="#3a2a1c" />
        <circle cx="25" cy="32" r="5.2" fill="#1b1b1b" stroke="#5a5a5a" strokeWidth="1.2" />
        <circle cx="39" cy="32" r="5.2" fill="#1b1b1b" stroke="#5a5a5a" strokeWidth="1.2" />
        <path d="M30 32 L34 32" stroke="#5a5a5a" strokeWidth="1.4" />
        <circle cx="23.5" cy="30.5" r="1.2" fill="#7fb3ff" opacity="0.7" />
        <circle cx="37.5" cy="30.5" r="1.2" fill="#7fb3ff" opacity="0.7" />
        <path d="M27 46 Q32 44 37 46" stroke="#8a5a3e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M24 56 L40 56 L38 62 L26 62 Z" fill="#4a5a3a" />
      </>
    )
  },
  {
    id: 'watcher', label: 'The Watcher',
    svg: (
      <>
        <rect width="64" height="64" fill="#070b1f" />
        <circle cx="10" cy="14" r="0.9" fill="#cfd8ff" />
        <circle cx="54" cy="10" r="1.1" fill="#cfd8ff" />
        <circle cx="57" cy="30" r="0.8" fill="#cfd8ff" />
        <circle cx="7" cy="34" r="0.8" fill="#cfd8ff" />
        <circle cx="32" cy="22" r="22" fill="#3b4cc0" opacity="0.18" />
        <path d="M6 64 L9 42 L22 50 Z" fill="#2c2f5e" />
        <path d="M58 64 L55 42 L42 50 Z" fill="#2c2f5e" />
        <path d="M9 64 Q12 50 32 47 Q52 50 55 64 Z" fill="#1b1d3d" />
        <path d="M18 30 Q14 5 32 4 Q50 5 46 30 Q46 42 40 47 Q32 52 24 47 Q18 42 18 30 Z" fill="#ece0cf" />
        <path d="M22 14 Q32 9 42 14" stroke="#d3c4ae" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M21 30 Q26 26.5 31 30 M43 30 Q38 26.5 33 30" stroke="#a8977f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <ellipse cx="26" cy="33.5" rx="3.8" ry="2.6" fill="#f7fbff" />
        <ellipse cx="38" cy="33.5" rx="3.8" ry="2.6" fill="#f7fbff" />
        <ellipse cx="26" cy="33.5" rx="5" ry="3.6" fill="#9fc3ff" opacity="0.25" />
        <ellipse cx="38" cy="33.5" rx="5" ry="3.6" fill="#9fc3ff" opacity="0.25" />
        <path d="M32 33 L30.8 39.5 L33.2 39.5" stroke="#b5a38b" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 43.5 Q32 44.5 36 43.5" stroke="#9c8a72" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <rect x="25.5" y="50.5" width="13" height="11" rx="2.5" fill="#111" stroke="#e62429" strokeWidth="1.2" />
        <path d="M28.3 59 V53.3 L32 57 L35.7 53.3 V59" stroke="#e62429" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </>
    )
  },
];

// Categorie in cui sono divisi gli avatar nella scelta dell'immagine profilo
export const AVATAR_GROUPS: { title: string; ids: string[]; onlyFor?: string }[] = [
  { title: 'Avengers', ids: ['shield', 'reactor', 'hammer', 'hawkeye', 'hulk', 'panther', 'widow', 'strange', 'scarlet', 'vision'] },
  { title: 'Guardiani della Galassia', ids: ['starlord', 'gamora', 'drax', 'rocket', 'groot', 'mantis', 'nebula'] },
  { title: 'X-Men', ids: ['wolverine', 'cyclops', 'phoenix', 'storm', 'gambit', 'nightcrawler', 'jubilee', 'deadpool'] },
  { title: 'Spiderverse', ids: ['spider', 'miles', 'venom'] },
  { title: 'The Defenders', ids: ['daredevil', 'punisher', 'jessica', 'lukecage', 'ironfist'] },
  { title: 'Fantastici 4', ids: ['fantastic', 'invisible', 'torch', 'thing'] },
  { title: 'Villain', ids: ['thanos', 'loki', 'doom', 'magneto', 'ultron', 'goblin', 'docock'] },
  { title: 'Simboli', ids: ['shield-agency', 'hydra', 'infinity'] },
  // Visibile solo all'account ufficiale di MARVEList (il backend rifiuta la scelta agli altri)
  { title: 'Esclusivo', ids: ['watcher'], onlyFor: 'marvelist.app@gmail.com' },
];
