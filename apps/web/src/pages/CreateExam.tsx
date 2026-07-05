import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

type Section = { title: string; content: string; weight: number };

export default function CreateExam() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<Section[]>([
    { title: '', content: '', weight: 1 },
  ]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalWeight = sections.reduce((s, x) => s + (x.weight || 0), 0) || 1;

  function updateSection(i: number, patch: Partial<Section>) {
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));
  }
  const addSection = () =>
    setSections((s) => [...s, { title: '', content: '', weight: 1 }]);
  const removeSection = (i: number) =>
    setSections((s) => s.filter((_, idx) => idx !== i));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const exam = await api.createExam({
        title,
        sections: sections.map((s) => ({
          title: s.title.trim() || undefined,
          content: s.content,
          weight: s.weight,
        })),
        numQuestions,
        difficulty,
        tags,
        shuffleQuestions,
        shuffleOptions,
        timeLimitMinutes: limitEnabled ? timeLimitMinutes : undefined,
        timerEnabled: limitEnabled ? false : timerEnabled,
      });
      // New exams start as drafts — go review & publish.
      nav(`/exam/${exam.id}/edit`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  const timingLabel = limitEnabled
    ? `${timeLimitMinutes} min limit`
    : timerEnabled
      ? 'Stopwatch'
      : 'Untimed';
  const shuffleLabel =
    shuffleQuestions && shuffleOptions
      ? 'Questions + options'
      : shuffleQuestions
        ? 'Questions'
        : shuffleOptions
          ? 'Options'
          : 'Off';

  return (
    <>
      <Link to="/" className="back">← Back to exams</Link>
      <div className="page-head">
        <div>
          <h1>Create a new exam</h1>
          <p>Add one or more content sections — AI writes questions weighted by each.</p>
        </div>
      </div>

      <div className="form-layout">
        <form id="create-form" onSubmit={submit}>
          <div className="card">
            <div className="card-title">
              <span className="step">1</span>
              <h2>Exam basics</h2>
            </div>
            <label>Exam title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Midterm"
              required
            />

            <label>Tags <span className="muted">(optional, comma-separated)</span></label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. biology, midterm, semester 1"
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
          </div>

          <div className="card">
            <div className="card-title">
              <span className="step">2</span>
              <h2>Content &amp; weighting</h2>
            </div>
            <p className="card-sub">
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
              <input
                value={sec.title}
                onChange={(e) => updateSection(i, { title: e.target.value })}
                placeholder="Section title (optional) — e.g. Cell Biology"
              />
              <textarea
                value={sec.content}
                onChange={(e) => updateSection(i, { content: e.target.value })}
                placeholder="Paste the material for this section…"
                required
                style={{ minHeight: 120, marginTop: 8 }}
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
          </div>

          <div className="card">
            <div className="card-title">
              <span className="step">3</span>
              <h2>Options</h2>
            </div>

          <label>Anti-memorization</label>
          <label className="check">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
            />
            Shuffle question order on each attempt
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
            />
            Shuffle answer options on each attempt
          </label>

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
          </div>

          {error && <p className="error">{error}</p>}
        </form>

        <aside className="form-rail">
          <div className="card">
            <div className="card-title">
              <h2>Summary</h2>
            </div>
            <div className="summary-row">
              <span className="k">Questions</span>
              <span className="v">{numQuestions}</span>
            </div>
            <div className="summary-row">
              <span className="k">Sections</span>
              <span className="v">{sections.length}</span>
            </div>
            <div className="summary-row">
              <span className="k">Difficulty</span>
              <span className="v" style={{ textTransform: 'capitalize' }}>{difficulty}</span>
            </div>
            <div className="summary-row">
              <span className="k">Timing</span>
              <span className="v">{timingLabel}</span>
            </div>
            <div className="summary-row">
              <span className="k">Shuffle</span>
              <span className="v">{shuffleLabel}</span>
            </div>
          </div>
          <button form="create-form" className="btn-lg btn-block" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Generating…
              </>
            ) : (
              '✦ Generate & review'
            )}
          </button>
          <p className="hint" style={{ textAlign: 'center' }}>
            You'll review &amp; edit every question before publishing.
          </p>
        </aside>
      </div>
    </>
  );
}
