import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../services/mediaService';
import { userService, type TopTen, type TopTenTie } from '../services/userService';
import { errorMessage } from '../utils/marathon';
import { TopPoster } from './TopList';

const vote = (rating: number) => String(rating).replace('.', ',');

const needed = (tie: TopTenTie) => tie.slots < tie.mediaIds.length ? tie.slots : tie.mediaIds.length - 1;

const TopTenConfirm = ({ topTen, mediaById, onClose, onSaved }: {
  topTen: TopTen;
  mediaById: Map<number, MediaItem>;
  onClose: () => void;
  onSaved: (topTen: TopTen) => void;
}) => {
  const [picks, setPicks] = useState<number[][]>(() => topTen.ties.map(tie => tie.confirmed ? tie.mediaIds.slice(0, needed(tie)) : []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  const above = (tie: TopTenTie) => topTen.items.filter(e => e.rating > tie.rating).length;
  const complete = (i: number) => picks[i].length >= needed(topTen.ties[i]);
  const allComplete = topTen.ties.every((_, i) => complete(i));

  const toggle = (i: number, id: number) => {
    setError(null);
    setPicks(prev => prev.map((list, j) => {
      if (j !== i) return list;
      if (list.includes(id)) return list.filter(x => x !== id);
      return list.length < needed(topTen.ties[i]) ? [...list, id] : list;
    }));
  };

  const position = (i: number, id: number) => {
    const tie = topTen.ties[i];
    const k = picks[i].indexOf(id);
    if (k >= 0) return above(tie) + k + 1;
    if (complete(i) && tie.slots === tie.mediaIds.length) return above(tie) + tie.mediaIds.length;
    return null;
  };

  const save = async () => {
    const rating = new Map<number, number>();
    const within = new Map<number, number>();
    topTen.items.forEach((e, index) => { rating.set(e.mediaId, e.rating); within.set(e.mediaId, index); });
    topTen.ties.forEach((tie, i) => tie.mediaIds.forEach((id, index) => {
      rating.set(id, tie.rating);
      const k = picks[i].indexOf(id);
      within.set(id, k >= 0 ? k : picks[i].length + 100 + index);
    }));
    const order = [...rating.keys()].sort((a, b) => (rating.get(b)! - rating.get(a)!) || (within.get(a)! - within.get(b)!));
    setSaving(true);
    try {
      onSaved(await userService.confirmTopTen(order));
    } catch (e) {
      setError(errorMessage(e, 'Salvataggio non riuscito. Riprova.'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="people-backdrop" onClick={onClose}>
      <div className="people-modal top-ten-modal" role="dialog" aria-modal="true" aria-label={topTen.needsConfirmation ? 'Conferma la tua Top 10' : "Cambia l'ordine dei pari merito"} onClick={(e) => e.stopPropagation()}>
        <div className="people-head">
          <h2 className="edit-profile-title"><span aria-hidden="true">🏆</span> {topTen.needsConfirmation ? 'Conferma la tua Top 10' : 'I tuoi pari merito'}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Chiudi">×</button>
        </div>
        <div className="people-body top-ten-body">
          <p className="top-ten-intro">Hai dato lo stesso voto a più titoli. Tocca le locandine nell'ordine in cui li preferisci: il primo che tocchi sale più in alto. Per cambiare, tocca di nuovo una locandina scelta.{!topTen.needsConfirmation && " Qui trovi l'ordine che hai già confermato: puoi cambiarlo quando vuoi."}</p>
          {topTen.ties.map((tie, i) => {
            const full = tie.slots === tie.mediaIds.length;
            return (
              <section key={tie.rating} className="top-ten-tie" aria-label={`Pari merito con voto ${vote(tie.rating)}`}>
                <div className="top-ten-tie-head">
                  <strong>🛡 {vote(tie.rating)}</strong>
                  <span>{full
                    ? `${tie.mediaIds.length} titoli a pari merito: scegli l'ordine`
                    : tie.slots === 1
                      ? `${tie.mediaIds.length} titoli per l'ultimo posto: scegli il tuo preferito`
                      : `${tie.mediaIds.length} titoli per ${tie.slots} posti: scegli i tuoi preferiti in ordine`}</span>
                </div>
                <div className="top-ten-choices">
                  {tie.mediaIds.map(id => {
                    const media = mediaById.get(id);
                    if (!media) return null;
                    const rank = position(i, id);
                    const picked = picks[i].includes(id);
                    const out = !full && complete(i) && !picked;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`top-ten-choice ${picked ? 'is-picked' : ''} ${rank && !picked ? 'is-auto' : ''} ${out ? 'is-out' : ''}`}
                        onClick={() => toggle(i, id)}
                        aria-pressed={picked}
                        aria-label={`${media.title}${rank ? `: ${rank}° posto` : out ? ': fuori dalla Top 10' : ''}`}
                      >
                        <span className="top-ten-choice-poster">
                          <TopPoster media={media} size="w185" />
                          {rank && <span className="top-ten-choice-rank" aria-hidden="true">{rank}</span>}
                          {out && <span className="top-ten-choice-out" aria-hidden="true">Fuori</span>}
                        </span>
                        <span className="top-ten-choice-title">{media.title}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="top-ten-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Più tardi</button>
            <button type="button" className="btn-marvel" onClick={save} disabled={!allComplete || saving}>
              {saving ? 'Salvo…' : topTen.needsConfirmation ? 'Conferma la Top 10' : 'Salva il nuovo ordine'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TopTenConfirm;
