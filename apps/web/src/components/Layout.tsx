import { ReactNode, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Brand from './Brand';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

const I = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  create: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 8 6 12l4 4M6 12h11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function initials(name?: string, email?: string) {
  const src = (name || email || '?').trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || src[0].toUpperCase();
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(currentTheme);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  }

  const links = [
    { to: '/', ico: I.dashboard, label: 'Dashboard' },
    { to: '/create', ico: I.create, label: 'New Exam' },
    { to: '/profile', ico: I.profile, label: 'Profile' },
  ];

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <Brand />
        </Link>
        <div className="side-section">Menu</div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <span className="ico">{l.ico}</span>
            {l.label}
          </NavLink>
        ))}
        <div className="side-spacer" />
        <div className="side-footer">
          <button className="side-btn" onClick={toggleTheme}>
            <span className="ico">{theme === 'dark' ? I.sun : I.moon}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="side-user" title={user?.email}>
            <span className="side-avatar">{initials(user?.name, user?.email)}</span>
            <span className="who">{user?.name || user?.email}</span>
          </div>
          <button
            className="side-btn"
            onClick={() => {
              logout();
              nav('/login');
            }}
          >
            <span className="ico">{I.logout}</span>
            Log out
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="hamburger" onClick={() => setOpen(true)}>☰</button>
          <Link to="/" className="brand">
            <Brand />
          </Link>
          <span style={{ width: 44 }} />
        </div>
        <main className="container">{children}</main>
      </div>
    </div>
  );
}
