import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

type Question = { id: string; text: string; options: string[] };
type Exam = { id: string; title: string; difficulty: string; questions: Question[] };
type Attempt = { id: string; score: number; total: number; createdAt: string };

export default function TakeExam() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getExam(id).then(setExam).catch((e) => setError(e.message));
    api.listAttempts(id).then(setAttempts).catch(() => {});
  }, [id]);

  async function submit() {
    if (!exam) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));
      const { attemptId } = await api.submit(exam.id, payload);
      nav(`/result/${attemptId}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (error && !exam) return <p className="error">{error}</p>;
  if (!exam) return <p className="muted">Loading exam…</p>;

  const answered = Object.keys(answers).length;
  const total = exam.questions.length;
  const allAnswered = answered === total;

  return (
    <>
      <Link to="/" className="back">← Back to exams</Link>
      <div className="page-head">
        <div>
          <h1>{exam.title}</h1>
          <p>
            <span className={`badge ${exam.difficulty}`}>{exam.difficulty}</span>
          </p>
        </div>
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
          {allAnswered ? 'All questions answered' : `${total - answered} left`}
        </span>
        <button onClick={submit} disabled={submitting || !allAnswered}>
          {submitting ? <span className="spinner" /> : 'Submit exam'}
        </button>
      </div>
    </>
  );
}
