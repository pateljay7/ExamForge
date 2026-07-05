import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function CreateExam() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const exam = await api.createExam({ title, content, numQuestions, difficulty });
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
          <p>Paste your material — AI writes multiple-choice questions from it.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          <label>Exam title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 3: Cell Biology"
            required
          />

          <label>Content / learning material</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your notes, an article, or reference text here…"
            required
          />
          <p className="hint">{content.length} characters · minimum 20</p>

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

          {error && <p className="error">{error}</p>}
          <button
            className="btn-lg"
            disabled={loading}
            style={{ marginTop: 22 }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Generating questions…
              </>
            ) : (
              'Generate exam'
            )}
          </button>
          {loading && (
            <p className="hint" style={{ marginTop: 10 }}>
              This can take a moment while the AI writes and checks each question.
            </p>
          )}
        </form>
      </div>
    </>
  );
}
