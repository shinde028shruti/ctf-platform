import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Flag, Zap, CheckCircle, Lightbulb, ArrowRight, Target, Medal,
  Swords, GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/ui/StatCard';
import Terminal from '../components/ui/Terminal';
import { challenges, categories } from '../data/challenges';

const termLines = [
  { type: 'cmd', text: './cyberforge --status', delay: 300 },
  { type: 'out', text: 'Platform: ONLINE', delay: 900 },
  { type: 'out', text: 'Active challenges: 18', delay: 1300 },
  { type: 'success', text: 'Keep hacking, operator.', delay: 2300 },
];

const ACTIVITY_COLORS = {
  solve: 'var(--accent-green)',
  badge: 'var(--accent-yellow)',
  hint: 'var(--accent-orange)',
};

function ActivityIcon({ type }) {
  const props = { size: 16 };
  const color = ACTIVITY_COLORS[type] || 'var(--accent-cyan)';
  if (type === 'solve') return <CheckCircle {...props} color={color} />;
  if (type === 'badge') return <Trophy {...props} color={color} />;
  if (type === 'hint') return <Lightbulb {...props} color={color} />;
  return <Zap {...props} color={color} />;
}

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function RingGauge({ value, size = 150, stroke = 12, color = 'var(--accent-green)', label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}%</div>
        {label && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>}
      </div>
    </div>
  );
}

const heroStyle = {
  background: 'linear-gradient(135deg, rgba(116,100,220,0.09) 0%, rgba(116,100,220,0.02) 45%, rgba(139,92,246,0.05) 100%)',
  border: '1px solid var(--border-bright)',
  borderRadius: 18,
  padding: '28px 32px',
  position: 'relative',
  overflow: 'hidden',
};

export default function Dashboard() {
  const { user } = useApp();
  const [recentChallenges, setRecentChallenges] = useState([]);

  const userType = user?.userType || 'student';
  const focusAreas = user?.onboarding?.focusAreas || [];
  const isStudent = userType === 'student';

  useEffect(() => {
    let unsolved;
    if (isStudent) {
      const diffOrder = { Easy: 0, Medium: 1, Hard: 2, Insane: 3 };
      unsolved = challenges
        .filter(c => !user?.solvedChallenges?.includes(c.id))
        .sort((a, b) => {
          const aMatch = focusAreas.includes(a.category) ? 0 : 1;
          const bMatch = focusAreas.includes(b.category) ? 0 : 1;
          if (aMatch !== bMatch) return aMatch - bMatch;
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        })
        .slice(0, 3);
    } else {
      unsolved = challenges.filter(c => !user?.solvedChallenges?.includes(c.id)).slice(0, 3);
    }
    setRecentChallenges(unsolved);
  }, [user, isStudent, focusAreas]);

  if (!user) return null;

  const totalChallenges = challenges.length;
  const solvedCount = user.solvedChallenges?.length || 0;
  const completionPct = Math.min(100, Math.round((solvedCount / totalChallenges) * 100));
  const elitePct = Math.min(100, Math.round((user.points / 10000) * 100));
  const level = Math.floor(user.points / 500) + 1;
  const levelPct = Math.round(((user.points % 500) / 500) * 100);

  const categoryStats = Object.entries(user.categoryStats || {})
    .filter(([, v]) => v.solved > 0)
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 5);

  const avgPtsPerSolve = solvedCount ? Math.round(user.points / solvedCount) : 0;
  const bestCategory = categoryStats[0];
  const catColor = name => categories.find(c => c.name === name)?.color || 'var(--accent-green)';

  const catValues = Object.values(user.categoryStats || {});
  const totalAvail = catValues.reduce((s, c) => s + c.total, 0);
  const totalSolved = catValues.reduce((s, c) => s + c.solved, 0);
  const overallPct = totalAvail ? Math.round((totalSolved / totalAvail) * 100) : 0;
  const masteredCount = catValues.filter(c => c.total > 0 && c.solved / c.total >= 0.5).length;
  const maxCatPts = categoryStats.length ? categoryStats[0][1].points : 1;
  const bestCatColor = bestCategory ? catColor(bestCategory[0]) : 'var(--accent-green)';

  const statMeta = [
    { icon: Zap, color: 'var(--accent-cyan)', bg: 'rgba(61,221,208,0.12)', value: user.points, label: 'Total Points' },
    { icon: CheckCircle, color: 'var(--accent-green)', bg: 'rgba(116,100,220,0.12)', value: solvedCount, label: 'Challenges Solved' },
    { icon: Medal, color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.12)', value: user.rank, label: 'Global Rank', prefix: '#', animate: false },
    { icon: Target, color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.12)', value: completionPct, label: 'Completion', suffix: '%' },
  ];

  return (
    <div className="page-container">
      <div className="animate-fade-in-up">
        <div style={heroStyle}>
          <div className="row align-items-center g-4 position-relative" style={{ zIndex: 1 }}>
            <div className="col-lg-8">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-green)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
                <span className="status-dot green" style={{ marginRight: 8 }} />
                Session Active
              </div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, margin: 0 }}>
                Welcome back, <span style={{ color: 'var(--accent-green)' }}>{user.username}</span>.
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.95rem', maxWidth: 520 }}>
                {isStudent
                  ? 'Follow your learning path. Challenges are curated to help you build skills step by step.'
                  : 'Sharpen your skills. Break the challenges. Capture the flag.'}
              </p>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: isStudent ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                  background: isStudent ? 'rgba(61,221,208,0.1)' : 'rgba(139,92,246,0.1)',
                  border: isStudent ? '1px solid rgba(61,221,208,0.25)' : '1px solid rgba(139,92,246,0.25)',
                  borderRadius: 20, padding: '5px 14px',
                }}>
                  {isStudent ? <GraduationCap size={13} /> : <Swords size={13} />}
                  {isStudent ? 'Student Mode' : 'Competitor Mode'}
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/challenges" className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                  <Swords size={15} /> Browse Challenges
                </Link>
                <Link to="/leaderboard" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                  <Trophy size={15} /> Leaderboard
                </Link>
              </div>
            </div>
            <div className="col-lg-4">
              <div style={{
                background: 'rgba(7,26,26,0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: 14,
                padding: '18px 20px',
                backdropFilter: 'blur(8px)',
              }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Global Rank</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1.1 }}>#{user.rank}</div>
                  </div>
                  <div className="text-end">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Level</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1.1 }}>{level}</div>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Elite progress</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 700 }}>{elitePct}%</span>
                </div>
                <div className="cf-progress">
                  <div className="cf-progress-bar" style={{ width: `${elitePct}%` }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  Level {level} · {levelPct}% to next
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-3 mb-4">
        {statMeta.map((s, i) => (
          <div key={s.label} className={`col-6 col-md-3 animate-fade-in-up delay-${i * 100}`}>
            <StatCard icon={s.icon} iconColor={s.color} iconBg={s.bg} {...s} />
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="mb-4 animate-fade-in-up delay-200">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="section-title">{isStudent ? 'Next Up In Your Learning Path' : 'Recommended For You'}</div>
              <Link to="/challenges" className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="d-flex flex-column gap-3">
              {recentChallenges.map(c => (
                <Link key={c.id} to={`/challenges/${c.id}`} className="text-decoration-none">
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(116,100,220,0.25)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Flag size={18} color="var(--accent-cyan)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{c.title}</div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-green)' }}>{c.category}</span>
                        <span className={`diff-badge diff-${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)', fontSize: '1rem' }}>{c.points}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>pts</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="animate-fade-in-up delay-300">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="section-title">Your Performance</div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent-green)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <span className="status-dot green" /> Live
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '22px' }}>
              <div className="row g-4 align-items-center">
                <div className="col-md-5 d-flex justify-content-center">
                  <RingGauge value={overallPct} color={bestCatColor} label="Completion" />
                </div>
                <div className="col-md-7">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trophy size={16} color={bestCatColor} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Best category</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: bestCatColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {bestCategory ? bestCategory[0] : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="row g-3">
                      <div className="col-6 d-flex flex-column gap-2">
                        {[
                          { label: 'Challenges solved', value: `${totalSolved}/${totalAvail}` },
                          { label: 'Categories mastered', value: masteredCount },
                        ].map(m => (
                          <div key={m.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{m.label}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="col-6 d-flex flex-column gap-2">
                        {[
                          { label: 'Avg pts / solve', value: avgPtsPerSolve },
                          { label: 'Level progress', value: `${levelPct}% to L${level + 1}` },
                        ].map(m => (
                          <div key={m.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{m.label}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: 2 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '20px 0 16px' }} />

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                Points by Category
              </div>
              <div className="d-flex flex-column gap-3">
                {categoryStats.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '16px 0' }}>
                    No categories solved yet. Start with a challenge!
                  </div>
                ) : categoryStats.map(([cat, stats]) => (
                  <div key={cat} className="d-flex align-items-center gap-3">
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: catColor(cat), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cat}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {stats.points} <span style={{ color: catColor(cat), fontWeight: 700 }}>pts</span>
                        </span>
                      </div>
                      <div className="cf-progress">
                        <div className="cf-progress-bar" style={{ width: `${Math.max(3, (stats.points / maxCatPts) * 100)}%`, background: catColor(cat) }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="mb-4 animate-fade-in-up delay-100">
            <div className="section-title mb-3">System Status</div>
            <Terminal lines={termLines} />
          </div>

          <div className="animate-fade-in-up delay-300">
            <div className="section-title mb-3">Recent Activity</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
              {(user.recentActivity || []).slice(0, 6).map((a, i) => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ActivityIcon type={a.type} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.challengeName || a.badge}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo(a.timestamp)}</div>
                  </div>
                  {a.points && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>
                      +{a.points}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}