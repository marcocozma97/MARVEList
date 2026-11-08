import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { userService, type FollowState, type UserCard } from '../services/userService';
import Avatar from './Avatar';
import FollowButton from './FollowButton';

export type PeopleTab = 'followers' | 'following' | 'search';

interface PeopleModalProps {
  userId: number;
  initialTab: PeopleTab;
  allowSearch?: boolean;
  onClose: () => void;
  onFollowChange?: (state: FollowState) => void;
}

const TAB_LABELS: Record<PeopleTab, string> = { followers: 'Follower', following: 'Seguiti', search: 'Cerca' };

const PeopleList = ({ people, empty, onClose, onFollowChange }: { people: UserCard[] | null; empty: string; onClose: () => void; onFollowChange?: (state: FollowState) => void }) => {
  if (people === null) return <div className="cm-loading" aria-busy="true"><span /><span /></div>;
  if (people.length === 0) return <p className="people-empty">{empty}</p>;
  return (
    <ul className="people-list">
      {people.map(p => (
        <li key={p.id} className="people-row">
          <Link to={p.me ? '/profile' : `/users/${p.id}`} className="people-link" onClick={onClose}>
            <Avatar avatarId={p.avatar} name={p.nickname} size={42} />
            <span className="people-name">{p.nickname}</span>
          </Link>
          {p.me ? <span className="cm-you">Tu</span> : <FollowButton userId={p.id} following={p.followedByMe} onChange={onFollowChange} small />}
        </li>
      ))}
    </ul>
  );
};

const PeopleModal = ({ userId, initialTab, allowSearch = false, onClose, onFollowChange }: PeopleModalProps) => {
  const [tab, setTab] = useState<PeopleTab>(initialTab);
  const [lists, setLists] = useState<Partial<Record<'followers' | 'following', UserCard[]>>>({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ query: string; people: UserCard[] } | null>(null);

  useEffect(() => {
    if (tab === 'search' || lists[tab]) return;
    const load = tab === 'followers' ? userService.followers : userService.following;
    load(userId).then(people => setLists(prev => ({ ...prev, [tab]: people }))).catch(() => setLists(prev => ({ ...prev, [tab]: [] })));
  }, [tab, userId, lists]);

  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    const timer = window.setTimeout(() => {
      userService.search(trimmed).then(people => setResults({ query: trimmed, people })).catch(() => setResults({ query: trimmed, people: [] }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const tabs: PeopleTab[] = allowSearch ? ['followers', 'following', 'search'] : ['followers', 'following'];

  return createPortal(
    <div className="people-backdrop" onClick={onClose}>
      <div className="people-modal" role="dialog" aria-modal="true" aria-label={TAB_LABELS[tab]} onClick={(e) => e.stopPropagation()}>
        <div className="people-head">
          <div className="segmented people-tabs" role="tablist">
            {tabs.map(t => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className={`segmented-option ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <div className="people-body">
          {tab === 'search' ? (
            <>
              <div className="search-wrap people-search">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Cerca per nickname…"
                  aria-label="Cerca utenti per nickname"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              {trimmed.length < 2
                ? <p className="people-empty">Scrivi almeno 2 lettere del nickname.</p>
                : <PeopleList people={results?.query === trimmed ? results.people : null} empty="Nessun utente trovato." onClose={onClose} onFollowChange={onFollowChange} />}
            </>
          ) : (
            <PeopleList
              people={lists[tab] ?? null}
              empty={tab === 'followers' ? 'Ancora nessun follower.' : 'Non segue ancora nessuno.'}
              onClose={onClose}
              onFollowChange={onFollowChange}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PeopleModal;
