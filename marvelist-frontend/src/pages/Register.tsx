import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { errorMessage } from '../utils/marathon';
import { isValidEmail, isValidPassword, PASSWORD_RULE } from '../utils/validation';
import Brand from '../components/Brand';

const Register = () => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false); // dopo il primo invio i campi mostrano i propri errori
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState(''); // registrazione riuscita: mail di conferma inviata

  const emailError = submitted && !isValidEmail(email) ? "Inserisci un'email valida (es. nome@dominio.it)" : '';
  const passwordError = submitted && !isValidPassword(password) ? PASSWORD_RULE : '';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);
    if (!isValidEmail(email) || !isValidPassword(password)) return;

    setLoading(true);
    try {
      // Nessun accesso automatico: l'account si attiva dal link nella mail
      const data = await authService.register({ name: firstname, surname: lastname, email: email.trim(), password });
      setSentMessage(data.message);
    } catch (err) {
      setError(errorMessage(err, 'Errore durante la registrazione. Controlla i dati.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (sentMessage) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Link to="/" className="auth-logo" aria-label="MARVEList, torna alla home"><Brand size="md" /></Link>
          <h1 className="auth-title">Controlla la tua email</h1>
          <div className="form-success" role="status">{sentMessage}</div>
          <p className="auth-note">Dopo aver confermato potrai accedere. Non trovi la mail? Guarda anche nello spam.</p>
          <Link to="/login" className="btn-marvel">Vai al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" aria-label="MARVEList, torna alla home"><Brand size="md" /></Link>
        <h1 className="auth-title">Registrati</h1>

        {error && <div className="form-error" role="alert">{error}</div>}

        <form onSubmit={handleRegister} className="auth-form" noValidate>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Nome</span>
              <input type="text" className="field-input" value={firstname} onChange={(e) => setFirstname(e.target.value)} autoComplete="given-name" required />
            </label>
            <label className="field">
              <span className="field-label">Cognome</span>
              <input type="text" className="field-input" value={lastname} onChange={(e) => setLastname(e.target.value)} autoComplete="family-name" required />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" className={`field-input ${emailError ? 'is-invalid' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!emailError} required />
            {emailError && <span className="field-error">{emailError}</span>}
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input type="password" className={`field-input ${passwordError ? 'is-invalid' : ''}`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" aria-invalid={!!passwordError} required />
            <span className={passwordError ? 'field-error' : 'field-hint'}>{PASSWORD_RULE}</span>
          </label>
          <button type="submit" className="btn-marvel" disabled={loading}>{loading ? 'Invio in corso...' : 'Crea account'}</button>
        </form>
        <p className="auth-switch">Hai già un account? <Link to="/login">Accedi</Link></p>
      </div>
    </div>
  );
};

export default Register;
