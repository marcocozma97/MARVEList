import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { mediaService, type MediaItem } from '../services/mediaService';
import { userService, type PublicProfile } from '../services/userService';
import { formatDay, getBackgroundUrl } from '../utils/marathon';
import { VISION_ORDER_LABELS } from '../utils/ordering';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import MediaCard from '../components/MediaCard';
import PeopleModal, { type PeopleTab } from '../components/PeopleModal';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [data, setData] = useState<{ id: number; profile: PublicProfile | null } | null>(null);
  const [catalog, setCatalog] = useState<Map<number, MediaItem>>(new Map());
  const [followers, setFollowers] = useState<number | null>(null);
  const [peopleTab, setPeopleTab] = useState<PeopleTab | null>(null);
  const [openList, setOpenList] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    mediaService.getAllMedia().then(list => setCatalog(new Map(list.map(m => [m.id, m])))).catch(() => setCatalog(new Map()));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    userService.getPublic(userId)
      .then(profile => setData({ id: userId, profile }))
      .catch(() => setData({ id: userId, profile: null }));
  }, [isAuthenticated, userId]);

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

  const favorites = profile.favoriteIds.map(fid => catalog.get(fid)).filter((m): m is MediaItem => !!m);
  const followerCount = followers ?? profile.followers;

  return (
    <div className="container page profile-page">
      <section className="profile-header glass-card public-profile-header">
        <div className="profile-identity">
          <Avatar avatarId={profile.avatar} name={profile.nickname} size={96} />
          <div className="profile-name-block">
            <div className="profile-name-row">
              <h1 className="profile-name">{profile.nickname}</h1>
              <FollowButton key={profile.id} userId={profile.id} following={profile.followedByMe} onChange={s => setFollowers(s.followers)} />
            </div>
            <div className="social-counts">
              <button type="button" className="social-count" onClick={() => setPeopleTab('followers')}>
                <strong>{followerCount}</strong> follower
              </button>
              <button type="button" className="social-count" onClick={() => setPeopleTab('following')}>
                <strong>{profile.following}</strong> seguiti
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <div className="section-heading">
          <h2 className="section-title">Liste</h2>
          {profile.lists.length > 0 && <span className="section-hint">{profile.lists.length} {profile.lists.length === 1 ? 'maratona pubblica' : 'maratone pubbliche'}</span>}
        </div>
        {profile.lists.length === 0 ? (
          <div className="empty-box">{profile.nickname} non ha ancora maratone pubbliche.</div>
        ) : (
          <div className="public-lists">
            {profile.lists.map(list => {
              const bg = getBackgroundUrl(list.background);
              const open = openList === list.id;
              const items = list.mediaIds.map(mid => catalog.get(mid)).filter((m): m is MediaItem => !!m);
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
                      {items.map(m => <MediaCard key={m.id} media={m} />)}
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

      {peopleTab && <PeopleModal key={peopleTab} userId={profile.id} initialTab={peopleTab} onClose={() => setPeopleTab(null)} />}
    </div>
  );
};

export default UserProfile;
