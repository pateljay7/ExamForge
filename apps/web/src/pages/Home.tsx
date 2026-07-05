import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

type Exam = {
  id: string;
  title: string;
  difficulty: string;
  createdAt: string;
  _count: { questions: number };
};

export default function Home() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listExams().then(setExams).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="container">
      <div className="row">
        <h1>Self Examination Portal</h1>
        <Link to="/create">
          <button>+ New Exam</button>
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {exams.length === 0 && !error && (
        <p className="muted">No exams yet. Create one from your content.</p>
      )}
      {exams.map((e) => (
        <div className="card" key={e.id}>
          <div className="row">
            <div>
              <strong>{e.title}</strong>
              <div className="muted">
                {e._count.questions} questions · {e.difficulty}
              </div>
            </div>
            <Link to={`/exam/${e.id}`}>
              <button>Take Exam</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
