import { Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export default function Header() {
  const { isGuest } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? 'header-nav-link active' : 'header-nav-link';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/home" className="header-logo" id="header-logo">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,8 56,52 8,52" fill="#1a1a2e" stroke="#c84b31" strokeWidth="3" strokeLinejoin="round"/>
            <polygon points="32,20 46,48 18,48" fill="none" stroke="#f0ece2" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5"/>
          </svg>
          <span className="header-logo-text">Peak<span>Guesser</span></span>
        </Link>

        <nav className="header-nav" id="header-nav">
          <Link to="/home" className={isActive('/home')} id="nav-home">Home</Link>
          <Link to="/ranking" className={isActive('/ranking')} id="nav-ranking">Ranking</Link>
          {!isGuest && (
            <Link to="/profile" className={isActive('/profile')} id="nav-profile">Profile</Link>
          )}
        </nav>

        <div className="header-user">
          {isGuest && (
            <Link to="/" className="btn-ghost" style={{ fontSize: 'var(--fs-sm)' }} id="header-login">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
