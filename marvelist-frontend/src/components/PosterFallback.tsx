import { getPosterSymbol, getTitleInitials } from '../utils/posterSymbol';

interface PosterFallbackProps {
  title: string;
  className?: string;
  showTitle?: boolean; // nelle card il titolo c'è già sopra la sfumatura
}

// Locandina provvisoria in CSS: simbolo legato al titolo al centro, alone colorato e griglia "HUD"
const PosterFallback = ({ title, className = '', showTitle = false }: PosterFallbackProps) => {
  const symbol = getPosterSymbol(title);
  const text = symbol === 'four' ? '4' : symbol === 'avengers' ? 'A' : symbol === 'initials' ? getTitleInitials(title) : null;

  return (
    <div className={`poster-fallback pf-${symbol} ${className}`} role="img" aria-label={`Locandina non disponibile: ${title}`}>
      <span className="pf-grid" aria-hidden="true" />
      <span className="pf-symbol" aria-hidden="true">
        {text && <span className="pf-text">{text}</span>}
      </span>
      {showTitle && <span className="pf-title">{title}</span>}
      <span className="pf-badge">Locandina provvisoria</span>
    </div>
  );
};

export default PosterFallback;
