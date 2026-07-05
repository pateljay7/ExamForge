import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

type Q = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean;
};
type ResultData = {
  id: string;
  title: string;
  score: number;
  total: number;
  createdAt: string;
  questions: Q[];
};

export default function Result() {
  const { attemptId } = useParams();
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!attemptId) return;
    api.getResult(attemptId).then(setData).catch((e) => setError(e.message));
  }, [attemptId]);

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!data) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <Link to="/">← Back</Link>
      <h1>{data.title} — Result</h1>
      <div className="card">
        <strong style={{ fontSize: '1.3rem' }}>
          Score: {data.score} / {data.total}
        </strong>
        <div className="muted">
          {Math.round((data.score / data.total) * 100)}% ·{' '}
          {new Date(data.createdAt).toLocaleString()}
        </div>
      </div>

      {data.questions.map((q, i) => (
        <div className="card" key={q.id}>
          <strong>
            {i + 1}. {q.text}{' '}
            <span className={q.isCorrect ? 'correct' : 'wrong'}>
              {q.isCorrect ? '✓' : '✗'}
            </span>
          </strong>
          {q.options.map((opt, oi) => {
            const isCorrect = oi === q.correctIndex;
            const isSelected = oi === q.selectedIndex;
            return (
              <div
                className="option"
                key={oi}
                style={{
                  color: isCorrect ? '#15803d' : isSelected ? '#b91c1c' : undefined,
                  fontWeight: isCorrect || isSelected ? 600 : 400,
                }}
              >
                {opt}
                {isCorrect && ' ✓ correct'}
                {isSelected && !isCorrect && ' ← your answer'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
