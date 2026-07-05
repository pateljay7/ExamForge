import { ReactNode, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
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
    { to: '/', ico: '▦', label: 'Dashboard' },
    { to: '/create', ico: '＋', label: 'New Exam' },
    { to: '/profile', ico: '◎', label: 'Profile' },
  ];

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">✎</span>
          ExamForge
        </Link>
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
            <span className="ico">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="side-user" title={user?.email}>
            {user?.name || user?.email}
          </div>
          <button
            className="side-btn"
            onClick={() => {
              logout();
              nav('/login');
            }}
          >
            <span className="ico">⇥</span>
            Log out
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="hamburger" onClick={() => setOpen(true)}>☰</button>
          <Link to="/" className="brand">
            <span className="brand-mark">✎</span>
            ExamForge
          </Link>
          <span style={{ width: 44 }} />
        </div>
        <main className="container">{children}</main>
      </div>
    </div>
  );
}
