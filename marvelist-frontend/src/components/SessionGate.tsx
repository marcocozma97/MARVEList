import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import IronRunner from './IronRunner';
import { authService } from '../services/authService';
import { loginSuccess, logoutSuccess } from '../store/authSlice';
import { TOKEN_KEY, markSessionExpired, readToken } from '../utils/session';

type GateState = 'play' | 'renewing' | 'ready' | 'failed';

// Token scaduto: invece delle pagine vuote compare il minigioco di Iron Man.
// Prendendo la moneta degli Avengers la sessione si rinnova (nuovo token da 24 ore) senza rifare il login.
const SessionGate = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState<GateState>('play');

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, []);

  const renew = async () => {
    const expired = readToken();
    if (!expired) { setState('failed'); return; }
    setState('renewing');
    try {
      const { token } = await authService.refresh(expired);
      localStorage.setItem(TOKEN_KEY, token);
      setState('ready');
    } catch {
      setState('failed');
    }
  };

  // Ricaricando la Timeline tutte le pagine ripartono con il token nuovo
  const goToApp = () => {
    const token = readToken();
    if (token) dispatch(loginSuccess(token));
    window.location.assign('/timeline');
  };

  const loginAgain = () => {
    authService.logout();
    markSessionExpired();
    dispatch(logoutSuccess());
    window.location.assign('/login');
  };

  return (
    <div className="session-gate" role="dialog" aria-modal="true" aria-labelledby="session-gate-title">
      <div className="session-gate-card">
        <span className="session-gate-kicker">Sessione scaduta</span>
        <h2 id="session-gate-title">Le credenziali Stark vanno riattivate</h2>
        <p className="session-gate-text">
          {state === 'ready'
            ? 'Moneta recuperata: accesso riattivato per altre 24 ore.'
            : state === 'failed'
              ? 'Non è stato possibile riattivare la sessione: è scaduta da troppo tempo. Accedi di nuovo.'
              : 'Aiuta Iron Man a prendere la moneta degli Avengers per riattivare il tuo accesso.'}
        </p>

        <IronRunner onCoin={renew} />

        <div className="session-gate-actions">
          {state === 'ready' && <button type="button" className="btn-marvel session-gate-go" onClick={goToApp} autoFocus>Vai all'app</button>}
          {state === 'renewing' && <span className="session-gate-wait">Riattivazione in corso…</span>}
          {state === 'failed'
            ? <button type="button" className="btn-marvel" onClick={loginAgain}>Accedi di nuovo</button>
            : <button type="button" className="session-gate-link" onClick={loginAgain}>Preferisco accedere con email e password</button>}
        </div>
      </div>
    </div>
  );
};

export default SessionGate;
