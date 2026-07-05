import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name || undefined);
      nav(from || '/');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <Link to="/login" className="brand">
          <span className="brand-mark">✎</span>
          ExamForge
        </Link>
        <h1 style={{ textAlign: 'center', margin: '14px 0 2px' }}>Create account</h1>
        <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
          Turn your notes into practice exams.
        </p>
        <form onSubmit={submit}>
          <label>Name <span className="muted">(optional)</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <p className="hint">At least 6 characters.</p>
          {error && <p className="error">{error}</p>}
          <button className="btn-block btn-lg" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
