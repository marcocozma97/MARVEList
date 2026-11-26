import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { NOTIFICATIONS_READ_EVENT, notificationService, type NotificationItem, type NotificationType } from '../services/notificationService';
import { fullDate, timeAgo } from '../utils/community';
import { getPosterUrl } from '../utils/poster';
import Avatar from '../components/Avatar';

const ICONS: Record<NotificationType, string> = {
  FOLLOW: '＋', LIKE: '♥', REPLY: '↩', NEW_MEDIA: '★', RELEASE_30: '⏳', RELEASE_7: '⏳', RELEASE_1: '⏳', RELEASED: '▶', EPISODE_OUT: '▶', NICKNAME: '✎', JAIRVIS_OFFLINE: '⚡', APP_AVAILABLE: '↓', TOP_TEN_FEATURE: '🏆', TOP_TEN: '🏆', TOP_TEN_SPLIT: '🏆'
};

const MEDIA_TYPES: NotificationType[] = ['NEW_MEDIA', 'RELEASE_30', 'RELEASE_7', 'RELEASE_1', 'RELEASED', 'EPISODE_OUT'];

const isMediaNotice = (n: NotificationItem) => MEDIA_TYPES.includes(n.type);

const target = (n: NotificationItem) => {
  if (n.type === 'NICKNAME' || n.type === 'TOP_TEN_FEATURE' || n.type === 'TOP_TEN' || n.type === 'TOP_TEN_SPLIT') return '/profile';
  if (n.type === 'JAIRVIS_OFFLINE') return '/jairvis';
  if (n.type === 'APP_AVAILABLE') return '/'; // nella home c'è la guida all'installazione
  if (n.type === 'FOLLOW' || n.mediaId === null) return `/users/${n.actorId}`;
  return n.episode ? `/media/${n.mediaId}/episodes/${n.episode}` : `/media/${n.mediaId}`;
};

const where = (n: NotificationItem) => n.mediaTitle ? `${n.mediaTitle}${n.episode ? ` · Ep. ${n.episode}` : ''}` : '';

const releaseDay = (n: NotificationItem) => {
  if (!n.releaseDate) return null;
  const [y, m, d] = n.releaseDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const message = (n: NotificationItem) => {
  const title = <strong>{n.mediaTitle}</strong>;
  switch (n.type) {
    case 'FOLLOW': return <><strong>{n.actorName}</strong> ha iniziato a seguirti</>;
    case 'LIKE': return <><strong>{n.actorName}</strong> ha messo mi piace al tuo commento su <strong>{where(n)}</strong></>;
    case 'REPLY': return <><strong>{n.actorName}</strong> ha risposto al tuo commento su <strong>{where(n)}</strong></>;
    case 'NEW_MEDIA': return <>Novità nel catalogo: è stato aggiunto {title}</>;
    case 'RELEASE_30': return <>Manca un mese all'uscita di {title}</>;
    case 'RELEASE_7': return <>Manca una settimana all'uscita di {title}</>;
    case 'RELEASE_1': return <>Domani esce {title}!</>;
    case 'RELEASED': return <>{title} è uscito! Apri la scheda e segnalo come visto quando l'hai guardato.</>;
    case 'EPISODE_OUT': return <>È uscito l'episodio {n.episode} di {title}! Ora puoi segnarlo come visto.</>;
    case 'NICKNAME': return <>Sono passati 30 giorni: se vuoi, ora puoi cambiare di nuovo il tuo nickname.</>;
    case 'APP_AVAILABLE': return <>Novità: <strong>MARVEList ora è anche un'app!</strong> Apri il sito dal telefono e installala dalla home, sotto «Esplora la Timeline»: la trovi tra le tue app e si aggiorna da sola.</>;
    case 'TOP_TEN_FEATURE': return <>Novità: nel tuo profilo c'è <strong>la tua Top 10</strong>, con i titoli a cui hai dato il voto più alto. Vai a controllare che sia giusta: se accanto al titolo vedi la coppa 🏆, toccala e scegli l'ordine dei titoli con lo stesso voto.</>;
    case 'TOP_TEN': return <>Nella tua <strong>Top 10</strong> ci sono titoli con lo stesso voto: tocca la coppa 🏆 nel profilo e conferma quale preferisci.</>;
    case 'TOP_TEN_SPLIT': return <>Novità: la tua Top 10 ora è divisa in due, <strong>la tua Top 10 Film</strong> e <strong>la tua Top 10 Serie TV</strong>. Le trovi nel profilo, con i voti che hai già dato. Se qualcosa non ti è chiaro, consulta la sezione <strong>FAQ</strong>.</>;
    case 'JAIRVIS_OFFLINE': return <>Allarme dal laboratorio Stark: il reattore di <strong>J.A.I.R.V.I.S.</strong> ha esaurito l'energia. I fondi per l'IA sono finiti e DUM-E e U lo hanno messo in manutenzione.</>;
  }
};

const detail = (n: NotificationItem) => {
  if (n.snippet) return `“${n.snippet}”`;
  if (n.type === 'JAIRVIS_OFFLINE') return 'Ricarica i crediti OpenRouter per riportarlo online.';
  if (['RELEASE_30', 'RELEASE_7', 'RELEASE_1'].includes(n.type)) {
    const day = releaseDay(n);
    return day ? `Esce ${day}` : null;
  }
  return null;
};

const Notifications = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService.list()
      .then(list => {
        setItems(list);
        if (list.some(n => !n.read)) {
          notificationService.markAllRead()
            .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
            .catch(console.error);
        }
      })
      .catch(() => setError(true));
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="container page notifications-page">
      <h1 className="page-title">Notifiche</h1>

      {error ? (
        <div className="alert-marvel">Impossibile caricare le notifiche. Riprova tra poco.</div>
      ) : items === null ? (
        <div className="cm-loading" aria-busy="true"><span /><span /></div>
      ) : items.length === 0 ? (
        <div className="empty-box notif-empty">
          <span className="notif-empty-icon" aria-hidden="true">🔔</span>
          Qui vedrai chi ti segue, chi mette mi piace ai tuoi commenti e chi ti risponde, oltre ai nuovi titoli e alle uscite in arrivo.
        </div>
      ) : (
        <ul className="notif-list">
          {items.map(n => {
            const poster = isMediaNotice(n) ? getPosterUrl(n.mediaPoster, 'w185') : null;
            const extra = detail(n);
            return (
              <li key={n.id}>
                <Link to={target(n)} className={`notif-item ${n.read ? '' : 'is-unread'}`}>
                  <span className="notif-avatar">
                    {isMediaNotice(n) ? (
                      poster
                        ? <img className="notif-poster" src={poster} alt="" loading="lazy" />
                        : <span className="notif-poster notif-poster-empty" aria-hidden="true">🎬</span>
                    ) : n.type === 'JAIRVIS_OFFLINE' ? (
                      <span className="notif-poster notif-jairvis" aria-hidden="true" />
                    ) : n.type === 'APP_AVAILABLE' ? (
                      <img className="notif-poster notif-app" src="/icon-192.png" alt="" />
                    ) : n.type.startsWith('TOP_TEN') ? (
                      <span className="notif-poster notif-poster-empty" aria-hidden="true">🏆</span>
                    ) : n.type === 'NICKNAME' ? (
                      <Avatar avatarId={profile?.avatar} name={profile?.nickname ?? ''} size={44} />
                    ) : (
                      <Avatar avatarId={n.actorAvatar} name={n.actorName} size={44} />
                    )}
                    <span className={`notif-type notif-type-${n.type === 'EPISODE_OUT' ? 'released' : n.type === 'JAIRVIS_OFFLINE' ? 'jairvis' : n.type === 'APP_AVAILABLE' ? 'app' : n.type.startsWith('TOP_TEN') ? 'cup' : n.type.toLowerCase().replace(/_\d+$/, '')}`} aria-hidden="true">{ICONS[n.type]}</span>
                  </span>
                  <span className="notif-body">
                    <span className="notif-text">{message(n)}</span>
                    {extra && <span className="notif-snippet">{extra}</span>}
                    <time className="notif-time" dateTime={n.createdAt} title={fullDate(n.createdAt)}>{timeAgo(n.createdAt)}</time>
                  </span>
                  {!n.read && <span className="notif-dot" aria-label="Nuova" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
