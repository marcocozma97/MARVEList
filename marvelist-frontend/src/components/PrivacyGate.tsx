import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { logoutSuccess, setProfile } from '../store/authSlice';
import { errorMessage } from '../utils/marathon';
import { PRIVACY_UPDATED } from '../utils/privacy';

// Dopo l'accesso, chi non ha ancora accettato la versione attuale dell'informativa deve accettarla per continuare
const PrivacyGate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const accept = async () => {
    setError('');
    setSaving(true);
    try {
      dispatch(setProfile(await userService.acceptPrivacy()));
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a salvare. Riprova.'));
      setSaving(false);
    }
  };

  const logout = () => {
    dispatch(logoutSuccess());
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="privacy-gate" role="dialog" aria-modal="true" aria-labelledby="privacy-gate-title">
      <div className="privacy-gate-card">
        <h2 id="privacy-gate-title" className="privacy-gate-title">Informativa sulla privacy</h2>
        <p className="privacy-gate-text">
          Prima di continuare leggi e accetta l'informativa sulla privacy di MARVEList (aggiornata al {PRIVACY_UPDATED}).
        </p>
        <ul className="privacy-gate-list">
          <li>Usiamo i tuoi dati solo per far funzionare l'app: account, progressi, maratone e Community.</li>
          <li>Niente pubblicità e niente profilazione: i tuoi dati non vengono venduti a nessuno.</li>
          <li>Puoi scaricare i tuoi dati o eliminare l'account quando vuoi da <strong>Modifica profilo</strong>.</li>
        </ul>
        <Link to="/privacy" className="privacy-gate-link">Leggi l'informativa completa</Link>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="privacy-gate-actions">
          <button type="button" className="btn-marvel" onClick={accept} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Accetto'}
          </button>
          <button type="button" className="btn-ghost" onClick={logout} disabled={saving}>Esci</button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyGate;
