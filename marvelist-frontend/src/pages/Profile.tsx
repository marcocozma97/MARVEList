import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setProfile } from '../store/authSlice';
import { Navigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { mediaService, type MediaItem, type MediaProgress } from '../services/mediaService';
import { userService, type TopTen, type UserStats } from '../services/userService';
import { marathonService, type MarathonSummary } from '../services/marathonService';
import { errorMessage, formatDay, dayLabel, getBackgroundUrl } from '../utils/marathon';
import { getProgressPercent } from '../utils/progress';
import MediaCard from '../components/MediaCard';
import Avatar from '../components/Avatar';
import RankBadge from '../components/RankBadge';
import { computeRank } from '../utils/rank';
import { speakWatchTime, splitWatchTime } from '../utils/watchTime';
import { AVATARS, AVATAR_GROUPS } from '../utils/avatars';
import PeopleModal, { type PeopleTab } from '../components/PeopleModal';
import SlowLoader from '../components/SlowLoader';
import EditProfileModal from '../components/EditProfileModal';
import TopList from '../components/TopList';
import TopTenConfirm from '../components/TopTenConfirm';

const Profile = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const dispatch = useDispatch();

  const [favorites, setFavorites] = useState<MediaItem[]>([]);
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [watchLaterIds, setWatchLaterIds] = useState<number[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [progressById, setProgressById] = useState<Record<number, MediaProgress>>({});
  const [marathons, setMarathons] = useState<MarathonSummary[]>([]);
  const [topTen, setTopTen] = useState<TopTen | null>(null);
  const [showTopTenConfirm, setShowTopTenConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // dopo l'importazione di un salvataggio si ricaricano i dati
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [social, setSocial] = useState<{ followers: number; following: number } | null>(null);
  const [peopleTab, setPeopleTab] = useState<PeopleTab | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        // Ogni sezione è indipendente: se una chiamata fallisce le altre si vedono comunque
        const [favData, watchData, seenData, laterData, allData, progressData, me, marathonData, topTenData] = await Promise.all([
          mediaService.getFavorites().catch((): number[] => []),
          mediaService.getWatchlist().catch((): number[] => []),
          mediaService.getSeenIds().catch((): number[] => []),
          mediaService.getWatchLater().catch((): number[] => []),
          mediaService.getAllMedia(),
          mediaService.getAllProgress().catch((): MediaProgress[] => []),
          userService.getMe().catch(() => null),
          marathonService.list().catch((): MarathonSummary[] => []),
          userService.getTopTen().catch(() => null)
        ]);

        setFavorites(allData.filter(item => favData.includes(item.id)));
        // Stesso ordine del backend: prima i titoli aggiornati più di recente, in fondo quelli in "Guarda dopo"
        const mediaById = new Map(allData.map(item => [item.id, item]));
        setWatchlist(watchData.flatMap(id => mediaById.get(id) ?? []));
        setSeenIds(seenData);
        setWatchLaterIds(laterData);
        setAllMedia(allData);
        setProgressById(Object.fromEntries(progressData.map(p => [p.mediaId, p])));
        setMarathons(marathonData);
        setTopTen(topTenData);
        if (me) {
          dispatch(setProfile(me));
          setSocial({ followers: me.followers, following: me.following });
        }
      } catch (error) {
        console.error("Errore nel caricamento del profilo", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (isAuthenticated) fetchProfileData();
  }, [isAuthenticated, dispatch, reloadKey]);

  // Solo l'account ufficiale di MARVEList vede quanti sono gli utenti
  const isOfficial = !!profile?.official;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  useEffect(() => {
    if (!isOfficial) return;
    userService.getStats().then(setUserStats).catch(() => setUserStats(null));
  }, [isOfficial]);

  const profileId = profile?.id;

  const saveProfile = async (data: { nickname?: string; avatar?: string }) => {
    setIsSaving(true);
    setProfileError(null);
    try {
      dispatch(setProfile(await userService.updateMe(data)));
      return true;
    } catch (e) {
      const status = isAxiosError(e) ? e.response?.status : undefined;
      setProfileError(status === 403 || status === 404
        ? `Il server ha rifiutato il salvataggio (${status}). Se l'app è stata appena aggiornata riavvia il backend, altrimenti esci e rientra.`
        : errorMessage(e, 'Salvataggio non riuscito. Riprova.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const chooseAvatar = async (avatar: string) => {
    if (await saveProfile({ avatar })) setShowAvatarPicker(false);
  };

  const removeFavorite = async (id: number) => {
    setFavorites(prev => prev.filter(m => m.id !== id));
    try { await mediaService.toggleFavorite(id); } catch (e) { console.error(e); }
  };

  // Film e serie "visti" = solo quelli completati: film visto per intero, serie/stagione con tutti gli episodi.
  // I titoli iniziati (minuti o episodi parziali) non contano qui, ma contano nelle ore di visione.
  const seenMedia = allMedia.filter(m => seenIds.includes(m.id));
  const moviesSeen = seenMedia.filter(m => m.type === 'FILM').length;
  const seriesSeen = seenMedia.filter(m => m.type === 'SERIE_TV').length;

  // Ore di visione: tutto quello che hai guardato, anche a metà —
  // durata dei film completi (o i minuti segnati) + ogni episodio visto (~45 min l'uno)
  const minutesWatched = allMedia.reduce((total, media) => {
    const p = progressById[media.id];
    const seen = seenIds.includes(media.id);
    if (media.type === 'FILM') return total + (seen ? (media.runtime ?? 120) : (p?.minutesWatched ?? 0));
    const episodes = seen ? (media.episodes ?? p?.watchedEpisodes.length ?? 0) : (p?.watchedEpisodes.length ?? 0);
    const partialMinutes = seen ? 0 : Object.values(p?.partialEpisodes ?? {}).reduce((sum, e) => sum + e.minutes, 0);
    return total + episodes * 45 + partialMinutes;
  }, 0);
  const watchedParts = splitWatchTime(minutesWatched); // mesi, giorni, ore, minuti

  const ratingValues = Object.values(progressById).map(p => p.rating).filter((r): r is number => r != null);
  const averageRating = ratingValues.length ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1).replace('.', ',') : '–';

  // Grado: dipende da quanto MCU, MARVEL FAN e MARVEL GOD (già usciti) hai completato
  const rank = computeRank(allMedia, seenIds);

  // Redirezione se non loggato (dopo gli hook, per rispettare le regole di React)
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <SlowLoader text="Accesso agli archivi Stark in corso..." />
    );
  }

  const nickname = profile?.nickname ?? 'Agente';
  const mediaById = new Map(allMedia.map(m => [m.id, m]));
  const topTenEntries = topTen?.items ?? Object.values(progressById)
    .filter(p => p.rating != null)
    .map(p => ({ mediaId: p.mediaId, rating: p.rating as number }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
  const topTenItems = topTenEntries.flatMap(e => {
    const media = mediaById.get(e.mediaId);
    return media ? [{ media, detail: <strong className="top-vote">🛡 {String(e.rating).replace('.', ',')}</strong> }] : [];
  });

  return (
    <div className="container page profile-page">

      <section className="profile-header glass-card">
        <div className="profile-identity">
          <button
            type="button"
            className="profile-avatar-btn"
            onClick={() => setShowAvatarPicker(v => !v)}
            aria-expanded={showAvatarPicker}
            aria-label="Cambia immagine profilo"
            title="Cambia immagine profilo"
          >
            <Avatar avatarId={profile?.avatar} name={nickname} size={96} />
            <span className="profile-avatar-edit" aria-hidden="true">✎</span>
          </button>

          <div className="profile-name-block">
            <div className="profile-name-row">
              <h1 className="profile-name">{nickname}</h1>
              {/* Il grado sta a destra del nickname */}
              <RankBadge rank={rank} />
            </div>
            {rank.next && (
              <div className="rank-next">
                <span className="rank-next-bar"><span style={{ width: `${Math.round(rank.next.progress * 100)}%` }} /></span>
                <span>Prossimo grado: <strong>{rank.next.title}</strong> · {rank.next.missing === 1 ? 'manca 1 titolo' : `mancano ${rank.next.missing} titoli`}</span>
              </div>
            )}
            {profile?.email && <span className="profile-email">{profile.email}</span>}
            <div className="social-counts">
              <button type="button" className="social-count" onClick={() => setPeopleTab('followers')} disabled={!profileId}>
                <strong>{social?.followers ?? 0}</strong><span>Follower</span>
              </button>
              <button type="button" className="social-count" onClick={() => setPeopleTab('following')} disabled={!profileId}>
                <strong>{social?.following ?? 0}</strong><span>Seguiti</span>
              </button>
              <button type="button" className="social-find" onClick={() => setPeopleTab('search')} disabled={!profileId}>
                <span aria-hidden="true">⌕</span> Trova utenti
              </button>
              <button type="button" className="social-find profile-edit-btn" onClick={() => setShowEditProfile(true)} disabled={!profile}>
                <span aria-hidden="true">✎</span> Modifica profilo
              </button>
            </div>
          </div>
        </div>

        {profileError && <p className="form-error" role="alert">{profileError}</p>}

        {showAvatarPicker && (
          <div className="avatar-picker">
            <p className="section-label">Scegli la tua immagine profilo</p>
            {AVATAR_GROUPS.filter(group => !group.onlyFor || profile?.email?.toLowerCase() === group.onlyFor).map(group => (
              <div key={group.title} className="avatar-group">
                <h3 className="avatar-group-title">{group.title}</h3>
                <div className="avatar-grid">
                  {group.ids.map(id => AVATARS.find(a => a.id === id)).filter(a => a !== undefined).map(a => (
                    <button
                      key={a.id}
                      type="button"
                      className={`avatar-option ${profile?.avatar === a.id ? 'selected' : ''}`}
                      onClick={() => chooseAvatar(a.id)}
                      disabled={isSaving}
                      aria-pressed={profile?.avatar === a.id}
                    >
                      <Avatar avatarId={a.id} size={64} />
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stats-grid" aria-label="Rapporto missioni">
        <div className="stat-tile"><span className="stat-value text-accent">{moviesSeen}</span><span className="stat-label">Film visti per intero</span></div>
        <div className="stat-tile"><span className="stat-value text-gold">{seriesSeen}</span><span className="stat-label">Serie e stagioni complete</span></div>
        <div className="stat-tile"><span className="stat-value stat-time text-info-soft" style={{ '--parts': watchedParts.length } as React.CSSProperties} aria-label={speakWatchTime(minutesWatched)}>
            {watchedParts.map(p => <span key={p.unit} aria-hidden="true">{p.value}<small>{p.unit}</small></span>)}
          </span><span className="stat-label">Ore di visione</span></div>
        <div className="stat-tile"><span className="stat-value">{averageRating}</span><span className="stat-label">Voto medio</span></div>
      </section>

      {isOfficial && userStats && (
        <section className="profile-section">
          <div className="section-heading">
            <h2 className="section-title">Utenti di MARVEList</h2>
            <span className="section-hint">Visibile solo a questo account</span>
          </div>
          <div className="stats-grid stats-grid-3" aria-label="Utenti di MARVEList">
            <div className="stat-tile"><span className="stat-value text-accent">{userStats.active}</span><span className="stat-label">Utenti attivi</span></div>
            <div className="stat-tile"><span className="stat-value text-gold">{userStats.watching}</span><span className="stat-label">Hanno segnato almeno un titolo</span></div>
            <div className="stat-tile"><span className="stat-value text-info-soft">{userStats.pending}</span><span className="stat-label">In attesa di conferma</span></div>
          </div>
        </section>
      )}

      {/* MARATONE: all'inizio c'è solo la card per crearne una */}
      <section className="profile-section">
        <div className="section-heading">
          <h2 className="section-title">Le tue maratone</h2>
          {marathons.length > 0 && <span className="section-hint">{marathons.length} {marathons.length === 1 ? 'maratona' : 'maratone'}</span>}
        </div>
        <div className="marathon-grid">
          <Link to="/marathons/new" className="marathon-card marathon-card-create">
            <span className="marathon-create-icon" aria-hidden="true">+</span>
            <span className="marathon-create-label">Crea la tua maratona</span>
            <span className="marathon-create-hint">Scegli i titoli, le date e il ritmo: al calendario pensiamo noi</span>
          </Link>

          {marathons.map(m => {
            const percent = m.totalUnits ? Math.round((m.doneUnits / m.totalUnits) * 100) : 0;
            const bg = getBackgroundUrl(m.background);
            const completed = m.doneUnits >= m.totalUnits;
            return (
              <Link key={m.id} to={`/marathons/${m.id}`} className="marathon-card">
                <div className="marathon-card-media" style={bg ? { backgroundImage: `url("${bg}")` } : undefined} />
                <div className="marathon-card-content">
                  <div>
                    <h3>{m.name}</h3>
                    <span className="marathon-card-dates">{formatDay(m.startDate)} → {formatDay(m.expectedEnd ?? m.endDate)}</span>
                  </div>
                  <div className="marathon-card-footer">
                    {completed
                      ? <span className="chip chip-success">✔ Completata</span>
                      : !m.feasible
                        ? <span className="chip chip-accent">⚠ In ritardo</span>
                        : m.nextDate && <span className="chip">Prossimo: {dayLabel(m.nextDate)}</span>}
                    <span className="marathon-card-percent">{percent}%</span>
                  </div>
                </div>
                <span className="marathon-card-progress"><span style={{ width: `${percent}%` }} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CONTINUA A GUARDARE (watchlist automatica) */}
      <section className="profile-section">
        <div className="section-heading">
          <h2 className="section-title">Continua a guardare</h2>
          <span className="section-hint">Si aggiorna da sola quando inizi un film o guardi un episodio</span>
        </div>
        {watchlist.length === 0 ? (
          <div className="empty-box">
            Nessun titolo in corso. Apri un film o una serie dalla <Link to="/timeline">Timeline</Link> e segna i minuti o gli episodi visti.
          </div>
        ) : (
          <div className="media-grid media-row" aria-label="Continua a guardare">
            {watchlist.map(item => (
              <MediaCard key={item.id} media={item} watchLater={watchLaterIds.includes(item.id)} rating={progressById[item.id]?.rating} progress={getProgressPercent(item, progressById[item.id])} />
            ))}
          </div>
        )}
      </section>

      <section className="profile-section">
        <div className="section-heading">
          <div className="top-ten-heading">
            <h2 className="section-title">La tua Top 10</h2>
            {topTen?.needsConfirmation && (
              <button type="button" className="top-ten-cup" onClick={() => setShowTopTenConfirm(true)} aria-label="Conferma la tua Top 10: scegli l'ordine dei titoli con lo stesso voto" title="Conferma la tua Top 10">
                <span aria-hidden="true">🏆</span>
              </button>
            )}
          </div>
          <span className="section-hint">{topTen?.needsConfirmation ? 'Hai titoli con lo stesso voto: tocca la coppa e scegli' : 'I titoli a cui hai dato il voto più alto'}</span>
        </div>
        <TopList
          items={topTenItems}
          size={10}
          label="La tua Top 10"
          empty={<>Non hai ancora votato nessun titolo. Apri un film o una serie dalla <Link to="/timeline">Timeline</Link> e votalo con gli scudi: i tuoi preferiti finiscono qui.</>}
        />
      </section>

      <section className="profile-section">
        <div className="section-heading">
          <h2 className="section-title">I tuoi preferiti</h2>
          {favorites.length > 0 && <span className="section-hint">{favorites.length === 1 ? '1 titolo' : `${favorites.length} titoli`}</span>}
        </div>
        {favorites.length === 0 ? (
          <div className="empty-box">Non hai ancora aggiunto preferiti. Tocca il ♥ su una locandina.</div>
        ) : (
          <div className="media-grid media-row" aria-label="I tuoi preferiti">
            {favorites.map(item => (
              <MediaCard
                key={item.id}
                media={item}
                favorite
                seen={seenIds.includes(item.id)}
                watchLater={watchLaterIds.includes(item.id)}
                rating={progressById[item.id]?.rating}
                progress={seenIds.includes(item.id) ? 100 : getProgressPercent(item, progressById[item.id]) || null}
                onToggleFavorite={() => removeFavorite(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {showTopTenConfirm && topTen?.needsConfirmation && (
        <TopTenConfirm
          topTen={topTen}
          mediaById={mediaById}
          onClose={() => setShowTopTenConfirm(false)}
          onSaved={saved => { setTopTen(saved); setShowTopTenConfirm(false); }}
        />
      )}

      {showEditProfile && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onDataChanged={() => setReloadKey(k => k + 1)}
        />
      )}

      {peopleTab && profileId && (
        <PeopleModal
          key={peopleTab}
          userId={profileId}
          initialTab={peopleTab}
          allowSearch
          onClose={() => setPeopleTab(null)}
          onFollowChange={s => setSocial(prev => prev && { ...prev, following: Math.max(0, prev.following + (s.following ? 1 : -1)) })}
        />
      )}
    </div>
  );
};

export default Profile;
