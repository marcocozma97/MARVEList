import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { userService, type UserProfile } from '../services/userService';
import { accountService, downloadBackup, type ImportResult } from '../services/accountService';
import { setProfile } from '../store/authSlice';
import { useNicknameCheck } from '../hooks/useNicknameCheck';
import { errorMessage } from '../utils/marathon';
import ChangePasswordForm from './ChangePasswordForm';
import DeleteAccountFlow from './DeleteAccountFlow';

type Tab = 'nickname' | 'password' | 'data' | 'delete';

const TABS: { id: Tab; label: string }[] = [
  { id: 'nickname', label: 'Nickname' },
  { id: 'password', label: 'Password' },
  { id: 'data', label: 'I tuoi dati' },
  { id: 'delete', label: 'Elimina account' },
];

const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

// Nickname (una volta ogni 30 giorni)
const NicknameTab = ({ profile }: { profile: UserProfile }) => {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(profile.nickname);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const status = useNicknameCheck(draft, profile.nickname);

  const lockedUntil = profile.nicknameChangeableFrom
    ? new Date(profile.nicknameChangeableFrom).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (lockedUntil) {
    return (
      <div className="edit-profile-note">
        <p>Il tuo nickname è <strong>{profile.nickname}</strong>.</p>
        <p>Il nickname si può cambiare una volta ogni 30 giorni: potrai modificarlo di nuovo dal <strong>{lockedUntil}</strong>.</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const nickname = draft.trim();
    if (nickname.length < 2 || nickname.length > 30) { setError('Il nickname deve avere tra 2 e 30 caratteri.'); return; }
    if (status === 'taken') { setError('Questo nickname è già usato da un altro utente.'); return; }
    if (nickname === profile.nickname) { setError('È già il tuo nickname.'); return; }
    if (!confirm) { setConfirm(true); return; }
    setSaving(true);
    try {
      dispatch(setProfile(await userService.updateMe({ nickname })));
      setSuccess(`Fatto! Ora sei ${nickname}.`);
      setConfirm(false);
    } catch (err) {
      setError(errorMessage(err, 'Salvataggio non riuscito. Riprova.'));
      setConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {success && <div className="form-success" role="status">{success}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <label className="field">
        <span className="field-label">Nickname</span>
        <input
          className="field-input"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setConfirm(false); setSuccess(''); }}
          maxLength={30}
          autoComplete="nickname"
        />
        {status === 'ok' && <span className="nickname-check is-ok">✓ Disponibile</span>}
        {status === 'taken' && <span className="nickname-check is-taken">✗ Già usato da un altro utente</span>}
      </label>
      {confirm && (
        <p className="nickname-warning" role="alert">
          <span aria-hidden="true">⚠</span>
          <span>Dopo il cambio potrai modificare di nuovo il nickname <strong>solo tra 30 giorni</strong>. Il vecchio nickname resta tuo finché hai l'account.</span>
        </p>
      )}
      <button type="submit" className="btn-marvel" disabled={saving || status === 'taken' || status === 'checking'}>
        {saving ? 'Salvataggio...' : confirm ? 'Sì, cambia nickname' : 'Salva nickname'}
      </button>
    </form>
  );
};

// Salvataggio dei dati in JSON e caricamento di un vecchio salvataggio
const DataTab = ({ nickname, onDataChanged }: { nickname: string; onDataChanged: () => void }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [error, setError] = useState('');
  const [exported, setExported] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const exportData = async () => {
    setError('');
    setBusy('export');
    try {
      await downloadBackup(nickname);
      setExported(true);
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a preparare il file. Riprova.'));
    } finally {
      setBusy(null);
    }
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setResult(null);
    if (file.size > MAX_BACKUP_BYTES) { setError('Il file è troppo grande per essere un salvataggio di MARVEList.'); return; }
    let backup: unknown;
    try {
      backup = JSON.parse(await file.text());
    } catch {
      setError('Il file non è un JSON valido.');
      return;
    }
    setBusy('import');
    try {
      setResult(await accountService.importData(backup));
      onDataChanged();
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a caricare il file. Riprova.'));
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="data-tab">
      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="data-block">
        <h3 className="data-title">Scarica i tuoi dati</h3>
        <p className="data-text">Un file JSON con tutto quello che hai fatto su MARVEList: visti, episodi, voti, preferiti, "guarda dopo", maratone, utenti seguiti e commenti. Conservalo: ti servirà se un giorno vorrai ripartire da un nuovo profilo.</p>
        <button type="button" className="btn-marvel" onClick={exportData} disabled={busy !== null}>
          {busy === 'export' ? 'Preparazione...' : exported ? '✓ Scaricato · Scarica di nuovo' : 'Scarica i miei dati'}
        </button>
      </div>

      <div className="data-block">
        <h3 className="data-title">Carica un salvataggio</h3>
        <p className="data-text">Hai un nuovo profilo? Carica il file scaricato dal vecchio: i dati si aggiungono a quelli attuali senza cancellare niente (i voti del file prendono il posto di quelli attuali). Se non hai ancora scelto un nickname e quello vecchio è libero, ti viene restituito.</p>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={(e) => importFile(e.target.files?.[0])} />
        <button type="button" className="btn-ghost" onClick={() => fileInput.current?.click()} disabled={busy !== null}>
          {busy === 'import' ? 'Caricamento...' : 'Scegli il file JSON'}
        </button>
        {result && (
          <div className="form-success import-result" role="status">
            <strong>Dati caricati!</strong> {result.titles} {result.titles === 1 ? 'titolo' : 'titoli'}, {result.marathons} {result.marathons === 1 ? 'maratona' : 'maratone'}, {result.following} {result.following === 1 ? 'utente seguito' : 'utenti seguiti'}{result.nicknameRestored ? ', nickname ripristinato' : ''}.
            {result.notFound.length > 0 && (
              <details>
                <summary>{result.notFound.length} {result.notFound.length === 1 ? 'titolo non più presente' : 'titoli non più presenti'} nel catalogo</summary>
                <ul>{result.notFound.map(t => <li key={t}>{t}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// "Modifica profilo": nickname, password, dati in JSON ed eliminazione dell'account
const EditProfileModal = ({ profile, onClose, onDataChanged }: { profile: UserProfile; onClose: () => void; onDataChanged: () => void }) => {
  const [tab, setTab] = useState<Tab>('nickname');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return createPortal(
    <div className="people-backdrop" onClick={onClose}>
      <div className="people-modal edit-profile-modal" role="dialog" aria-modal="true" aria-label="Modifica profilo" onClick={(e) => e.stopPropagation()}>
        <div className="people-head">
          <h2 className="edit-profile-title">Modifica profilo</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Chiudi">×</button>
        </div>
        <div className="edit-profile-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`edit-profile-tab ${tab === t.id ? 'active' : ''} ${t.id === 'delete' ? 'is-danger' : ''}`}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>
        <div className="people-body edit-profile-body">
          {tab === 'nickname' && <NicknameTab profile={profile} />}
          {tab === 'password' && <ChangePasswordForm />}
          {tab === 'data' && <DataTab nickname={profile.nickname} onDataChanged={onDataChanged} />}
          {tab === 'delete' && (profile.official
            ? <div className="edit-profile-note"><p>L'account ufficiale di MARVEList non si può eliminare.</p></div>
            : <DeleteAccountFlow nickname={profile.nickname} onCancel={() => setTab('nickname')} />)}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditProfileModal;
