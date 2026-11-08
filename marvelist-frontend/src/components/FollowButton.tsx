import { useState } from 'react';
import { userService, type FollowState } from '../services/userService';

interface FollowButtonProps {
  userId: number;
  following: boolean;
  onChange?: (state: FollowState) => void;
  small?: boolean;
}

const FollowButton = ({ userId, following, onChange, small = false }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(following);
  const [isBusy, setIsBusy] = useState(false);

  const toggle = async () => {
    setIsBusy(true);
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      const state = next ? await userService.follow(userId) : await userService.unfollow(userId);
      setIsFollowing(state.following);
      onChange?.(state);
    } catch {
      setIsFollowing(!next);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`follow-btn ${isFollowing ? 'is-following' : ''} ${small ? 'is-small' : ''}`}
      onClick={toggle}
      disabled={isBusy}
      aria-pressed={isFollowing}
    >
      <span className="follow-btn-idle">{isFollowing ? 'Segui già' : 'Segui'}</span>
      {isFollowing && <span className="follow-btn-hover" aria-hidden="true">Non seguire</span>}
    </button>
  );
};

export default FollowButton;
