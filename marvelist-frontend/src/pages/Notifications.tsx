import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { NOTIFICATIONS_READ_EVENT, notificationService, type NotificationItem, type NotificationType } from '../services/notificationService';
import { fullDate, timeAgo } from '../utils/community';
import { getPosterUrl } from '../utils/poster';
import Avatar from '../components/Avatar';

const ICONS: Record<NotificationType, string> = {
  FOLLOW: '＋', LIKE: '♥', REPLY: '↩', NEW_MEDIA: '★', RELEASE_30: '⏳', RELEASE_7: '⏳', RELEASE_1: '⏳', RELEASED: '▶', EPISODE_OUT: '▶', NICKNAME: '✎'
};

const MEDIA_TYPES: NotificationType[] = ['NEW_MEDIA', 'RELEASE_30', 'RELEASE_7', 'RELEASE_1', 'RELEASED', 'EPISODE_OUT'];

const isMediaNotice = (n: NotificationItem) => MEDIA_TYPES.includes(n.type);

const target = (n: NotificationItem) => {
  if (n.type === 'NICKNAME') return '/profile';
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
  }
};

const detail = (n: NotificationItem) => {
  if (n.snippet) return `“${n.snippet}”`;
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
                    ) : n.type === 'NICKNAME' ? (
                      <Avatar avatarId={profile?.avatar} name={profile?.nickname ?? ''} size={44} />
                    ) : (
                      <Avatar avatarId={n.actorAvatar} name={n.actorName} size={44} />
                    )}
                    <span className={`notif-type notif-type-${n.type === 'EPISODE_OUT' ? 'released' : n.type.toLowerCase().replace(/_\d+$/, '')}`} aria-hidden="true">{ICONS[n.type]}</span>
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
