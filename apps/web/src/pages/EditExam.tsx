import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

type Q = {
  id: string;
  sectionIndex: number;
  text: string;
  options: string[];
  correctIndex: number;
};
type SectionMeta = { title?: string; content: string; weight: number };
type Full = {
  id: string;
  title: string;
  difficulty: string;
  status: string;
  sections: SectionMeta[];
  questions: Q[];
};

export default function EditExam() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState<Full | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(''); // qid currently saving/regenerating
  const [savedId, setSavedId] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getExamFull(id).then(setExam).catch((e) => setError(e.message));
  }, [id]);

  function patch(qid: string, p: Partial<Q>) {
    setExam((ex) =>
      ex
        ? { ...ex, questions: ex.questions.map((q) => (q.id === qid ? { ...q, ...p } : q)) }
        : ex,
    );
  }

  function flash(qid: string) {
    setSavedId(qid);
    setTimeout(() => setSavedId((cur) => (cur === qid ? '' : cur)), 2000);
  }

  async function save(q: Q) {
    if (!exam) return;
    setBusy(q.id);
    setError('');
    try {
      await api.updateQuestion(exam.id, q.id, {
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
      });
      flash(q.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function regenerate(qid: string) {
    if (!exam) return;
    setBusy(qid);
    setError('');
    try {
      const fresh = await api.regenerateQuestion(exam.id, qid);
      patch(qid, fresh);
      flash(qid);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function publish() {
    if (!exam) return;
    setPublishing(true);
    setError('');
    try {
      await api.publish(exam.id);
      nav(`/exam/${exam.id}`);
    } catch (e: any) {
      setError(e.message);
      setPublishing(false);
    }
  }

  if (error && !exam) return <p className="error">{error}</p>;
  if (!exam) return <p className="muted">Loading exam…</p>;

  const sectionName = (i: number) =>
    exam.sections[i]?.title?.trim() || `Section ${i + 1}`;

  return (
    <>
      <Link to="/" className="back">← Back to exams</Link>
      <div className="page-head">
        <div>
          <h1>{exam.title}</h1>
          <p>
            <span className={`badge ${exam.difficulty}`}>{exam.difficulty}</span>{' '}
            {exam.status === 'draft' ? (
              <span className="badge draft">Draft</span>
            ) : (
              <span className="badge shared">Published</span>
            )}
          </p>
        </div>
        <button className="btn-lg no-print" onClick={publish} disabled={publishing}>
          {publishing ? <span className="spinner" /> : 'Publish exam'}
        </button>
      </div>

      <p className="hint">
        Review each question, tweak the wording or options, mark the correct answer,
        or regenerate any you don't like. Publish when you're happy.
      </p>

      {error && <p className="error">{error}</p>}

      {exam.questions.map((q, i) => (
        <div className="card" key={q.id}>
          <div className="q-head">
            <div className="q-num">
              QUESTION {i + 1} · {sectionName(q.sectionIndex)}
            </div>
            <div className="card-actions" style={{ margin: 0 }}>
              {savedId === q.id && <span className="success-note">Saved ✓</span>}
              <button
                className="btn-ghost btn-sm"
                onClick={() => regenerate(q.id)}
                disabled={!!busy}
              >
                {busy === q.id ? <span className="spinner" /> : '↻ Regenerate'}
              </button>
            </div>
          </div>

          <textarea
            value={q.text}
            onChange={(e) => patch(q.id, { text: e.target.value })}
            style={{ minHeight: 64, marginBottom: 10 }}
          />

          {q.options.map((opt, oi) => (
            <label
              className={`option ${q.correctIndex === oi ? 'result-correct' : ''}`}
              key={oi}
            >
              <input
                type="radio"
                name={`correct-${q.id}`}
                checked={q.correctIndex === oi}
                onChange={() => patch(q.id, { correctIndex: oi })}
                title="Mark as correct answer"
              />
              <input
                value={opt}
                onChange={(e) =>
                  patch(q.id, {
                    options: q.options.map((o, k) => (k === oi ? e.target.value : o)),
                  })
                }
                style={{ margin: 0 }}
              />
              {q.correctIndex === oi && <span className="tag ok">Correct</span>}
            </label>
          ))}

          <div className="card-actions">
            <button
              className="btn-ghost btn-sm"
              onClick={() => save(q)}
              disabled={busy === q.id}
            >
              Save changes
            </button>
          </div>
        </div>
      ))}

      <div className="submit-bar">
        <span className="muted">{exam.questions.length} questions ready</span>
        <button onClick={publish} disabled={publishing}>
          {publishing ? <span className="spinner" /> : 'Publish exam'}
        </button>
      </div>
    </>
  );
}
