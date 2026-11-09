import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { mediaService, type MediaItem } from '../services/mediaService';
import { userService, type PublicProfile } from '../services/userService';
import { formatDay, getBackgroundUrl } from '../utils/marathon';
import { VISION_ORDER_LABELS } from '../utils/ordering';
import type { RankTone } from '../utils/rank';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import MediaCard from '../components/MediaCard';
import { RankPill } from '../components/RankBadge';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [data, setData] = useState<{ id: number; profile: PublicProfile | null } | null>(null);
  const [catalog, setCatalog] = useState<Map<number, MediaItem>>(new Map());
  const [openList, setOpenList] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    mediaService.getAllMedia().then(list => setCatalog(new Map(list.map(m => [m.id, m])))).catch(() => setCatalog(new Map()));
  }, [isAuthenticated]);

  const load = useCallback(() => {
    userService.getPublic(userId)
      .then(profile => setData({ id: userId, profile }))
      .catch(() => setData({ id: userId, profile: null }));
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && userId) load();
  }, [isAuthenticated, userId, load]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (!data || data.id !== userId) {
    return <div className="page-loader"><div className="spinner-border text-danger" role="status"></div></div>;
  }

  const profile = data.profile;
  if (!profile) {
    return (
      <div className="container page page-empty">
        <h3>Utente non trovato.</h3>
        <Link to="/timeline" className="btn-marvel btn-inline mt-3">Torna alla Timeline</Link>
      </div>
    );
  }
  if (profile.me) return <Navigate to="/profile" replace />;

  const pick = (ids: number[]) => ids.map(mid => catalog.get(mid)).filter((m): m is MediaItem => !!m);
  const favorites = pick(profile.favoriteIds);
  const watching = pick(profile.watchingIds);

  return (
    <div className="container page profile-page">
      <section className="profile-header glass-card public-profile-header">
        <div className="profile-identity">
          <Avatar avatarId={profile.avatar} name={profile.nickname} size={96} />
          <div className="profile-name-block">
            <div className="profile-name-row">
              <h1 className="profile-name">{profile.nickname}</h1>
              {profile.rankTitle && profile.rankTone && <RankPill title={profile.rankTitle} tone={profile.rankTone as RankTone} />}
              <FollowButton key={profile.id} userId={profile.id} following={profile.followedByMe} onChange={load} />
            </div>
            <div className="social-counts">
              <span className="social-count is-static"><strong>{profile.followers}</strong><span>Follower</span></span>
              <span className="social-count is-static"><strong>{profile.following}</strong><span>Seguiti</span></span>
            </div>
          </div>
        </div>
      </section>

      {!profile.visible ? (
        <div className="empty-box profile-locked">
          <span className="profile-locked-icon" aria-hidden="true">🔒</span>
          <strong>Segui {profile.nickname} per vedere il suo profilo</strong>
          <span>Grado, liste, titoli che sta guardando e preferiti sono visibili solo a chi lo segue.</span>
        </div>
      ) : (
        <>
          <section className="profile-section">
            <div className="section-heading">
              <h2 className="section-title">Liste</h2>
              {profile.lists.length > 0 && <span className="section-hint">{profile.lists.length} {profile.lists.length === 1 ? 'maratona' : 'maratone'}</span>}
            </div>
            {profile.lists.length === 0 ? (
              <div className="empty-box">{profile.nickname} non ha ancora creato maratone.</div>
            ) : (
              <div className="public-lists">
                {profile.lists.map(list => {
                  const bg = getBackgroundUrl(list.background);
                  const open = openList === list.id;
                  return (
                    <article key={list.id} className={`public-list ${open ? 'is-open' : ''}`}>
                      <button type="button" className="public-list-head" onClick={() => setOpenList(open ? null : list.id)} aria-expanded={open}>
                        <span className="public-list-media" style={bg ? { backgroundImage: `url("${bg}")` } : undefined} aria-hidden="true" />
                        <span className="public-list-info">
                          <strong>{list.name}</strong>
                          <span>{VISION_ORDER_LABELS[list.visionOrder]} · {list.mediaIds.length} {list.mediaIds.length === 1 ? 'titolo' : 'titoli'} · {formatDay(list.startDate)} → {formatDay(list.endDate)}</span>
                        </span>
                        <svg className="public-list-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                      {open && (
                        <div className="media-grid public-list-grid">
                          {pick(list.mediaIds).map(m => <MediaCard key={m.id} media={m} />)}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="profile-section">
            <div className="section-heading">
              <h2 className="section-title">Continua a guardare</h2>
              <span className="section-hint">Titoli che {profile.nickname} ha iniziato e non ha ancora finito</span>
            </div>
            {watching.length === 0 ? (
              <div className="empty-box">{profile.nickname} non ha titoli in corso.</div>
            ) : (
              <div className="media-grid">
                {watching.map(m => <MediaCard key={m.id} media={m} />)}
              </div>
            )}
          </section>

          <section className="profile-section">
            <div className="section-heading">
              <h2 className="section-title">Preferiti</h2>
            </div>
            {favorites.length === 0 ? (
              <div className="empty-box">{profile.nickname} non ha ancora aggiunto preferiti.</div>
            ) : (
              <div className="media-grid">
                {favorites.map(m => <MediaCard key={m.id} media={m} favorite />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default UserProfile;
