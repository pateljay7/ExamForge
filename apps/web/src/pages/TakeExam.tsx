import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { fmtTime } from '../format';

type Question = { id: string; text: string; options: string[] };
type Exam = {
  id: string;
  title: string;
  difficulty: string;
  status: string;
  isOwner?: boolean;
  timeLimitSec: number | null;
  timerEnabled: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questions: Question[];
};
type Attempt = { id: string; score: number; total: number; createdAt: string };

// Fisher–Yates over an index array.
function shuffledIndices(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Progress = {
  answers: Record<string, number>; // qid -> ORIGINAL option index
  flags: Record<string, boolean>;
  elapsed: number;
  qOrder: string[]; // question ids in display order
  optOrder: Record<string, number[]>; // qid -> original option indices, display order
};

export default function TakeExam() {
  const { id } = useParams();
  const nav = useNavigate();
  const storageKey = `exam_progress_${id}`;

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [order, setOrder] = useState<Question[]>([]); // display order, options already arranged
  const [optOrder, setOptOrder] = useState<Record<string, number[]>>({});
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    api
      .getExam(id)
      .then((e: Exam) => {
        // Owner opened their own unpublished draft — send them to the editor.
        if (e.status !== 'published') {
          if (e.isOwner) nav(`/exam/${e.id}/edit`, { replace: true });
          else setError('This exam is not available.');
          return;
        }
        setExam(e);
        setHasSaved(!!localStorage.getItem(storageKey));
      })
      .catch((e) => setError(e.message));
    api.listAttempts(id).then(setAttempts).catch(() => {});
  }, [id]);

  const timed = !!(exam && (exam.timeLimitSec || exam.timerEnabled));

  // Clock ticks only while the exam is active (pauses when not started).
  useEffect(() => {
    if (!started || !timed) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, timed]);

  // Persist progress so an interrupted attempt can be resumed.
  useEffect(() => {
    if (!started || !exam) return;
    const p: Progress = {
      answers,
      flags,
      elapsed,
      qOrder: order.map((q) => q.id),
      optOrder,
    };
    localStorage.setItem(storageKey, JSON.stringify(p));
  }, [started, answers, flags, elapsed, order, optOrder, exam]);

  // Build the display order (either fresh or restored from a saved attempt).
  function arrange(e: Exam, saved?: Progress) {
    const byId = new Map(e.questions.map((q) => [q.id, q]));

    const qIds = saved
      ? saved.qOrder.filter((qid) => byId.has(qid))
      : e.shuffleQuestions
        ? shuffledIndices(e.questions.length).map((i) => e.questions[i].id)
        : e.questions.map((q) => q.id);

    const opt: Record<string, number[]> = {};
    const displayQs: Question[] = qIds.map((qid) => {
      const q = byId.get(qid)!;
      const perm =
        saved?.optOrder[qid] ??
        (e.shuffleOptions
          ? shuffledIndices(q.options.length)
          : q.options.map((_, i) => i));
      opt[qid] = perm;
      return { ...q, options: perm.map((oi) => q.options[oi]) };
    });

    setOrder(displayQs);
    setOptOrder(opt);
  }

  function start() {
    if (!exam) return;
    arrange(exam);
    setStarted(true);
  }

  function resume() {
    if (!exam) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return start();
    try {
      const saved: Progress = JSON.parse(raw);
      arrange(exam, saved);
      setAnswers(saved.answers || {});
      setFlags(saved.flags || {});
      setElapsed(saved.elapsed || 0);
      setStarted(true);
    } catch {
      start();
    }
  }

  function startOver() {
    localStorage.removeItem(storageKey);
    setAnswers({});
    setFlags({});
    setElapsed(0);
    setHasSaved(false);
    start();
  }

  async function submit() {
    if (!exam || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      // `answers` already holds ORIGINAL option indices, so the server scores correctly.
      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));
      const { attemptId } = await api.submit(exam.id, payload, timed ? elapsed : 0);
      localStorage.removeItem(storageKey);
      nav(`/result/${attemptId}`);
    } catch (e: any) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(e.message);
    }
  }

  // Auto-submit when a preset limit runs out.
  const overLimit = !!(started && exam?.timeLimitSec && elapsed >= exam.timeLimitSec);
  useEffect(() => {
    if (overLimit) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overLimit]);

  if (error && !exam) return <p className="error">{error}</p>;
  if (!exam) return <p className="muted">Loading exam…</p>;

  const timingLabel = exam.timeLimitSec
    ? `Time limit: ${fmtTime(exam.timeLimitSec)} (auto-submits)`
    : exam.timerEnabled
      ? 'Stopwatch enabled · no limit'
      : 'No time limit';

  // ---------- Start screen ----------
  if (!started) {
    return (
      <>
        <Link to="/" className="back">← Back to exams</Link>
        <div className="page-head">
          <div>
            <h1>{exam.title}</h1>
            <p><span className={`badge ${exam.difficulty}`}>{exam.difficulty}</span></p>
          </div>
        </div>

        <div className="card start-card">
          <div className="emoji" style={{ fontSize: '2.4rem' }}>📝</div>
          <h2>{hasSaved ? 'Resume your attempt?' : 'Ready to begin?'}</h2>
          <div className="start-meta">
            <span>{exam.questions.length} questions</span>
            <span>·</span>
            <span>{timingLabel}</span>
            {(exam.shuffleQuestions || exam.shuffleOptions) && (
              <>
                <span>·</span>
                <span>🔀 Shuffled</span>
              </>
            )}
          </div>
          {exam.timeLimitSec && (
            <p className="muted">
              The timer starts when you press Start and submits automatically when it runs out.
            </p>
          )}
          {hasSaved ? (
            <div className="card-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-lg" onClick={resume}>Resume exam</button>
              <button className="btn-ghost" onClick={startOver}>Start over</button>
            </div>
          ) : (
            <button className="btn-lg" onClick={start} style={{ marginTop: 8 }}>
              Start Exam
            </button>
          )}
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
      </>
    );
  }

  // ---------- Exam in progress ----------
  const answered = Object.keys(answers).length;
  const total = order.length;
  const remaining = exam.timeLimitSec ? exam.timeLimitSec - elapsed : 0;
  const low = exam.timeLimitSec ? remaining <= 30 : false;
  const flaggedCount = Object.values(flags).filter(Boolean).length;

  return (
    <>
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

      <div className="progress-bar" style={{ marginTop: 8 }}>
        <div style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
      </div>
      <p className="muted" style={{ marginBottom: 10 }}>
        {answered} of {total} answered
        {flaggedCount > 0 && ` · ${flaggedCount} flagged`}
      </p>

      {/* Question minimap for quick navigation */}
      <div className="qmap">
        {order.map((q, i) => (
          <button
            key={q.id}
            className={`${answers[q.id] !== undefined ? 'answered' : ''} ${
              flags[q.id] ? 'flagged' : ''
            }`}
            onClick={() =>
              document
                .getElementById(`q-${q.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            title={flags[q.id] ? 'Flagged' : undefined}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {order.map((q, i) => (
        <div className="card" key={q.id} id={`q-${q.id}`}>
          <div className="q-head">
            <div className="q-num">QUESTION {i + 1}</div>
            <button
              className={`flag-btn ${flags[q.id] ? 'flagged' : ''}`}
              onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
            >
              {flags[q.id] ? '★ Flagged' : '☆ Flag'}
            </button>
          </div>
          <div className="q-text">{q.text}</div>
          {q.options.map((opt, displayIdx) => {
            const originalIdx = optOrder[q.id]?.[displayIdx] ?? displayIdx;
            return (
              <label
                className={`option ${answers[q.id] === originalIdx ? 'selected' : ''}`}
                key={displayIdx}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === originalIdx}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: originalIdx }))}
                />
                {opt}
              </label>
            );
          })}
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
