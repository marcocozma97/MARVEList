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
  film: 'Leggi i commenti solo se hai già visto il film.',
  season: "Leggi i commenti solo se hai già visto l'intera stagione.",
  episode: 'Leggi i commenti solo se hai già visto questo episodio.'
};

const errorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (e instanceof Error ? e.message : fallback);

const profileLink = (c: CommentItem) => c.mine ? '/profile' : `/users/${c.authorId}`;

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);

const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 14l-5-5 5-5M4 9h10a6 6 0 0 1 6 6v4" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 15l6-6 6 6" />
  </svg>
);

interface ReplyFormProps {
  initialText: string;
  onSend: (text: string, spoiler: boolean) => Promise<boolean>;
  onCancel: () => void;
}

const ReplyForm = ({ initialText, onSend, onCancel }: ReplyFormProps) => {
  const [text, setText] = useState(initialText);
  const [spoiler, setSpoiler] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_COMMENT_LENGTH && !isSending;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    setIsSending(true);
    const ok = await onSend(trimmed, spoiler);
    setIsSending(false);
    if (ok) onCancel();
  };

  return (
    <form className={`cm-reply-form ${spoiler ? 'is-spoiler' : ''}`} onSubmit={submit}>
      <textarea
        ref={input}
        className="cm-textarea cm-reply-input"
        placeholder="Scrivi una risposta…"
        aria-label="La tua risposta"
        value={text}
        rows={2}
        maxLength={MAX_COMMENT_LENGTH + 200}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="cm-toolbar">
        <button
          type="button"
          className={`cm-tool cm-tool-spoiler ${spoiler ? 'active' : ''}`}
          onClick={() => setSpoiler(v => !v)}
          aria-pressed={spoiler}
        >⚠ Spoiler</button>
        <span className="cm-toolbar-spacer" />
        <button type="button" className="btn-ghost btn-sm-pill" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn-marvel btn-inline btn-sm-pill cm-send" disabled={!canSend}>
          {isSending ? 'Invio…' : 'Rispondi'}
        </button>
      </div>
    </form>
  );
};

const Community = ({ mediaId, episode = null, kind, seen }: CommunityProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const profile = useSelector((state: RootState) => state.auth.profile);

  const [count, setCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [openSpoilers, setOpenSpoilers] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<{ rootId: number; commentId: number; mention: string } | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

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
      .then(list => {
        setComments(list);
        setCount(list.reduce((total, c) => total + 1 + c.replies.length, 0));
        setListError(null);
      })
      .catch(() => setListError('Impossibile caricare i commenti. Riprova tra poco.'));
  }, [mediaId, episode]);

  const retry = () => {
    setListError(null);
    fetchComments();
  };

  useEffect(() => {
    if (isAuthenticated && open && comments === null) fetchComments();
  }, [isAuthenticated, open, comments, fetchComments]);

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
      setSentNote(open ? 'Commento pubblicato!' : 'Commento pubblicato! Apri i commenti qui sotto per vederlo insieme agli altri.');
      window.setTimeout(() => setSentNote(null), 4000);
    } catch (err) {
      setFormError(errorMessage(err, 'Impossibile pubblicare il commento. Riprova.'));
    } finally {
      setIsSending(false);
    }
  };

  const mapComment = (id: number, fn: (c: CommentItem) => CommentItem) =>
    setComments(list => list?.map(c => c.id === id ? fn(c) : { ...c, replies: c.replies.map(r => r.id === id ? fn(r) : r) }) ?? list);

  const toggleLike = async (c: CommentItem) => {
    const liked = !c.liked;
    mapComment(c.id, x => ({ ...x, liked, likes: Math.max(0, x.likes + (liked ? 1 : -1)) }));
    try {
      const state = await commentService.like(c.id);
      mapComment(c.id, x => ({ ...x, liked: state.liked, likes: state.likes }));
    } catch {
      mapComment(c.id, x => ({ ...x, liked: c.liked, likes: c.likes }));
    }
  };

  const startReply = (c: CommentItem, rootId: number) => {
    setReplyError(null);
    setReplyTo({ rootId, commentId: c.id, mention: c.id === rootId || c.mine ? '' : `@${c.authorName} ` });
  };

  const sendReply = async (rootId: number, replyText: string, replySpoiler: boolean) => {
    setReplyError(null);
    try {
      const created = await commentService.create(mediaId, { text: replyText, episode, spoiler: replySpoiler, parentId: rootId });
      setComments(list => list?.map(c => c.id === rootId ? { ...c, replies: [...c.replies, created] } : c) ?? list);
      setCount(c => (c ?? 0) + 1);
      return true;
    } catch (err) {
      setReplyError(errorMessage(err, 'Impossibile pubblicare la risposta. Riprova.'));
      return false;
    }
  };

  const remove = async (id: number) => {
    setConfirmDelete(null);
    const previous = comments;
    const root = comments?.find(c => c.id === id);
    const removed = root ? 1 + root.replies.length : 1;
    setComments(list => list
      ?.filter(c => c.id !== id)
      .map(c => ({ ...c, replies: c.replies.filter(r => r.id !== id) })) ?? list);
    setCount(c => Math.max(0, (c ?? removed) - removed));
    try {
      await commentService.remove(id);
    } catch {
      setComments(previous);
      setCount(c => (c ?? 0) + removed);
    }
  };

  const toggleSpoiler = (id: number) =>
    setOpenSpoilers(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const remaining = MAX_COMMENT_LENGTH - text.length;

  const gateCopy = (
    <>
      <span className="spoiler-gate-icon" aria-hidden="true">!</span>
      <span className="spoiler-gate-copy">
        <span className="spoiler-gate-title">Spoiler alert</span>
        <span className="spoiler-gate-text">
          {GATE_TEXT[kind]}
          {seen && <span className="spoiler-gate-seen"> · ✔ Risulta che l'hai già visto</span>}
        </span>
      </span>
    </>
  );

  const renderComment = (c: CommentItem, rootId: number) => {
    const hidden = c.spoiler && !openSpoilers.includes(c.id);
    const isReply = c.id !== rootId;
    return (
      <div className={`cm-card ${c.mine ? 'is-mine' : ''} ${isReply ? 'is-reply' : ''}`}>
        <Link to={profileLink(c)} className="cm-avatar-link" aria-label={`Profilo di ${c.authorName}`}>
          <Avatar avatarId={c.authorAvatar} name={c.authorName} size={isReply ? 32 : 40} className="cm-avatar" />
        </Link>
        <div className="cm-card-body">
          <div className="cm-card-head">
            <Link to={profileLink(c)} className="cm-author">{c.authorName}</Link>
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

          <div className="cm-actions">
            <button
              type="button"
              className={`cm-action cm-like ${c.liked ? 'is-active' : ''}`}
              onClick={() => toggleLike(c)}
              disabled={c.mine}
              aria-pressed={c.liked}
              aria-label={c.liked ? 'Togli il mi piace' : 'Mi piace'}
              title={c.mine ? 'Non puoi mettere mi piace ai tuoi commenti' : c.liked ? 'Togli il mi piace' : 'Mi piace'}
            >
              <HeartIcon filled={c.liked} />
              {c.likes > 0 && <span>{c.likes}</span>}
            </button>
            <button type="button" className="cm-action" onClick={() => startReply(c, rootId)}>
              <ReplyIcon /> <span>Rispondi</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

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
          <div className="spoiler-gate">{gateCopy}</div>
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

          <button
            type="button"
            className={`spoiler-gate is-locked ${open ? 'is-open' : ''}`}
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls={`cm-list-${mediaId}-${episode ?? 'all'}`}
          >
            {gateCopy}
            <span className="spoiler-gate-cta">
              {open ? <ChevronIcon /> : <LockIcon />}
              {open ? 'Nascondi i commenti' : count ? `Mostra ${count === 1 ? 'il commento' : `${count} commenti`}` : 'Mostra i commenti'}
            </span>
          </button>

          {!open ? null : count === 0 ? (
            <div className="empty-box cm-empty">Nessun commento ancora: scrivi il primo!</div>
          ) : listError ? (
            <div className="alert-marvel">{listError} <button type="button" className="btn-chip ms-2" onClick={retry}>Riprova</button></div>
          ) : comments === null ? (
            <div className="cm-loading" aria-busy="true"><span /><span /></div>
          ) : (
            <ul className="cm-list" id={`cm-list-${mediaId}-${episode ?? 'all'}`}>
              {comments.map(c => (
                <li key={c.id} className="cm-thread">
                  {renderComment(c, c.id)}
                  {(c.replies.length > 0 || replyTo?.rootId === c.id) && (
                    <div className="cm-replies">
                      {c.replies.map(r => <div key={r.id}>{renderComment(r, c.id)}</div>)}
                      {replyTo?.rootId === c.id && (
                        <>
                          <ReplyForm
                            key={replyTo.commentId}
                            initialText={replyTo.mention}
                            onSend={(t, s) => sendReply(c.id, t, s)}
                            onCancel={() => setReplyTo(null)}
                          />
                          {replyError && <p className="field-error" role="alert">{replyError}</p>}
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
};

export default Community;
