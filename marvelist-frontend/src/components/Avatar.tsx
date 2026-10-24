import { AVATARS } from '../utils/avatars';

interface AvatarProps {
  avatarId?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

// Avatar circolare: emblema scelto, oppure le iniziali del nickname se non ne è stato scelto uno
const Avatar = ({ avatarId, name = '', size = 40, className = '' }: AvatarProps) => {
  const avatar = AVATARS.find(a => a.id === avatarId);
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size }} aria-label={avatar?.label ?? name} role="img">
      {avatar ? (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">{avatar.svg}</svg>
      ) : (
        <span className="avatar-initials" style={{ fontSize: size * 0.4 }}>{initials}</span>
      )}
    </span>
  );
};

export default Avatar;
