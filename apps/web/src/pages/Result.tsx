import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { fmtTime } from '../format';

type Q = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean;
};
type SectionScore = { title: string; weight: number; correct: number; total: number };
type ResultData = {
  id: string;
  title: string;
  difficulty: string;
  score: number;
  total: number;
  timeTakenSec: number;
  timeLimitSec: number | null;
  timerEnabled: boolean;
  createdAt: string;
  sectionBreakdown: SectionScore[];
  questions: Q[];
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}

function barColor(pct: number) {
  return pct >= 70 ? 'var(--emerald)' : pct >= 40 ? 'var(--amber)' : 'var(--rose)';
}

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
  const color = barColor(pct);
  const timed = data.timeLimitSec || data.timerEnabled;

  function exportCsv() {
    if (!data) return;
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ['#', 'Question', 'Your answer', 'Correct answer', 'Result'],
      ...data.questions.map((q, i) => [
        String(i + 1),
        q.text,
        q.selectedIndex !== null ? q.options[q.selectedIndex] : '(no answer)',
        q.options[q.correctIndex],
        q.isCorrect ? 'Correct' : 'Incorrect',
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/[^\w-]+/g, '_')}_result.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Link to="/" className="back no-print">← Back to exams</Link>
      <div className="page-head">
        <div>
          <h1>{data.title}</h1>
          <p>Result · {new Date(data.createdAt).toLocaleString()}</p>
        </div>
        <div className="card-actions no-print" style={{ margin: 0 }}>
          <button className="btn-ghost" onClick={exportCsv}>⭳ CSV</button>
          <button className="btn-ghost" onClick={() => window.print()}>⎙ PDF</button>
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

        <div className="meta-grid">
          <Meta label="Marks" value={`${data.score} / ${data.total}`} />
          <Meta label="Score" value={`${pct}%`} />
          <Meta label="Difficulty" value={data.difficulty} />
          {timed && <Meta label="Time taken" value={fmtTime(data.timeTakenSec)} />}
          {data.timeLimitSec && (
            <Meta label="Time limit" value={fmtTime(data.timeLimitSec)} />
          )}
          <Meta label="Submitted" value={new Date(data.createdAt).toLocaleString()} />
        </div>
      </div>

      {data.sectionBreakdown.length > 1 && (
        <div className="card">
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Section breakdown</h2>
          {data.sectionBreakdown.map((s, i) => {
            const spct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <div className="break-row" key={i}>
                <span className="name" title={s.title}>{s.title}</span>
                <div className="break-bar">
                  <div style={{ width: `${spct}%`, background: barColor(spct) }} />
                </div>
                <span className="val">
                  {s.correct}/{s.total}
                </span>
              </div>
            );
          })}
        </div>
      )}

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
          {q.selectedIndex === null && (
            <p className="muted" style={{ margin: '8px 0 0' }}>You didn't answer this one.</p>
          )}
        </div>
      ))}
    </>
  );
}
