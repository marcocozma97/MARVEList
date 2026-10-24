import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { logoutSuccess, setProfile } from '../store/authSlice';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { HIDDEN_NAVBAR_PATHS } from '../utils/navigation';
import Avatar from './Avatar';
import Brand from './Brand';

const Navbar = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !profile) {
      userService.getMe().then(me => dispatch(setProfile(me))).catch(console.error);
    }
  }, [isAuthenticated, profile, dispatch]);

  const handleLogout = () => {
    dispatch(logoutSuccess());
    authService.logout();
    navigate('/login');
  };

  if (HIDDEN_NAVBAR_PATHS.includes(location.pathname)) {
    return null;
  }

  const linkClass = ({ isActive }: { isActive: boolean }) => `site-nav-link ${isActive ? 'active' : ''}`;
  // Le maratone si aprono dal profilo: anche lì "Profilo" resta evidenziato
  const isProfileArea = location.pathname.startsWith('/profile') || location.pathname.startsWith('/marathons');

  return (
    <nav className={`site-nav ${menuOpen ? 'menu-open' : ''}`} aria-label="Navigazione principale">
      <div className="container site-nav-inner">
        <Link className="site-brand" to="/timeline" aria-label="MARVEList, vai alla Timeline">
          <Brand size="sm" />
        </Link>

        <button
          className="site-nav-toggle"
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-expanded={menuOpen}
          aria-controls="site-nav-menu"
          aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
        >
          <span /><span /><span />
        </button>

        {/* Qualsiasi click su un link (o su Esci) chiude il menu mobile */}
        <div className="site-nav-menu" id="site-nav-menu" onClick={() => setMenuOpen(false)}>
          <NavLink className={linkClass} to="/timeline">Timeline</NavLink>
          <NavLink className={linkClass} to="/road-to">Road To</NavLink>
          <NavLink className={linkClass} to="/news">News</NavLink>
          <NavLink className={linkClass} to="/faq">FAQ</NavLink>
          <NavLink className={({ isActive }) => `site-nav-jairvis ${isActive ? 'active' : ''}`} to="/jairvis">J.A.I.R.V.I.S.</NavLink>

          {isAuthenticated ? (
            <div className="site-nav-user">
              {/* Avatar e scritta "Profilo" sono un unico link: qualsiasi punto si tocchi porta al profilo */}
              <Link
                to="/profile"
                className={`site-nav-profile ${isProfileArea ? 'active' : ''}`}
                aria-current={location.pathname === '/profile' ? 'page' : undefined}
              >
                <Avatar avatarId={profile?.avatar} name={profile?.nickname ?? ''} size={32} />
                <span>Profilo</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost btn-sm-pill">Esci</button>
            </div>
          ) : (
            <Link to="/login" className="btn-marvel btn-inline btn-sm-pill">Accedi</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
