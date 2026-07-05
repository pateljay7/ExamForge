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

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!exam) return <div className="container">Loading…</div>;

  const answered = Object.keys(answers).length;

  return (
    <div className="container">
      <Link to="/">← Back</Link>
      <h1>{exam.title}</h1>

      {attempts.length > 0 && (
        <div className="card">
          <strong>Previous attempts</strong>
          {attempts.map((a) => (
            <div className="row" key={a.id} style={{ marginTop: 6 }}>
              <span className="muted">
                {new Date(a.createdAt).toLocaleString()}
              </span>
              <Link to={`/result/${a.id}`}>
                {a.score}/{a.total}
              </Link>
            </div>
          ))}
        </div>
      )}

      {exam.questions.map((q, i) => (
        <div className="card" key={q.id}>
          <strong>
            {i + 1}. {q.text}
          </strong>
          {q.options.map((opt, oi) => (
            <label className="option" key={oi}>
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
      <button
        onClick={submit}
        disabled={submitting || answered < exam.questions.length}
      >
        {submitting
          ? 'Submitting…'
          : `Submit (${answered}/${exam.questions.length} answered)`}
      </button>
    </div>
  );
}
