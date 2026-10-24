import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Pulsante flottante "AI": porta alla pagina di J.A.I.R.V.I.S.
const JairvisChat = () => {
  const [hidden, setHidden] = useState(false);

  // Si nasconde mentre si scorre verso il basso (così non copre card e controlli)
  // e ricompare scorrendo verso l'alto o arrivati in fondo alla pagina
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
      setHidden(y > lastY && y > 120 && !atBottom);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Link
      to="/jairvis"
      className={`jairvis-fab ${hidden ? 'is-hidden' : ''}`}
      aria-label="Apri J.A.I.R.V.I.S."
      title="Chiedi a J.A.I.R.V.I.S."
    >
      AI
    </Link>
  );
};

export default JairvisChat;
