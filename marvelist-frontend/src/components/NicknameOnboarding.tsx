import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { setProfile } from '../store/authSlice';
import { userService } from '../services/userService';
import { errorMessage } from '../utils/marathon';
import Avatar from './Avatar';

const NicknameOnboarding = () => {
  const profile = useSelector((state: RootState) => state.auth.profile);
  const dispatch = useDispatch();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [confirming, setConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = nickname.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 30;

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError('Il nickname deve avere tra 2 e 30 caratteri.');
      return;
    }
    setError(null);
    setConfirming(true);
  };

  const confirm = async () => {
    setIsSaving(true);
    setError(null);
    try {
      dispatch(setProfile(await userService.updateMe({ nickname: trimmed })));
    } catch (e) {
      setError(errorMessage(e, 'Salvataggio non riuscito. Riprova.'));
      setConfirming(false);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="people-backdrop nickname-backdrop">
      <div className="people-modal nickname-modal" role="dialog" aria-modal="true" aria-labelledby="nickname-title">
        <Avatar avatarId={profile?.avatar} name={trimmed || '?'} size={72} />
        <h2 id="nickname-title" className="nickname-title">{confirming ? 'Confermi il nickname?' : 'Scegli il tuo nickname'}</h2>

        {confirming ? (
          <>
            <p className="nickname-preview">{trimmed}</p>
            <div className="nickname-warning" role="alert">
              <span aria-hidden="true">⚠</span>
              <span>Dopo la conferma potrai cambiare il nickname <strong>solo tra 30 giorni</strong>. Ti avviseremo con una notifica quando sarà di nuovo possibile.</span>
            </div>
            <div className="nickname-actions">
              <button type="button" className="btn-ghost" onClick={() => setConfirming(false)} disabled={isSaving}>Modifica</button>
              <button type="button" className="btn-marvel btn-inline" onClick={confirm} disabled={isSaving}>
                {isSaving ? 'Salvo…' : 'Sì, conferma'}
              </button>
            </div>
          </>
        ) : (
          <form className="nickname-step" onSubmit={next}>
            <p className="nickname-text">È il nome con cui gli altri fan ti vedranno nei commenti e nel tuo profilo.</p>
            <input
              className="field-input"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setError(null); }}
              maxLength={30}
              autoFocus
              aria-label="Nickname"
              placeholder="Il tuo nickname"
            />
            <p className="nickname-hint">Potrai cambiarlo solo una volta ogni 30 giorni.</p>
            <button type="submit" className="btn-marvel btn-inline" disabled={!valid}>Continua</button>
          </form>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </div>,
    document.body
  );
};

export default NicknameOnboarding;
