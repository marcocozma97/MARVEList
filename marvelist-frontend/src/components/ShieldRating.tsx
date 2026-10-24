import { useState } from 'react';

interface ShieldRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

// 10 scudi di Capitan America in CSS: metà sinistra = mezzo voto, metà destra = voto pieno.
// Ricliccando il voto già dato lo si toglie.
const ShieldRating = ({ value, onChange, disabled = false }: ShieldRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  const pick = (v: number) => {
    if (disabled) return;
    onChange(v === value ? null : v);
  };

  return (
    <div className="shield-rating">
      <div className="shield-rating-row" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 10 }, (_, i) => {
          const full = i + 1;
          const fill = shown >= full ? 'full' : shown >= full - 0.5 ? 'half' : 'empty';
          return (
            <span key={full} className={`shield shield-${fill}`}>
              <span className="shield-face shield-base" />
              <span className="shield-face shield-fill" />
              {[full - 0.5, full].map(v => (
                <button
                  key={v}
                  type="button"
                  className={`shield-hit ${v === full ? 'right' : 'left'}`}
                  aria-label={`Vota ${String(v).replace('.', ',')} su 10`}
                  aria-pressed={value === v}
                  disabled={disabled}
                  onMouseEnter={() => setHover(v)}
                  onFocus={() => setHover(v)}
                  onBlur={() => setHover(null)}
                  onClick={() => pick(v)}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className="shield-rating-value">
        {shown ? <><strong>{String(shown).replace('.', ',')}</strong>/10</> : 'Nessun voto'}
      </span>
    </div>
  );
};

export default ShieldRating;
