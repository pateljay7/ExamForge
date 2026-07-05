import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">✎</span>
            ExamForge
          </Link>
          {user && (
            <div className="nav-user">
              <span className="who">{user.name || user.email}</span>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout();
                  nav('/login');
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
