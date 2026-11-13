import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { markIntroPending } from '../utils/intro';
import Brand from '../components/Brand';
import { errorMessage } from '../utils/marathon';
import { clearSessionExpired, wasSessionExpired } from '../utils/session';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [expired] = useState(wasSessionExpired);
  useEffect(clearSessionExpired, []);
  const navigate = useNavigate(); // Serve per reindirizzare l'utente dopo il login
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await authService.login({ email, password });

      localStorage.setItem('marvelist_token', data.token);

      dispatch(loginSuccess(data.token));

      // Dopo l'accesso si entra nella Timeline con l'intro delle Gemme
      markIntroPending();
      navigate('/timeline');

    } catch (err) {
      // Il backend distingue credenziali errate e account non ancora confermato
      setError(errorMessage(err, 'Credenziali non valide. Riprova.'));
      console.error(err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" aria-label="MARVEList, torna alla home"><Brand size="md" /></Link>
        <h1 className="auth-title">Accedi</h1>

        {expired && !error && <div className="form-success" role="status">La sessione è scaduta: accedi di nuovo per continuare.</div>}
        {error && <div className="form-error" role="alert">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn-marvel">Login</button>
        </form>
        <p className="auth-switch">Non hai un account? <Link to="/register">Registrati</Link></p>
      </div>
    </div>
  );
};

export default Login;
