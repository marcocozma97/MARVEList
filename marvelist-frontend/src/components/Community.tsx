import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { commentService, type CommentItem } from '../services/commentService';
import { gifsEnabled, type GifResult } from '../services/gifService';
import { fullDate, MAX_COMMENT_LENGTH, timeAgo } from '../utils/community';
import Avatar from './Avatar';
import GifPicker from './GifPicker';

type CommunityKind = 'film' | 'season' | 'episode';

interface CommunityProps {
  mediaId: number;
  episode?: number | null;
  kind: CommunityKind;
  seen: boolean;
}

const PLACEHOLDER: Record<CommunityKind, string> = {
  film: 'Cosa ne pensi di questo film?',
  season: 'Cosa ne pensi di questa stagione?',
  episode: 'Cosa ne pensi di questo episodio?'
};

const GATE_TEXT: Record<CommunityKind, string> = {
  film: 'Leggi i commenti della community solo se hai già visto il film: potrebbero rivelarne la trama e il finale.',
  season: "Leggi i commenti della community solo se hai già visto l'intera stagione: potrebbero rivelare cosa succede negli episodi.",
  episode: 'Leggi i commenti della community solo se hai già visto questo episodio: potrebbero rivelarne la trama.'
};

const gateKey = (mediaId: number, episode?: number | null) => `marvelist_spoiler_ok_${mediaId}_${episode ?? 'all'}`;

const errorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (e instanceof Error ? e.message : fallback);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

const Community = ({ mediaId, episode = null, kind, seen }: CommunityProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const profile = useSelector((state: RootState) => state.auth.profile);

  const [count, setCount] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(() => {
    try { return sessionStorage.getItem(gateKey(mediaId, episode)) === '1'; } catch { return false; }
  });
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [openSpoilers, setOpenSpoilers] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [text, setText] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [gif, setGif] = useState<GifResult | null>(null);
  const [showGifs, setShowGifs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    commentService.count(mediaId, episode).then(setCount).catch(() => setCount(0));
  }, [mediaId, episode, isAuthenticated]);

  const fetchComments = useCallback(() => {
    commentService.list(mediaId, episode)
      .then(list => { setComments(list); setCount(list.length); setListError(null); })
      .catch(() => setListError('Impossibile caricare i commenti. Riprova tra poco.'));
  }, [mediaId, episode]);

  const retry = () => {
    setListError(null);
    fetchComments();
  };

  useEffect(() => {
    if (isAuthenticated && revealed && comments === null) fetchComments();
  }, [isAuthenticated, revealed, comments, fetchComments]);

  const reveal = () => {
    try {
      sessionStorage.setItem(gateKey(mediaId, episode), '1');
    } finally {
      setRevealed(true);
    }
  };

  const autoGrow = () => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const pickGif = useCallback((picked: GifResult) => {
    setGif(picked);
    setShowGifs(false);
  }, []);
  const closeGifs = useCallback(() => setShowGifs(false), []);

  const trimmed = text.trim();
  const canSend = (trimmed.length > 0 || !!gif) && trimmed.length <= MAX_COMMENT_LENGTH && !isSending;

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    setIsSending(true);
    setFormError(null);
    try {
      const created = await commentService.create(mediaId, { text: trimmed, episode, spoiler, gifUrl: gif?.url ?? null });
      setText('');
      setSpoiler(false);
      setGif(null);
      requestAnimationFrame(autoGrow);
      setCount(c => (c ?? 0) + 1);
      if (comments) setComments([created, ...comments]);
      setSentNote(revealed || !count ? 'Commento pubblicato!' : "Commento pubblicato! Lo trovi insieme agli altri, dopo l'avviso spoiler.");
      window.setTimeout(() => setSentNote(null), 4000);
      if (!count) reveal();
    } catch (err) {
      setFormError(errorMessage(err, 'Impossibile pubblicare il commento. Riprova.'));
    } finally {
      setIsSending(false);
    }
  };

  const remove = async (id: number) => {
    setConfirmDelete(null);
    const previous = comments;
    setComments(list => list?.filter(c => c.id !== id) ?? list);
    setCount(c => Math.max(0, (c ?? 1) - 1));
    try {
      await commentService.remove(id);
    } catch {
      setComments(previous);
      setCount(c => (c ?? 0) + 1);
    }
  };

  const toggleSpoiler = (id: number) =>
    setOpenSpoilers(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const remaining = MAX_COMMENT_LENGTH - text.length;
  const showGate = isAuthenticated && !revealed && (count ?? 0) > 0;

  const gateContent = (
    <>
      <span className="spoiler-gate-icon" aria-hidden="true">!</span>
      <span className="spoiler-gate-title">Spoiler alert!</span>
      <span className="spoiler-gate-text">{GATE_TEXT[kind]}</span>
      {seen && <span className="spoiler-gate-seen">✔ Risulta che l'hai già visto</span>}
    </>
  );

  return (
    <section className="community" aria-labelledby="community-title">
      <div className="community-head">
        <h2 id="community-title" className="section-title community-title">Community</h2>
        {isAuthenticated && count !== null && (
          <span className="community-count">{count === 1 ? '1 commento' : `${count} commenti`}</span>
        )}
      </div>

      {!isAuthenticated ? (
        <>
          <div className="community-login">
            <p><strong>Unisciti alla discussione.</strong> Accedi per leggere i commenti degli altri fan e lasciare il tuo.</p>
            <Link to="/login" className="btn-marvel btn-inline btn-sm-pill">Accedi</Link>
          </div>
          <div className="spoiler-gate">{gateContent}</div>
        </>
      ) : (
        <>
          <form className={`cm-composer ${spoiler ? 'is-spoiler' : ''}`} onSubmit={send}>
            <Avatar avatarId={profile?.avatar} name={profile?.nickname ?? ''} size={42} className="cm-avatar" />
            <div className="cm-composer-main">
              <label htmlFor={`cm-text-${mediaId}-${episode ?? 'all'}`} className="visually-hidden">Il tuo commento</label>
              <textarea
                id={`cm-text-${mediaId}-${episode ?? 'all'}`}
                ref={textarea}
                className="cm-textarea"
                placeholder={PLACEHOLDER[kind]}
                value={text}
                rows={2}
                maxLength={MAX_COMMENT_LENGTH + 200}
                onChange={(e) => { setText(e.target.value); setFormError(null); autoGrow(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
              />

              {gif && (
                <div className="cm-attachment">
                  <img src={gif.url} alt={gif.title || 'GIF scelta'} />
                  <button type="button" className="cm-attachment-remove" onClick={() => setGif(null)} aria-label="Rimuovi la GIF">×</button>
                  <span className="cm-attachment-tag">GIF</span>
                </div>
              )}

              <div className="cm-toolbar">
                <div className="cm-tool-wrap">
                  <button
                    type="button"
                    className={`cm-tool cm-tool-gif ${showGifs ? 'active' : ''}`}
                    onClick={() => setShowGifs(v => !v)}
                    disabled={!gifsEnabled}
                    aria-expanded={showGifs}
                    title={gifsEnabled ? 'Aggiungi una GIF' : 'GIF non disponibili'}
                  >GIF</button>
                  {showGifs && <GifPicker onPick={pickGif} onClose={closeGifs} />}
                </div>
                <button
                  type="button"
                  className={`cm-tool cm-tool-spoiler ${spoiler ? 'active' : ''}`}
                  onClick={() => setSpoiler(v => !v)}
                  aria-pressed={spoiler}
                  title={spoiler ? 'Il commento verrà nascosto agli altri finché non decidono di leggerlo' : 'Segna il commento come spoiler'}
                >⚠ Spoiler</button>

                <span className="cm-toolbar-spacer" />
                {remaining < 200 && <span className={`cm-counter ${remaining < 0 ? 'is-over' : ''}`}>{remaining}</span>}
                <button type="submit" className="btn-marvel btn-inline btn-sm-pill cm-send" disabled={!canSend}>
                  {isSending ? 'Invio…' : 'Pubblica'}
                </button>
              </div>

              {spoiler && <p className="cm-hint">Il tuo commento sarà sfocato finché chi legge non sceglie di vederlo.</p>}
              {formError && <p className="field-error" role="alert">{formError}</p>}
              {sentNote && <p className="save-note" role="status">{sentNote}</p>}
            </div>
          </form>

          {showGate ? (
            <button type="button" className="spoiler-gate is-locked" onClick={reveal}>
              {gateContent}
              <span className="btn-marvel btn-inline btn-lg-pill spoiler-gate-cta">
                Ho visto, sblocca {count === 1 ? 'il commento' : `i ${count} commenti`}
              </span>
            </button>
          ) : (
            <div className="spoiler-gate">{gateContent}</div>
          )}

          {count === null ? (
            <div className="cm-loading" aria-busy="true"><span /><span /></div>
          ) : count === 0 ? (
            <div className="empty-box cm-empty">Nessun commento ancora: scrivi il primo!</div>
          ) : showGate ? null : listError ? (
            <div className="alert-marvel">{listError} <button type="button" className="btn-chip ms-2" onClick={retry}>Riprova</button></div>
          ) : comments === null ? (
            <div className="cm-loading" aria-busy="true"><span /><span /></div>
          ) : (
            <ul className="cm-list">
              {comments.map(c => {
                const hidden = c.spoiler && !openSpoilers.includes(c.id);
                return (
                  <li key={c.id} className={`cm-card ${c.mine ? 'is-mine' : ''}`}>
                    <Avatar avatarId={c.authorAvatar} name={c.authorName} size={40} className="cm-avatar" />
                    <div className="cm-card-body">
                      <div className="cm-card-head">
                        <strong className="cm-author">{c.authorName}</strong>
                        {c.mine && <span className="cm-you">Tu</span>}
                        <time className="cm-time" dateTime={c.createdAt} title={fullDate(c.createdAt)}>{timeAgo(c.createdAt)}</time>
                        {c.spoiler && <span className="cm-spoiler-badge">Spoiler</span>}
                        {c.mine && (
                          confirmDelete === c.id ? (
                            <span className="cm-confirm">
                              Eliminare?
                              <button type="button" className="cm-confirm-yes" onClick={() => remove(c.id)}>Sì</button>
                              <button type="button" className="cm-confirm-no" onClick={() => setConfirmDelete(null)}>No</button>
                            </span>
                          ) : (
                            <button type="button" className="cm-delete" onClick={() => setConfirmDelete(c.id)} aria-label="Elimina il commento" title="Elimina"><TrashIcon /></button>
                          )
                        )}
                      </div>

                      <div className={`cm-content ${hidden ? 'is-hidden' : ''}`} aria-hidden={hidden}>
                        {c.text && <p className="cm-text">{c.text}</p>}
                        {c.gifUrl && <img className="cm-gif" src={c.gifUrl} alt="GIF" loading="lazy" />}
                      </div>
                      {hidden ? (
                        <button type="button" className="cm-reveal" onClick={() => toggleSpoiler(c.id)}>
                          <span aria-hidden="true">⚠</span> Contiene spoiler · <strong>Mostra</strong>
                        </button>
                      ) : c.spoiler && (
                        <button type="button" className="cm-hide" onClick={() => toggleSpoiler(c.id)}>Nascondi di nuovo</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
};

export default Community;
