import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

type Exam = {
  id: string;
  title: string;
  difficulty: string;
  status: string;
  tags: string[];
  isShared: boolean;
  shareCode: string | null;
  createdAt: string;
  _count: { questions: number; attempts: number };
};

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [copied, setCopied] = useState('');

  const load = () =>
    api.listExams().then(setExams).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set((exams ?? []).flatMap((e) => e.tags))).sort(),
    [exams],
  );

  const filtered = useMemo(
    () =>
      (exams ?? []).filter(
        (e) =>
          (!search || e.title.toLowerCase().includes(search.toLowerCase())) &&
          (!tag || e.tags.includes(tag)) &&
          (!difficulty || e.difficulty === difficulty),
      ),
    [exams, search, tag, difficulty],
  );

  const overview = useMemo(() => {
    const list = exams ?? [];
    return {
      exams: list.length,
      published: list.filter((e) => e.status === 'published').length,
      attempts: list.reduce((s, e) => s + e._count.attempts, 0),
      shared: list.filter((e) => e.isShared).length,
    };
  }, [exams]);

  const firstName = (user?.name || user?.email || '').split(/[\s@]/)[0];

  function open(e: Exam) {
    nav(e.status === 'draft' ? `/exam/${e.id}/edit` : `/exam/${e.id}`);
  }

  async function clone(e: Exam, ev: React.MouseEvent) {
    ev.stopPropagation();
    try {
      const copy = await api.clone(e.id);
      nav(`/exam/${copy.id}/edit`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggleShare(e: Exam, ev: React.MouseEvent) {
    ev.stopPropagation();
    try {
      const res = await api.share(e.id, !e.isShared);
      if (res.isShared && res.shareCode) {
        await navigator.clipboard
          .writeText(`${location.origin}/shared/${res.shareCode}`)
          .catch(() => {});
        setCopied(e.id);
        setTimeout(() => setCopied(''), 2500);
      }
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function copyLink(e: Exam, ev: React.MouseEvent) {
    ev.stopPropagation();
    await navigator.clipboard
      .writeText(`${location.origin}/shared/${e.shareCode}`)
      .catch(() => {});
    setCopied(e.id);
    setTimeout(() => setCopied(''), 2500);
  }

  return (
    <>
      <div className="welcome no-print">
        <div className="welcome-text">
          <h1>Welcome back{firstName ? `, ${firstName}` : ''} 👋</h1>
          <p>Generate a practice exam from any material, then test yourself.</p>
        </div>
        <Link to="/create" className="btn btn-lg btn-on-dark">＋ New Exam</Link>
      </div>

      {error && <p className="error">{error}</p>}

      {exams && exams.length > 0 && (
        <div className="overview no-print">
          <div className="stat-card">
            <div className="num">{overview.exams}</div>
            <div className="lbl">Total exams</div>
          </div>
          <div className="stat-card">
            <div className="num">{overview.published}</div>
            <div className="lbl">Published</div>
          </div>
          <div className="stat-card">
            <div className="num">{overview.attempts}</div>
            <div className="lbl">Attempts taken</div>
          </div>
          <div className="stat-card">
            <div className="num">{overview.shared}</div>
            <div className="lbl">Shared links</div>
          </div>
        </div>
      )}

      {exams && exams.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Search exams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {allTags.map((t) => (
            <button
              key={t}
              className={`chip ${tag === t ? 'active' : ''}`}
              onClick={() => setTag(tag === t ? '' : t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

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

      {exams && exams.length > 0 && filtered.length === 0 && (
        <div className="card empty">
          <h2>No matches</h2>
          <p className="muted">Try a different search or clear the filters.</p>
        </div>
      )}

      <div className="grid">
        {filtered.map((e) => (
          <div className="card exam-card" key={e.id} onClick={() => open(e)}>
            <div className="exam-meta">
              <span className={`badge ${e.difficulty}`}>{e.difficulty}</span>
              {e.status === 'draft' && <span className="badge draft">Draft</span>}
              {e.isShared && <span className="badge shared">🔗 Shared</span>}
            </div>
            <h2>{e.title}</h2>
            {e.tags.length > 0 && (
              <div className="exam-meta">
                {e.tags.map((t) => (
                  <span className="tag-chip" key={t}>#{t}</span>
                ))}
              </div>
            )}
            <div className="card-foot">
              <span className="stat">📝 {e._count.questions} question{e._count.questions === 1 ? '' : 's'}</span>
              <span className="stat">
                {e._count.attempts > 0
                  ? `✓ ${e._count.attempts} attempt${e._count.attempts > 1 ? 's' : ''}`
                  : e.status === 'draft'
                    ? '✎ Draft in progress'
                    : '○ Not attempted'}
              </span>
            </div>
            <div className="card-actions">
              <button className="btn-ghost" onClick={(ev) => clone(e, ev)}>
                ⧉ Clone
              </button>
              {e.status === 'published' && (
                <button className="btn-ghost" onClick={(ev) => toggleShare(e, ev)}>
                  {e.isShared ? 'Unshare' : '🔗 Share'}
                </button>
              )}
              {e.isShared && e.shareCode && (
                <button className="btn-ghost" onClick={(ev) => copyLink(e, ev)}>
                  Copy link
                </button>
              )}
              {copied === e.id && <span className="success-note">Link copied ✓</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
