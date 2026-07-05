// Tiny dependency-free SVG line chart of attempt scores over time.
export default function TrendChart({
  points,
}: {
  points: { pct: number; label: string }[];
}) {
  if (points.length < 2) return null;

  const W = 560;
  const H = 120;
  const PAD = 18;
  const step = (W - PAD * 2) / (points.length - 1);
  const x = (i: number) => PAD + i * step;
  const y = (pct: number) => PAD + (1 - pct / 100) * (H - PAD * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.pct)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="Score trend"
    >
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line
            x1={PAD}
            x2={W - PAD}
            y1={y(g)}
            y2={y(g)}
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
          <text x={2} y={y(g) + 3} fontSize="9" fill="var(--muted)">
            {g}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.pct)} r="3.5" fill="var(--primary)">
          <title>{`${p.label}: ${p.pct}%`}</title>
        </circle>
      ))}
    </svg>
  );
}
