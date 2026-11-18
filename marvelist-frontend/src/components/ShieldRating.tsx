import { useRef, useState } from 'react';

interface ShieldRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

const DRAG_THRESHOLD = 6;

// 10 scudi di Capitan America in CSS, sempre su una sola fila: metà sinistra = mezzo voto, metà destra = voto pieno.
// Col mouse: ricliccando il voto già dato lo si toglie.
// Col dito: scorrendo sugli scudi il voto segue il dito; un tocco sullo scudo del voto attuale lo toglie.
const ShieldRating = ({ value, onChange, disabled = false }: ShieldRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ id: number; startX: number; moved: boolean; value: number } | null>(null);
  const ignoreClick = useRef(false);
  const shown = hover ?? value ?? 0;

  const pick = (v: number) => {
    if (disabled) return;
    if (ignoreClick.current) { ignoreClick.current = false; return; }
    onChange(v === value ? null : v);
  };

  // Voto sotto il dito: mezzo scudo a sinistra, scudo pieno a destra; oltre i bordi minimo 0,5 e massimo 10
  const valueAt = (x: number) => {
    const shields = rowRef.current?.querySelectorAll<HTMLElement>('.shield');
    if (!shields?.length) return 0.5;
    let result = 0.5;
    shields.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (x >= r.left) result = x < r.left + r.width / 2 ? i + 0.5 : i + 1;
    });
    return result;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'mouse') return;
    ignoreClick.current = true;
    touch.current = { id: e.pointerId, startX: e.clientX, moved: false, value: valueAt(e.clientX) };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const t = touch.current;
    if (!t || t.id !== e.pointerId) return;
    if (!t.moved && Math.abs(e.clientX - t.startX) < DRAG_THRESHOLD) return;
    if (!t.moved) {
      t.moved = true;
      setDragging(true);
      try { rowRef.current?.setPointerCapture(e.pointerId); } catch { /* il dito resta comunque tracciato sulla fila */ }
    }
    const v = valueAt(e.clientX);
    if (v !== t.value) navigator.vibrate?.(6);
    t.value = v;
    setHover(v);
  };

  const finish = (e: React.PointerEvent, commit: boolean) => {
    const t = touch.current;
    if (!t || t.id !== e.pointerId) return;
    touch.current = null;
    setDragging(false);
    setHover(null);
    // Il click "emulato" dopo il tocco va ignorato, ma solo per un attimo
    window.setTimeout(() => { ignoreClick.current = false; }, 500);
    if (!commit) return;
    if (t.moved) {
      if (t.value !== value) onChange(t.value);
      return;
    }
    // Tocco singolo: sullo scudo che contiene il voto attuale lo toglie, altrove vota
    const tapped = valueAt(e.clientX);
    onChange(value != null && Math.ceil(tapped) === Math.ceil(value) ? null : tapped);
  };

  return (
    <div className="shield-rating">
      <div
        ref={rowRef}
        className={`shield-rating-row ${dragging ? 'is-dragging' : ''}`}
        onMouseLeave={() => setHover(null)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={e => finish(e, true)}
        onPointerCancel={e => finish(e, false)}
      >
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
                  onMouseEnter={() => { if (!ignoreClick.current) setHover(v); }}
                  onFocus={() => { if (!ignoreClick.current) setHover(v); }}
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
