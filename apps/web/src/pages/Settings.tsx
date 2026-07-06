import { useEffect, useState } from 'react';
import { api } from '../api';

type Provider = { id: string; label: string };

export default function Settings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState('claude');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setProviders(s.providers);
        setSelected(s.llmProvider);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function choose(id: string) {
    if (id === selected) return;
    const prev = selected;
    setSelected(id);
    setSaved('');
    setError('');
    setLoading(true);
    try {
      await api.updateSettings(id);
      setSaved(id);
      setTimeout(() => setSaved(''), 2500);
    } catch (e: any) {
      setSelected(prev);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Preferences for your account.</p>
        </div>
      </div>

      <div className="card">
        <h2>AI provider</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Which large-language model generates your exam questions. Applies to new
          exams and regenerated questions.
        </p>

        <div className="provider-grid">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`provider-opt ${selected === p.id ? 'active' : ''}`}
              disabled={loading}
              onClick={() => choose(p.id)}
            >
              <span className="provider-dot" />
              <span className="provider-name">{p.label}</span>
              {selected === p.id && <span className="provider-check">✓</span>}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        {saved && <p className="success-note" style={{ marginTop: 12 }}>Saved ✓</p>}
        <p className="hint" style={{ marginTop: 14 }}>
          Gemini requires the server to have a Google API key configured.
        </p>
      </div>
    </>
  );
}
