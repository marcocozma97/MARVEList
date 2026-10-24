import type { ReactNode } from 'react';

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
];
