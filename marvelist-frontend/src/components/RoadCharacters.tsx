// Ritratto di Spider-Man in SVG, usato come "foto" in mezzitoni nell'intro del Daily Bugle.
// (Le card delle Road To usano le immagini PNG dei personaggi.)

export const SpiderArt = () => (
  <svg viewBox="0 0 200 240" className="road-art" aria-hidden="true">
    <defs>
      <radialGradient id="sp-red" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#f87171" /><stop offset="0.55" stopColor="#dc2626" /><stop offset="1" stopColor="#7f1d1d" />
      </radialGradient>
      <linearGradient id="sp-blue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#1e3a8a" />
      </linearGradient>
      <clipPath id="sp-head"><ellipse cx="100" cy="110" rx="50" ry="62" /></clipPath>
    </defs>
    <g className="layer-back">
      <path d="M8 240 Q22 176 100 168 Q178 176 192 240 Z" fill="url(#sp-blue)" />
      <path d="M62 176 Q100 166 138 176 L120 240 L80 240 Z" fill="url(#sp-red)" />
      <path d="M100 196 l-8 -8 m8 8 l8 -8 m-8 8 v16 m0 -4 l-10 10 m10 -10 l10 10" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g className="layer-mid">
      <ellipse cx="100" cy="110" rx="50" ry="62" fill="url(#sp-red)" />
      <g clipPath="url(#sp-head)" stroke="#3f0a0a" strokeWidth="1.3" fill="none" opacity="0.55">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <path key={i} d={`M100 108 L${100 + Math.cos(a) * 90} ${108 + Math.sin(a) * 90}`} />;
        })}
        {[18, 34, 50, 66].map(r => <ellipse key={r} cx="100" cy="108" rx={r} ry={r * 1.15} />)}
      </g>
    </g>
    <g className="layer-front">
      <path d="M60 96 Q72 72 96 98 Q92 120 70 116 Q56 110 60 96 Z" fill="#f8fafc" stroke="#0a0a0a" strokeWidth="5" strokeLinejoin="round" />
      <path d="M140 96 Q128 72 104 98 Q108 120 130 116 Q144 110 140 96 Z" fill="#f8fafc" stroke="#0a0a0a" strokeWidth="5" strokeLinejoin="round" />
    </g>
  </svg>
);
