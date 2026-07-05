import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { fmtTime } from '../format';

type Question = { id: string; text: string; options: string[] };
type Exam = {
  id: string;
  title: string;
  difficulty: string;
  timeLimitSec: number | null;
  timerEnabled: boolean;
  questions: Question[];
};
type Attempt = { id: string; score: number; total: number; createdAt: string };

export default function TakeExam() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    api.getExam(id).then(setExam).catch((e) => setError(e.message));
    api.listAttempts(id).then(setAttempts).catch(() => {});
  }, [id]);

  const timed = !!(exam && (exam.timeLimitSec || exam.timerEnabled));

  // Tick the clock once the exam (with timing) is loaded.
  useEffect(() => {
    if (!timed) return;
    startRef.current = Date.now();
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current!) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [timed]);

  async function submit() {
    if (!exam || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));
      const { attemptId } = await api.submit(exam.id, payload, timed ? elapsed : 0);
      nav(`/result/${attemptId}`);
    } catch (e: any) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(e.message);
    }
  }

  // Auto-submit when the preset limit is reached.
  const overLimit = !!(exam?.timeLimitSec && elapsed >= exam.timeLimitSec);
  useEffect(() => {
    if (overLimit) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overLimit]);

  if (error && !exam) return <p className="error">{error}</p>;
  if (!exam) return <p className="muted">Loading exam…</p>;

  const answered = Object.keys(answers).length;
  const total = exam.questions.length;
  const remaining = exam.timeLimitSec ? exam.timeLimitSec - elapsed : 0;
  const low = exam.timeLimitSec ? remaining <= 30 : false;

  return (
    <>
      <Link to="/" className="back">← Back to exams</Link>
      <div className="page-head">
        <div>
          <h1>{exam.title}</h1>
          <p><span className={`badge ${exam.difficulty}`}>{exam.difficulty}</span></p>
        </div>
        {exam.timeLimitSec ? (
          <div className={`timer ${low ? 'low' : ''}`}>
            <span className="muted">Time left</span>
            <strong>{fmtTime(Math.max(0, remaining))}</strong>
          </div>
        ) : exam.timerEnabled ? (
          <div className="timer">
            <span className="muted">Elapsed</span>
            <strong>{fmtTime(elapsed)}</strong>
          </div>
        ) : null}
      </div>

      {attempts.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 6 }}>Past attempts</h2>
          {attempts.map((a) => (
            <div className="attempt-row" key={a.id}>
              <span className="muted">{new Date(a.createdAt).toLocaleString()}</span>
              <Link to={`/result/${a.id}`} className="pill-score">
                {a.score}/{a.total}
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="progress-bar" style={{ marginTop: 8 }}>
        <div style={{ width: `${(answered / total) * 100}%` }} />
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        {answered} of {total} answered
      </p>

      {exam.questions.map((q, i) => (
        <div className="card" key={q.id}>
          <div className="q-num">QUESTION {i + 1}</div>
          <div className="q-text">{q.text}</div>
          {q.options.map((opt, oi) => (
            <label
              className={`option ${answers[q.id] === oi ? 'selected' : ''}`}
              key={oi}
            >
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === oi}
                onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      {error && <p className="error">{error}</p>}

      <div className="submit-bar">
        <span className="muted">
          {answered === total ? 'All questions answered' : `${total - answered} unanswered`}
        </span>
        <button onClick={() => submit()} disabled={submitting}>
          {submitting ? <span className="spinner" /> : 'Submit exam'}
        </button>
      </div>
    </>
  );
}
