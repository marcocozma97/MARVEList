import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { NOTIFICATIONS_READ_EVENT, notificationService, type NotificationItem } from '../services/notificationService';
import { fullDate, timeAgo } from '../utils/community';
import Avatar from '../components/Avatar';

const ICONS: Record<NotificationItem['type'], string> = { FOLLOW: '＋', LIKE: '♥', REPLY: '↩' };

const target = (n: NotificationItem) => {
  if (n.type === 'FOLLOW' || n.mediaId === null) return `/users/${n.actorId}`;
  return n.episode ? `/media/${n.mediaId}/episodes/${n.episode}` : `/media/${n.mediaId}`;
};

const where = (n: NotificationItem) => n.mediaTitle ? `${n.mediaTitle}${n.episode ? ` · Ep. ${n.episode}` : ''}` : '';

const message = (n: NotificationItem) => {
  switch (n.type) {
    case 'FOLLOW': return <>ha iniziato a seguirti</>;
    case 'LIKE': return <>ha messo mi piace al tuo commento su <strong>{where(n)}</strong></>;
    case 'REPLY': return <>ha risposto al tuo commento su <strong>{where(n)}</strong></>;
  }
};

const Notifications = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
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
          Qui vedrai chi ti segue, chi mette mi piace ai tuoi commenti e chi ti risponde.
        </div>
      ) : (
        <ul className="notif-list">
          {items.map(n => (
            <li key={n.id}>
              <Link to={target(n)} className={`notif-item ${n.read ? '' : 'is-unread'}`}>
                <span className="notif-avatar">
                  <Avatar avatarId={n.actorAvatar} name={n.actorName} size={44} />
                  <span className={`notif-type notif-type-${n.type.toLowerCase()}`} aria-hidden="true">{ICONS[n.type]}</span>
                </span>
                <span className="notif-body">
                  <span className="notif-text"><strong>{n.actorName}</strong> {message(n)}</span>
                  {n.snippet && <span className="notif-snippet">“{n.snippet}”</span>}
                  <time className="notif-time" dateTime={n.createdAt} title={fullDate(n.createdAt)}>{timeAgo(n.createdAt)}</time>
                </span>
                {!n.read && <span className="notif-dot" aria-label="Nuova" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
