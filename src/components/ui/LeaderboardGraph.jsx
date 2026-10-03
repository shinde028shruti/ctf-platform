import React, { useId, useMemo, useState } from 'react';

/**
 * LeaderboardGraph — multi-series line chart.
 * • One solid-colored line per player (fixed 10-color palette, no neon).
 * • Click a line or legend item to select that player — all others thin out.
 * • Click the same item again to deselect.
 * • A player-info panel slides in below the chart when a player is selected.
 */

/* ── Layout ──────────────────────────────────────────────── */
const VW     = 880;
const VH     = 300;
const PAD    = { top: 32, right: 28, bottom: 48, left: 64 };
const PLOT_W = VW - PAD.left - PAD.right;
const PLOT_H = VH - PAD.top  - PAD.bottom;
const N_STEPS = 9;

/* Line widths */
const LW_ACTIVE   = 2.5;   /* selected / default-idle */
const LW_DIM      = 1;     /* every other line when one is selected */
const DOT_R_ON    = 4;
const DOT_R_OFF   = 2.5;
const DRAW_DUR    = 1.6;   /* seconds for full sweep */

/* ── Solid, muted color palette — no neon ────────────────── */
const PALETTE = [
  '#5B8CDB',   /* steel blue    */
  '#E07B54',   /* terracotta    */
  '#5BBD8A',   /* sage green    */
  '#C47FE8',   /* soft lavender */
  '#D4A84B',   /* warm gold     */
  '#6EC4C4',   /* muted teal    */
  '#D96B8A',   /* dusty rose    */
  '#7B9E6B',   /* olive green   */
  '#9E7BB5',   /* muted violet  */
  '#C4836E',   /* clay          */
];

const fmt = v => Number(v).toLocaleString();

/* ── Deterministic series builder ────────────────────────── */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function buildSeries(player, idx) {
  const total = Number(player.points) || 0;
  const h     = hash(String(player.username ?? player.id) + idx);
  const pts   = [0];
  for (let step = 1; step < N_STEPS - 1; step += 1) {
    const t      = step / (N_STEPS - 1);
    const base   = total * (t * t * 0.4 + t * 0.6);
    const jitter = ((h >>> (step * 3)) & 0xff) / 255 * total * 0.08;
    const sign   = ((h >>> (step * 5)) & 1) ? 1 : -1;
    pts.push(Math.max(0, Math.min(total, Math.round(base + sign * jitter))));
  }
  pts.push(total);
  for (let i = 1; i < pts.length; i += 1) if (pts[i] < pts[i - 1]) pts[i] = pts[i - 1];
  return pts;
}

function niceCeil(val, steps = 5) {
  if (!val) return 100;
  const rough = val / steps;
  const mag   = 10 ** Math.floor(Math.log10(rough));
  const norm  = rough / mag;
  const step  = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return Math.ceil(val / step) * step;
}

function buildSegments(pts2d) {
  const n = pts2d.length;
  if (n < 2) return [];
  const slopes = [];
  for (let i = 0; i < n - 1; i += 1) {
    const dx = pts2d[i + 1].x - pts2d[i].x;
    slopes.push(dx ? (pts2d[i + 1].y - pts2d[i].y) / dx : 0);
  }
  const m = new Array(n).fill(0);
  m[0] = slopes[0]; m[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    const a = slopes[i - 1], b = slopes[i];
    m[i] = a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  }
  return pts2d.slice(0, -1).map((p, i) => {
    const t = (pts2d[i + 1].x - p.x) / 3;
    return (
      `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} ` +
      `C ${(p.x + t).toFixed(1)} ${(p.y + m[i] * t).toFixed(1)} ` +
      `${(pts2d[i + 1].x - t).toFixed(1)} ${(pts2d[i + 1].y - m[i + 1] * t).toFixed(1)} ` +
      `${pts2d[i + 1].x.toFixed(1)} ${pts2d[i + 1].y.toFixed(1)}`
    );
  });
}

/* Hit-test: is point (mx,my) within ~8px of any segment midpoint? */
function hitTest(series, mx, my, svgEl) {
  if (!svgEl) return null;
  const rect = svgEl.getBoundingClientRect();
  const scaleX = VW / rect.width;
  const scaleY = VH / rect.height;
  const sx = (mx - rect.left) * scaleX;
  const sy = (my - rect.top)  * scaleY;

  let best = null, bestDist = 14; /* px threshold in SVG units */
  series.forEach((s, si) => {
    s.pts2d.forEach(pt => {
      const d = Math.hypot(pt.x - sx, pt.y - sy);
      if (d < bestDist) { bestDist = d; best = si; }
    });
  });
  return best;
}

/* ── Component ───────────────────────────────────────────── */
export default function LeaderboardGraph({ players = [], max = 10 }) {
  const uid    = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [selected, setSelected] = useState(null); /* series index or null */
  const svgRef = React.useRef(null);

  const model = useMemo(() => {
    const rows = players.slice(0, max).filter(p => Number.isFinite(Number(p?.points)));
    if (!rows.length) return null;

    const yMax   = niceCeil(Math.max(...rows.map(p => Number(p.points))), 5);
    const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((yMax / 5) * i));
    const stepX  = PLOT_W / (N_STEPS - 1);

    const series = rows.map((player, idx) => {
      const color     = PALETTE[idx % PALETTE.length];
      const snapshots = buildSeries(player, idx);
      const pts2d     = snapshots.map((val, si) => ({
        x: PAD.left + si * stepX,
        y: PAD.top  + PLOT_H * (1 - val / yMax),
      }));
      return { player, color, snapshots, pts2d, segments: buildSegments(pts2d) };
    });

    return { rows, yMax, yTicks, series, stepX };
  }, [players, max]);

  if (!model) return null;

  const { rows, yTicks, yMax, series, stepX } = model;
  const clipId  = `mlc-clip-${uid}`;
  const baseY   = PAD.top + PLOT_H;
  const segDur  = DRAW_DUR / (N_STEPS - 1);
  const sel     = series[selected] ?? null;

  /* Click on SVG area */
  const handleSvgClick = (e) => {
    const hit = hitTest(series, e.clientX, e.clientY, svgRef.current);
    if (hit === null) { setSelected(null); return; }
    setSelected(prev => prev === hit ? null : hit);
  };

  return (
    <div className="lb-chart">

      {/* ── Header ── */}
      <div className="lb-chart-head">
        <div>
          <div className="section-title mb-1">Top {rows.length} Users</div>
          <p className="lb-chart-sub">
            Score progression · click a line or player to inspect
          </p>
        </div>
        <div className="lb-chart-peak">
          <span className="lb-chart-cap">Leader</span>
          <div className="lb-chart-peak-val">{fmt(rows[0].points)}</div>
        </div>
      </div>

      {/* ── SVG ── */}
      <svg
        ref={svgRef}
        className="lb-chart-svg"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ cursor: 'crosshair' }}
        onClick={handleSvgClick}
        role="img"
        aria-label={`Score progression for top ${rows.length} players. ${rows[0].username} leads with ${fmt(rows[0].points)} pts.`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.left - 6} y={PAD.top - 6}
                  width={PLOT_W + 12} height={PLOT_H + 12} />
          </clipPath>
        </defs>

        {/* Gridlines + Y labels */}
        <g aria-hidden="true">
          {yTicks.map(v => {
            const y = PAD.top + PLOT_H * (1 - v / yMax);
            return (
              <g key={v}>
                <line className="lb-chart-grid"
                      x1={PAD.left} y1={y} x2={VW - PAD.right} y2={y} />
                <text className="lb-chart-tick"
                      x={PAD.left - 8} y={y}
                      textAnchor="end" dominantBaseline="middle">
                  {v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}
                </text>
              </g>
            );
          })}
        </g>

        {/* X checkpoint labels */}
        <g aria-hidden="true">
          {Array.from({ length: N_STEPS }, (_, si) => (
            <text key={si} className="lb-chart-tick"
                  x={PAD.left + si * stepX} y={baseY + 18} textAnchor="middle">
              {si + 1}
            </text>
          ))}
        </g>

        {/* Axis titles */}
        <text className="lb-chart-axis-title" aria-hidden="true"
              x={11} y={PAD.top + PLOT_H / 2} textAnchor="middle"
              transform={`rotate(-90 11 ${PAD.top + PLOT_H / 2})`}>
          POINTS
        </text>
        <text className="lb-chart-axis-title" aria-hidden="true"
              x={PAD.left + PLOT_W / 2} y={baseY + 40} textAnchor="middle">
          CHECKPOINT
        </text>

        {/* Series */}
        {series.map((s, si) => {
          const isSelected = selected === si;
          const isDimmed   = selected !== null && !isSelected;
          const lw         = isDimmed ? LW_DIM : LW_ACTIVE;
          const dotR       = isDimmed ? DOT_R_OFF : DOT_R_ON;
          const opacity    = isDimmed ? 0.22 : 1;

          return (
            <g key={s.player.id ?? si}
               clipPath={`url(#${clipId})`}
               style={{ opacity, transition: 'opacity 0.22s ease', cursor: 'pointer' }}
               onClick={(e) => { e.stopPropagation(); setSelected(prev => prev === si ? null : si); }}
            >
              {/* Line segments */}
              {s.segments.map((d, di) => (
                <path key={`seg-${si}-${di}`}
                      className="lb-chart-seg"
                      d={d} pathLength="1"
                      fill="none"
                      stroke={s.color}
                      strokeWidth={lw}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-width 0.22s ease',
                        animationDelay:    `${(si * 0.055 + di * segDur).toFixed(3)}s`,
                        animationDuration: `${segDur.toFixed(3)}s`,
                      }} />
              ))}

              {/* Dots */}
              {s.pts2d.map((pt, pi) => (
                <g key={`dot-${si}-${pi}`}
                   className="lb-chart-point"
                   style={{ animationDelay: `${(si * 0.055 + pi * segDur + segDur * 0.75).toFixed(3)}s` }}>
                  <title>{`${s.player.username} · ckpt ${pi + 1}: ${fmt(s.snapshots[pi])} pts`}</title>
                  <circle cx={pt.x} cy={pt.y} r={dotR}
                          fill={s.color}
                          stroke={isSelected ? 'var(--bg-card)' : 'var(--bg-card)'}
                          strokeWidth={isSelected ? 2 : 1.5}
                          style={{ transition: 'r 0.22s ease' }} />
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {/* ── Player info panel (appears on selection) ── */}
      {sel && (
        <div style={{
          margin: '4px 0 14px',
          padding: '16px 20px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${sel.color}12 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${sel.color}40`,
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px 28px',
          animation: 'fadeInUp 0.22s ease both',
        }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `${sel.color}22`,
            border: `2px solid ${sel.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800,
            color: sel.color, flexShrink: 0,
          }}>
            {sel.player.username[0].toUpperCase()}
          </div>

          {/* Name + rank */}
          <div style={{ minWidth: 110 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {sel.player.username}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              color: sel.color, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Rank #{sel.player.rank ?? (series.indexOf(sel) + 1)}
            </div>
          </div>

          {/* Stats */}
          {[
            { label: 'Points',   value: fmt(sel.player.points) },
            { label: 'Solved',   value: sel.player.solved },
            { label: 'Accuracy', value: `${sel.player.accuracy}%` },
            { label: 'Streak',   value: `${sel.player.streak ?? '—'}d` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 60 }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '1rem',
                fontWeight: 800, color: sel.color, lineHeight: 1.1,
              }}>
                {value}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginTop: 2,
              }}>
                {label}
              </div>
            </div>
          ))}

          {/* Accuracy bar */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: 'var(--border-color)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${sel.player.accuracy}%`, height: '100%',
                background: sel.color, borderRadius: 2,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              color: 'var(--text-muted)', marginTop: 4,
            }}>
              Solve accuracy
            </div>
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setSelected(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem',
              lineHeight: 1, padding: '4px 6px', borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            aria-label="Close player info"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '5px 12px',
        paddingTop: 12, borderTop: '1px solid var(--border-color)',
      }}>
        {series.map((s, si) => {
          const isSelected = selected === si;
          const isDimmed   = selected !== null && !isSelected;
          return (
            <button
              key={s.player.id ?? si}
              type="button"
              onClick={() => setSelected(prev => prev === si ? null : si)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: isSelected ? `${s.color}14` : 'none',
                border: isSelected ? `1px solid ${s.color}40` : '1px solid transparent',
                borderRadius: 20, padding: '3px 10px 3px 6px',
                cursor: 'pointer',
                opacity: isDimmed ? 0.3 : 1,
                transition: 'opacity 0.22s ease, background 0.2s, border-color 0.2s',
              }}
            >
              {/* Color swatch */}
              <span style={{
                display: 'inline-block', width: 20, height: 3,
                borderRadius: 2, background: s.color, flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                color: isSelected ? s.color : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 400,
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}>
                #{s.player.rank ?? si + 1} {s.player.username}
              </span>
            </button>
          );
        })}
      </div>

      {/* Accessibility table */}
      <table className="visually-hidden">
        <caption>Score progression for top {rows.length} players</caption>
        <thead>
          <tr>
            <th scope="col">Rank</th><th scope="col">Player</th>
            <th scope="col">Points</th><th scope="col">Solved</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>
              <th scope="row">{i + 1}</th>
              <td>{r.username}</td><td>{fmt(r.points)}</td><td>{r.solved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
