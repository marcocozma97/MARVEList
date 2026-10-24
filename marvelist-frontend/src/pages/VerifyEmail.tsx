import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Inizializzazione protocollo di verifica...' : 'Nessun token di sicurezza rilevato. Accesso negato.');

  // Il token va confermato una volta sola
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token || hasFetched.current) return;
    hasFetched.current = true;

    authService.verifyEmail(token)
      .then(responseMsg => {
        setStatus('success');
        setMessage(responseMsg || 'Identità confermata.');
      })
      .catch((error: unknown) => {
        console.error('Errore di verifica:', error);
        const data = axios.isAxiosError(error) ? error.response?.data : null;
        const backendMsg = typeof data === 'string' ? data : data?.message;
        setStatus('error');
        setMessage(backendMsg || 'Link di verifica scaduto o compromesso.');
      });
  }, [token]);

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center" style={{ backgroundImage: 'radial-gradient(circle at center, #151515 0%, #000 100%)' }}>
      <div className="marvel-card p-5 text-center shadow-lg" style={{ maxWidth: '500px', width: '90%' }}>
        <h2 className="fw-bold mb-4" style={{ color: '#e23636', letterSpacing: '2px' }}>
          MARVEL<span className="text-white">ist</span>
        </h2>
        
        {status === 'loading' && (
          <div>
            <div className="spinner-border text-info mb-3" role="status"></div>
            <p className="text-light fw-bold">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mb-3 text-success" style={{ fontSize: '3rem' }}>✓</div>
            <h4 className="text-white mb-3">Protocollo Accettato</h4>
            <p className="text-secondary mb-4">{message}</p>
            <Link to="/login" className="btn btn-outline-info fw-bold rounded-pill px-4">
              Procedi al Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mb-3 text-danger" style={{ fontSize: '3rem' }}>⚠</div>
            <h4 className="text-white mb-3">Anomalia Rilevata</h4>
            <p className="text-secondary mb-4">{message}</p>
            <Link to="/register" className="btn btn-outline-danger fw-bold rounded-pill px-4">
              Torna alla Registrazione
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;