import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { errorMessage } from '../utils/marathon';
import { isValidEmail } from '../utils/validation';
import Brand from '../components/Brand';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError("Inserisci un'email valida (es. nome@dominio.it)");
      return;
    }
    setLoading(true);
    try {
      setSentMessage(await authService.forgotPassword(email.trim()));
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a inviare la mail. Riprova tra qualche minuto.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" aria-label="MARVEList, torna alla home"><Brand size="md" /></Link>
        <h1 className="auth-title">Password dimenticata</h1>

        {sentMessage ? (
          <>
            <div className="form-success" role="status">{sentMessage}</div>
            <p className="auth-note">Il link vale 60 minuti e si può usare una sola volta.</p>
            <Link to="/login" className="btn-marvel">Torna al login</Link>
          </>
        ) : (
          <>
            <p className="auth-note">Scrivi l'email con cui ti sei registrato: ti mandiamo un link per scegliere una nuova password.</p>
            {error && <div className="form-error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <label className="field">
                <span className="field-label">Email</span>
                <input
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
              </label>
              <button type="submit" className="btn-marvel" disabled={loading}>{loading ? 'Invio in corso...' : 'Invia il link'}</button>
            </form>
            <p className="auth-switch">Ti è tornata in mente? <Link to="/login">Accedi</Link></p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
