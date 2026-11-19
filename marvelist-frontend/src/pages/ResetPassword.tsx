import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { errorMessage } from '../utils/marathon';
import { isValidPassword, PASSWORD_RULE } from '../utils/validation';
import Brand from '../components/Brand';

// Pagina aperta dal link nella mail di recupero: /reset-password?token=...
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [doneMessage, setDoneMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordError = submitted && !isValidPassword(password) ? PASSWORD_RULE : '';
  const confirmError = submitted && confirm !== password ? 'Le due password non coincidono' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);
    if (!token || !isValidPassword(password) || confirm !== password) return;
    setLoading(true);
    try {
      setDoneMessage(await authService.resetPassword(token, password));
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a cambiare la password. Riprova.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" aria-label="MARVEList, torna alla home"><Brand size="md" /></Link>
        <h1 className="auth-title">Nuova password</h1>

        {!token ? (
          <>
            <div className="form-error" role="alert">Link non valido: richiedine uno nuovo.</div>
            <Link to="/forgot-password" className="btn-marvel">Password dimenticata?</Link>
          </>
        ) : doneMessage ? (
          <>
            <div className="form-success" role="status">{doneMessage}</div>
            <Link to="/login" className="btn-marvel">Vai al login</Link>
          </>
        ) : (
          <>
            {error && <div className="form-error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <label className="field">
                <span className="field-label">Nuova password</span>
                <input type="password" className={`field-input ${passwordError ? 'is-invalid' : ''}`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" aria-invalid={!!passwordError} required />
                {passwordError && <span className="field-error">{passwordError}</span>}
              </label>
              <label className="field">
                <span className="field-label">Ripeti la nuova password</span>
                <input type="password" className={`field-input ${confirmError ? 'is-invalid' : ''}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" aria-invalid={!!confirmError} required />
                {confirmError && <span className="field-error">{confirmError}</span>}
              </label>
              <button type="submit" className="btn-marvel" disabled={loading}>{loading ? 'Salvataggio...' : 'Salva la nuova password'}</button>
            </form>
            {error && <p className="auth-switch"><Link to="/forgot-password">Richiedi un nuovo link</Link></p>}
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
