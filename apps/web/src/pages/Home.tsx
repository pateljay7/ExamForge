import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

type Exam = {
  id: string;
  title: string;
  difficulty: string;
  createdAt: string;
  _count: { questions: number; attempts: number };
};

export default function Home() {
  const nav = useNavigate();
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listExams().then(setExams).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Your exams</h1>
          <p>Generate a practice exam from any material, then test yourself.</p>
        </div>
        <Link to="/create" className="btn btn-lg">+ New Exam</Link>
      </div>

      {error && <p className="error">{error}</p>}

      {exams && exams.length === 0 && (
        <div className="card empty">
          <div className="emoji">📚</div>
          <h2>No exams yet</h2>
          <p className="muted">Paste your notes and let AI write the questions.</p>
          <Link to="/create" className="btn" style={{ marginTop: 14 }}>
            Create your first exam
          </Link>
        </div>
      )}

      {exams && exams.length > 0 && (
        <div className="grid">
          {exams.map((e) => (
            <div
              className="card exam-card"
              key={e.id}
              onClick={() => nav(`/exam/${e.id}`)}
            >
              <div className="exam-meta">
                <span className={`badge ${e.difficulty}`}>{e.difficulty}</span>
                <span>{e._count.questions} questions</span>
              </div>
              <h2>{e.title}</h2>
              <div className="exam-meta" style={{ marginTop: 'auto' }}>
                {e._count.attempts > 0
                  ? `${e._count.attempts} attempt${e._count.attempts > 1 ? 's' : ''}`
                  : 'Not attempted yet'}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
