import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Brand from '../components/Brand';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav(from || '/');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <Link to="/login" className="brand">
          <Brand />
        </Link>
        <div className="auth-hero">
          <h2>Turn any material into a mastery-building exam.</h2>
          <p>Paste your notes, generate a tailored MCQ exam, and track your progress over time.</p>
          <ul className="auth-points">
            <li><span className="tick">✦</span> AI-written questions from your own content</li>
            <li><span className="tick">✓</span> Timed practice with resume &amp; auto-submit</li>
            <li><span className="tick">↗</span> Score trends, streaks &amp; detailed reviews</li>
          </ul>
        </div>
        <div className="auth-foot">© ExamForge — study smarter.</div>
      </aside>

      <div className="auth-main">
      <div className="card auth-card">
        <Link to="/login" className="brand">
          <Brand />
        </Link>
        <h1 style={{ textAlign: 'center', margin: '18px 0 2px' }}>Welcome back</h1>
        <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
          Log in to your exams and results.
        </p>
        <form onSubmit={submit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button className="btn-block btn-lg" disabled={loading} style={{ marginTop: 18 }}>
            {loading ? <span className="spinner" /> : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
