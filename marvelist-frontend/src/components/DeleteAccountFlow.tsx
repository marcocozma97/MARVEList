import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { accountService, downloadBackup } from '../services/accountService';
import { authService } from '../services/authService';
import { logoutSuccess } from '../store/authSlice';
import { errorMessage } from '../utils/marathon';

const CONFIRM_WORD = 'ELIMINA';

// Eliminazione dell'account in tre passaggi: cosa si perde, conferme esplicite, password + parola di conferma
const DeleteAccountFlow = ({ nickname, onCancel }: { nickname: string; onCancel: () => void }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lostData, setLostData] = useState(false);
  const [lostNickname, setLostNickname] = useState(false);
  const [password, setPassword] = useState('');
  const [word, setWord] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const download = async () => {
    setError('');
    try {
      await downloadBackup(nickname);
      setDownloaded(true);
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a preparare il file. Riprova.'));
    }
  };

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (word.trim().toUpperCase() !== CONFIRM_WORD) {
      setError(`Scrivi ${CONFIRM_WORD} per confermare.`);
      return;
    }
    setBusy(true);
    try {
      await accountService.deleteAccount(password);
      authService.logout();
      dispatch(logoutSuccess());
      navigate('/register', { replace: true, state: { accountDeleted: true } });
    } catch (err) {
      setError(errorMessage(err, "Non siamo riusciti a eliminare l'account. Riprova."));
      setBusy(false);
    }
  };

  return (
    <div className="delete-flow">
      <p className="delete-step-label">Passo {step} di 3</p>
      <div className="delete-steps" aria-hidden="true">
        {[1, 2, 3].map(n => <span key={n} className={n <= step ? 'is-done' : ''} />)}
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      {step === 1 && (
        <>
          <h3 className="delete-title">Cosa succede se elimini l'account</h3>
          <ul className="delete-list">
            <li><strong>Tutti i tuoi progressi vengono eliminati per sempre:</strong> visti, episodi, minuti, voti, preferiti, "guarda dopo" e grado.</li>
            <li>Vengono eliminate anche le tue <strong>maratone</strong>, gli utenti che segui e chi ti segue, le notifiche e i tuoi <strong>commenti</strong>, insieme alle risposte che hanno ricevuto.</li>
            <li className="delete-list-strong"><strong>Tutti i nickname che hai usato tornano liberi</strong> e potranno essere scelti da altri utenti.</li>
            <li>Non si può tornare indietro: nemmeno noi potremo recuperare i tuoi dati.</li>
          </ul>
          <div className="delete-tip">
            <p className="delete-tip-text"><strong>Consiglio:</strong> prima scarica i tuoi dati. Con il file potrai ricaricare tutto su un nuovo profilo.</p>
            <button type="button" className="btn-ghost" onClick={download}>{downloaded ? '✓ File scaricato' : 'Scarica i miei dati (JSON)'}</button>
          </div>
          <div className="delete-actions">
            <button type="button" className="btn-ghost" onClick={onCancel}>Annulla</button>
            <button type="button" className="btn-danger" onClick={() => setStep(2)}>Continua</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3 className="delete-title">Sei sicuro?</h3>
          <label className="delete-check">
            <input type="checkbox" checked={lostData} onChange={(e) => setLostData(e.target.checked)} />
            <span>Ho capito che <strong>tutti i miei progressi</strong>, voti, maratone e commenti verranno eliminati e non potranno essere recuperati.</span>
          </label>
          <label className="delete-check">
            <input type="checkbox" checked={lostNickname} onChange={(e) => setLostNickname(e.target.checked)} />
            <span>Ho capito che <strong>tutti i nickname che ho usato</strong> (anche "{nickname}") torneranno liberi e <strong>potranno essere usati da altri</strong>.</span>
          </label>
          <div className="delete-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Indietro</button>
            <button type="button" className="btn-danger" onClick={() => setStep(3)} disabled={!lostData || !lostNickname}>Continua</button>
          </div>
        </>
      )}

      {step === 3 && (
        <form onSubmit={confirmDelete} className="auth-form" noValidate>
          <h3 className="delete-title">Conferma finale</h3>
          <label className="field">
            <span className="field-label">La tua password</span>
            <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <label className="field">
            <span className="field-label">Scrivi {CONFIRM_WORD} per confermare</span>
            <input className="field-input" value={word} onChange={(e) => setWord(e.target.value)} autoCapitalize="characters" autoCorrect="off" spellCheck={false} required />
          </label>
          <div className="delete-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep(2)} disabled={busy}>Indietro</button>
            <button type="submit" className="btn-danger" disabled={busy || !password || word.trim().toUpperCase() !== CONFIRM_WORD}>
              {busy ? 'Eliminazione...' : 'Elimina definitivamente'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DeleteAccountFlow;
