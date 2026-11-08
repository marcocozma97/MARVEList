import { useEffect, useRef, useState } from 'react';
import { gifService, type GifResult } from '../services/gifService';

interface GifPickerProps {
  onPick: (gif: GifResult) => void;
  onClose: () => void;
}

const GifPicker = ({ onPick, onClose }: GifPickerProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { input.current?.focus(); }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      gifService.search(query)
        .then(gifs => { if (active) { setResults(gifs); setError(false); } })
        .catch(() => { if (active) setError(true); })
        .finally(() => { if (active) setIsLoading(false); });
    }, query ? 350 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    const onDown = (e: PointerEvent) => { if (panel.current && !panel.current.contains(e.target as Node)) onClose(); };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('keydown', onKey, true); window.removeEventListener('pointerdown', onDown); };
  }, [onClose]);

  return (
    <div className="gif-picker" ref={panel} role="dialog" aria-label="Scegli una GIF">
      <div className="gif-picker-head">
        <input
          ref={input}
          type="search"
          className="field-input gif-search"
          placeholder="Cerca una GIF…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsLoading(true); }}
          aria-label="Cerca una GIF"
        />
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Chiudi le GIF">×</button>
      </div>

      <div className="gif-grid" aria-busy={isLoading}>
        {error ? (
          <p className="gif-empty">Le GIF non sono disponibili: riprova tra poco.</p>
        ) : isLoading && !results.length ? (
          Array.from({ length: 9 }, (_, i) => <span key={i} className="gif-skeleton" />)
        ) : results.length ? (
          results.map(gif => (
            <button key={gif.id} type="button" className="gif-option" onClick={() => onPick(gif)} title={gif.title || 'GIF'}>
              <img src={gif.previewUrl} alt={gif.title || 'GIF'} loading="lazy" />
            </button>
          ))
        ) : (
          <p className="gif-empty">Nessuna GIF trovata per “{query}”.</p>
        )}
      </div>

      <p className="gif-attribution">Powered by <strong>KLIPY</strong></p>
    </div>
  );
};

export default GifPicker;
