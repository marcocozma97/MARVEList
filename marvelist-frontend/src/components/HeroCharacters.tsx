import { useEffect, useMemo, useState } from 'react';
import { CAPTAIN_AMERICA, IRON_MAN, IRON_MAN_FLAMES, SHIELD, WOLVERINE, spriteShadow, type SpriteDef } from '../utils/pixelArt';
import type { VisionOrder } from '../utils/ordering';

const PX = 5;

const PixelSprite = ({ sprite, className = '' }: { sprite: SpriteDef; className?: string }) => {
  const shadow = useMemo(() => spriteShadow(sprite, PX), [sprite]);
  const width = Math.max(...sprite.rows.map(r => r.length)) * PX;
  return (
    <span className={`pixel-sprite ${className}`} style={{ width, height: sprite.rows.length * PX }} aria-hidden="true">
      <span className="pixel-sprite-dots" style={{ width: PX, height: PX, boxShadow: shadow }} />
    </span>
  );
};

const LEVELS: VisionOrder[] = ['MCU', 'FAN', 'GOD'];

// Personaggi a 8 bit al centro della Timeline:
// MCU -> Iron Man che galleggia, Marvel Fan -> Wolverine con gli artigli,
// Marvel GOD -> Wolverine corre via, arriva lo scudo e Capitan America lo afferra e lo lancia.
const HeroCharacters = ({ level }: { level: VisionOrder }) => {
  const [shown, setShown] = useState(level);
  const [leaving, setLeaving] = useState<{ who: VisionOrder; direction: 'left' | 'right' } | null>(null);

  // Cambio livello: il personaggio di prima esce (Wolverine corre nella direzione dello slider)
  if (level !== shown && !leaving) {
    setLeaving({ who: shown, direction: LEVELS.indexOf(level) > LEVELS.indexOf(shown) ? 'right' : 'left' });
    setShown(level);
  }

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), 650);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  const render = (who: VisionOrder, phase: 'enter' | 'exit', direction?: 'left' | 'right') => {
    const cls = `hero-char hero-${who.toLowerCase()} is-${phase} ${direction ? `to-${direction}` : ''}`;
    if (who === 'MCU') {
      return (
        <span key={`mcu-${phase}`} className={cls}>
          <span className="hero-float">
            <PixelSprite sprite={IRON_MAN} />
            <PixelSprite sprite={IRON_MAN_FLAMES} className="hero-flames" />
          </span>
        </span>
      );
    }
    if (who === 'FAN') {
      return (
        <span key={`fan-${phase}`} className={cls}>
          <span className="hero-run">
            <PixelSprite sprite={WOLVERINE} />
            {/* Tre artigli per pugno, escono e rientrano */}
            <span className="claws claws-left"><i /><i /><i /></span>
            <span className="claws claws-right"><i /><i /><i /></span>
          </span>
        </span>
      );
    }
    return (
      <span key={`god-${phase}`} className={cls}>
        <span className="hero-cap"><PixelSprite sprite={CAPTAIN_AMERICA} /></span>
        <span className="hero-shield"><PixelSprite sprite={SHIELD} /></span>
      </span>
    );
  };

  return (
    <div className="hero-stage" aria-hidden="true">
      {/* In sequenza: prima esce il vecchio personaggio, poi entra il nuovo */}
      {leaving ? render(leaving.who, 'exit', leaving.direction) : render(shown, 'enter')}
    </div>
  );
};

export default HeroCharacters;
