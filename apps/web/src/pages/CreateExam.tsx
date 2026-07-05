import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

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
    <div className="container">
      <Link to="/">← Back</Link>
      <h1>Create Exam</h1>
      <form onSubmit={submit}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Content / learning material</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste the material to generate questions from…"
          required
        />

        <label>Number of questions</label>
        <input
          type="number"
          min={1}
          max={50}
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
        />

        <label>Difficulty</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {error && <p className="error">{error}</p>}
        <p style={{ marginTop: 16 }}>
          <button disabled={loading}>
            {loading ? 'Generating…' : 'Generate Exam'}
          </button>
        </p>
      </form>
    </div>
  );
}
