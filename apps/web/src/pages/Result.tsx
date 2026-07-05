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

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading result…</p>;

  const pct = Math.round((data.score / data.total) * 100);
  const color = pct >= 70 ? 'var(--emerald)' : pct >= 40 ? 'var(--amber)' : 'var(--rose)';

  return (
    <>
      <Link to="/" className="back">← Back to exams</Link>
      <div className="page-head">
        <div>
          <h1>{data.title}</h1>
          <p>Result · {new Date(data.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <div className="score-hero">
          <div
            className="ring"
            style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, var(--border) 0)` }}
          >
            <div style={{ color }}>{pct}%</div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {data.score} / {data.total} correct
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {pct >= 70
                ? 'Great work! 🎉'
                : pct >= 40
                  ? 'Getting there — review the misses below.'
                  : 'Keep practicing — review the answers below.'}
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ margin: '24px 0 12px' }}>Answer review</h2>
      {data.questions.map((q, i) => (
        <div className="card" key={q.id}>
          <div className="q-num">
            QUESTION {i + 1} · {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </div>
          <div className="q-text">{q.text}</div>
          {q.options.map((opt, oi) => {
            const isCorrect = oi === q.correctIndex;
            const isSelected = oi === q.selectedIndex;
            const cls = isCorrect
              ? 'result-correct'
              : isSelected
                ? 'result-wrong'
                : 'result-plain';
            return (
              <div className={`option ${cls}`} key={oi}>
                {opt}
                {isCorrect && <span className="tag ok">Correct answer</span>}
                {isSelected && !isCorrect && <span className="tag bad">Your answer</span>}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
