import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

// Resolves a share code to an exam and forwards to the take page.
export default function SharedEntry() {
  const { code } = useParams();
  const nav = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    api
      .resolveShared(code)
      .then((exam: { id: string }) => nav(`/exam/${exam.id}`, { replace: true }))
      .catch((e) => setError(e.message));
  }, [code]);

  if (error) {
    return (
      <div className="card empty">
        <div className="emoji">🔗</div>
        <h2>Link not available</h2>
        <p className="muted">{error}</p>
        <Link to="/" className="btn" style={{ marginTop: 14 }}>
          Go to your exams
        </Link>
      </div>
    );
  }

  return <p className="muted">Opening shared exam…</p>;
}
