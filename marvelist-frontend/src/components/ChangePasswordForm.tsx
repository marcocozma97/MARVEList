import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { userService } from '../services/userService';
import { tokenRenewed } from '../store/authSlice';
import { TOKEN_KEY } from '../utils/session';
import { errorMessage } from '../utils/marathon';
import { isValidPassword, PASSWORD_RULE } from '../utils/validation';

// Cambio password da "Modifica profilo": serve quella attuale, le altre sessioni aperte vengono chiuse
const ChangePasswordForm = () => {
  const dispatch = useDispatch();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const nextError = submitted && !isValidPassword(next) ? PASSWORD_RULE : '';
  const confirmError = submitted && confirm !== next ? 'Le due password non coincidono' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitted(true);
    if (!current || !isValidPassword(next) || confirm !== next) return;
    setSaving(true);
    try {
      const token = await userService.changePassword(current, next);
      try { localStorage.setItem(TOKEN_KEY, token); } catch { /* memoria non disponibile */ }
      dispatch(tokenRenewed(token));
      setCurrent(''); setNext(''); setConfirm(''); setSubmitted(false);
      setSuccess('Password aggiornata. Se eri collegato da altri dispositivi, lì dovrai accedere di nuovo.');
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a cambiare la password. Riprova.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form password-form" noValidate>
      {success && <div className="form-success" role="status">{success}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <label className="field">
        <span className="field-label">Password attuale</span>
        <input type="password" className="field-input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label className="field">
        <span className="field-label">Nuova password</span>
        <input type="password" className={`field-input ${nextError ? 'is-invalid' : ''}`} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" aria-invalid={!!nextError} required />
        {nextError && <span className="field-error">{nextError}</span>}
      </label>
      <label className="field">
        <span className="field-label">Ripeti la nuova password</span>
        <input type="password" className={`field-input ${confirmError ? 'is-invalid' : ''}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" aria-invalid={!!confirmError} required />
        {confirmError && <span className="field-error">{confirmError}</span>}
      </label>
      <button type="submit" className="btn-marvel" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva la nuova password'}</button>
    </form>
  );
};

export default ChangePasswordForm;
