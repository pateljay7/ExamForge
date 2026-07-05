import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

type Section = { content: string; weight: number };

export default function CreateExam() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<Section[]>([{ content: '', weight: 1 }]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalWeight = sections.reduce((s, x) => s + (x.weight || 0), 0) || 1;

  function updateSection(i: number, patch: Partial<Section>) {
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));
  }
  const addSection = () => setSections((s) => [...s, { content: '', weight: 1 }]);
  const removeSection = (i: number) =>
    setSections((s) => s.filter((_, idx) => idx !== i));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const exam = await api.createExam({
        title,
        sections,
        numQuestions,
        difficulty,
        timeLimitMinutes: limitEnabled ? timeLimitMinutes : undefined,
        timerEnabled: limitEnabled ? false : timerEnabled,
      });
      nav(`/exam/${exam.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <Link to="/" className="back">← Back to exams</Link>
      <div className="page-head">
        <div>
          <h1>New exam</h1>
          <p>Add one or more content sections — AI writes questions weighted by each.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          <label>Exam title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Biology Midterm"
            required
          />

          <label>Content sections</label>
          <p className="hint" style={{ marginTop: 0, marginBottom: 8 }}>
            Weights decide how many questions come from each section.
          </p>
          {sections.map((sec, i) => (
            <div className="section-block" key={i}>
              <div className="section-head">
                <strong>Section {i + 1}</strong>
                <span className="section-share">
                  ≈ {Math.round((sec.weight / totalWeight) * 100)}% of questions
                </span>
                {sections.length > 1 && (
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => removeSection(i)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                value={sec.content}
                onChange={(e) => updateSection(i, { content: e.target.value })}
                placeholder="Paste the material for this section…"
                required
                style={{ minHeight: 120 }}
              />
              <div className="weight-row">
                <span className="muted">Weight</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={sec.weight}
                  onChange={(e) =>
                    updateSection(i, { weight: Number(e.target.value) })
                  }
                  style={{ width: 90 }}
                />
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={addSection}>
            + Add section
          </button>

          <label>Number of questions</label>
          <input
            type="number"
            min={1}
            max={50}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />

          <label>Difficulty</label>
          <div className="segment">
            {DIFFICULTIES.map((d) => (
              <button
                type="button"
                key={d}
                className={difficulty === d ? 'active' : ''}
                onClick={() => setDifficulty(d)}
              >
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          <label>Timing</label>
          <label className="check">
            <input
              type="checkbox"
              checked={limitEnabled}
              onChange={(e) => setLimitEnabled(e.target.checked)}
            />
            Set a time limit (auto-submits when time runs out)
          </label>
          {limitEnabled && (
            <div className="weight-row" style={{ marginTop: 8 }}>
              <input
                type="number"
                min={1}
                max={600}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <span className="muted">minutes</span>
            </div>
          )}
          <label className="check" style={{ opacity: limitEnabled ? 0.5 : 1 }}>
            <input
              type="checkbox"
              checked={timerEnabled}
              disabled={limitEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
            />
            Show a stopwatch (counts up for reference, no limit)
          </label>

          {error && <p className="error">{error}</p>}
          <button className="btn-lg" disabled={loading} style={{ marginTop: 22 }}>
            {loading ? (
              <>
                <span className="spinner" /> Generating questions…
              </>
            ) : (
              'Generate exam'
            )}
          </button>
        </form>
      </div>
    </>
  );
}
