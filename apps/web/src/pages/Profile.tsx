import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { fmtTime } from '../format';
import TrendChart from '../components/TrendChart';

type Recent = {
  id: string;
  score: number;
  total: number;
  timeTakenSec: number;
  createdAt: string;
  exam: { id: string; title: string };
};
type Stats = {
  examCount: number;
  attemptCount: number;
  avgScore: number;
  bestScore: number;
  streak: number;
  recent: Recent[];
};

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Loading profile…</p>;

  // `recent` is newest-first; chart wants chronological order.
  const points = [...stats.recent]
    .reverse()
    .map((a) => ({
      pct: a.total ? Math.round((a.score / a.total) * 100) : 0,
      label: new Date(a.createdAt).toLocaleDateString(),
    }));

  const src = (user?.name || user?.email || '?').trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  const initials =
    ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || src[0].toUpperCase();

  return (
    <>
      <div className="profile-head">
        <div className="profile-avatar">{initials}</div>
        <div>
          <h1>{user?.name || 'Your profile'}</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>{user?.email}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="num">{stats.examCount}</div>
          <div className="lbl">Exams created</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.attemptCount}</div>
          <div className="lbl">Attempts taken</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.avgScore}%</div>
          <div className="lbl">Average score</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.bestScore}%</div>
          <div className="lbl">Best score</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.streak}🔥</div>
          <div className="lbl">Day streak</div>
        </div>
      </div>

      {points.length >= 2 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>Score trend</h2>
          <TrendChart points={points} />
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Recent attempts</h2>
        {stats.recent.length === 0 && (
          <p className="muted">No attempts yet — take an exam to get started.</p>
        )}
        {stats.recent.map((a) => (
          <div className="attempt-row" key={a.id}>
            <div>
              <Link to={`/result/${a.id}`} style={{ fontWeight: 600 }}>
                {a.exam.title}
              </Link>
              <div className="muted" style={{ fontSize: '0.82rem' }}>
                {new Date(a.createdAt).toLocaleString()}
                {a.timeTakenSec > 0 && ` · ${fmtTime(a.timeTakenSec)}`}
              </div>
            </div>
            <Link to={`/result/${a.id}`} className="pill-score">
              {a.score}/{a.total}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
