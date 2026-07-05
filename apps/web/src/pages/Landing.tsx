import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Brand from '../components/Brand';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export default function Landing() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(currentTheme);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  }

  function onMove(e: React.MouseEvent) {
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${px * 16}deg`);
    el.style.setProperty('--rx', `${-py * 13}deg`);
    el.style.setProperty('--mx', `${px}`);
    el.style.setProperty('--my', `${py}`);
  }
  function onLeave() {
    const el = sceneRef.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
  }

  const features = [
    {
      icon: '✦',
      title: 'AI-generated exams',
      body: 'Paste notes, slides, or an article — get well-formed multiple-choice questions in seconds.',
    },
    {
      icon: '◒',
      title: 'Section weighting',
      body: 'Split content into weighted sections so questions mirror what actually matters.',
    },
    {
      icon: '⏱',
      title: 'Timed practice',
      body: 'Countdown limits with auto-submit, or a reference stopwatch. Resume anytime.',
    },
    {
      icon: '🔀',
      title: 'Anti-memorization',
      body: 'Shuffle questions and options on every attempt so you learn concepts, not positions.',
    },
    {
      icon: '↗',
      title: 'Progress tracking',
      body: 'Score trends, streaks, best results and per-section breakdowns after every attempt.',
    },
    {
      icon: '🔗',
      title: 'Share instantly',
      body: 'Publish an exam and share a single link — classmates take it, you keep the analytics.',
    },
  ];

  const steps = [
    { n: '1', title: 'Paste your material', body: 'Drop in your study content and set difficulty, sections, and timing.' },
    { n: '2', title: 'Review the questions', body: 'AI drafts the exam. Tweak wording, fix answers, or regenerate any question.' },
    { n: '3', title: 'Test & track', body: 'Take it under real conditions and watch your scores climb over time.' },
  ];

  return (
    <div className="lp">
      {/* ---------- nav ---------- */}
      <header className="lp-nav">
        <Link to="/" className="brand"><Brand /></Link>
        <nav className="lp-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="lp-nav-actions">
          <button className="lp-theme" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/signup" className="btn">Get started</Link>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="lp-hero">
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-grid-bg" />

        <div className="lp-hero-copy">
          <span className="lp-eyebrow">✦ AI-powered exam generation</span>
          <h1 className="lp-title">
            Turn any material into a <span className="grad-text">mastery-building exam</span>.
          </h1>
          <p className="lp-sub">
            ExamForge writes tailored multiple-choice exams from your own notes, then tracks every
            attempt so you can see yourself improve. Study smarter — not longer.
          </p>
          <div className="lp-cta">
            <Link to="/signup" className="btn btn-lg">Start free →</Link>
            <a href="#how" className="btn btn-ghost btn-lg">See how it works</a>
          </div>
          <div className="lp-trust">
            <div className="lp-trust-item"><strong>10k+</strong><span>questions generated</span></div>
            <div className="lp-trust-item"><strong>&lt; 30s</strong><span>to a full exam</span></div>
            <div className="lp-trust-item"><strong>100%</strong><span>from your content</span></div>
          </div>
        </div>

        {/* ---------- 3D stage ---------- */}
        <div className="lp-stage" onMouseMove={onMove} onMouseLeave={onLeave}>
          <div className="lp-scene" ref={sceneRef}>
            <div className="lp-layer l-plane" />

            <div className="lp-layer l-main">
              <div className="lp-bob">
                <div className="glass-card main-card">
                  <div className="mc-head">
                    <span className="mc-badge">Biology Midterm</span>
                    <span className="mc-q">Q3 / 10</span>
                  </div>
                  <div className="mc-question">Which organelle is the site of ATP synthesis?</div>
                  <div className="mc-opt">Ribosome</div>
                  <div className="mc-opt sel">Mitochondrion ✓</div>
                  <div className="mc-opt">Golgi apparatus</div>
                  <div className="mc-progress"><span /></div>
                </div>
              </div>
            </div>

            <div className="lp-layer l-score">
              <div className="lp-bob">
                <div className="glass-card score-card">
                  <div className="score-ring"><div>92%</div></div>
                  <div className="score-meta">
                    <strong>Great work!</strong>
                    <span>Personal best</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-layer l-streak">
              <div className="lp-bob">
                <div className="glass-card streak-card">
                  <div className="streak-num">7🔥</div>
                  <div className="streak-lbl">day streak</div>
                </div>
              </div>
            </div>

            <div className="lp-layer l-chip l-chip1"><span className="glass-chip">#anatomy</span></div>
            <div className="lp-layer l-chip l-chip2"><span className="glass-chip">+12% this week</span></div>
          </div>
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section className="lp-section" id="features">
        <div className="lp-section-head">
          <span className="lp-kicker">Everything you need</span>
          <h2 className="lp-h2">Built for serious self-study</h2>
          <p className="lp-lead">From generation to analytics — a complete loop that turns passive notes into active recall.</p>
        </div>
        <div className="lp-features">
          {features.map((f) => (
            <div className="lp-feature" key={f.title}>
              <div className="lp-feature-ico">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="lp-section lp-how" id="how">
        <div className="lp-section-head">
          <span className="lp-kicker">How it works</span>
          <h2 className="lp-h2">Three steps to your next exam</h2>
        </div>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {i < steps.length - 1 && <div className="lp-step-line" />}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="lp-band">
        <div className="lp-band-inner">
          <h2>Ready to study smarter?</h2>
          <p>Create your first AI-generated exam in under a minute — no credit card needed.</p>
          <Link to="/signup" className="btn btn-lg btn-on-dark">Get started free →</Link>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="lp-footer">
        <div className="brand"><Brand /></div>
        <span className="muted">© ExamForge — turn your notes into mastery.</span>
        <div className="lp-footer-links">
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
