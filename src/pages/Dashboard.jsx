import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Flag, Zap, Flame, TrendingUp, CheckCircle, Clock, Lightbulb, ArrowRight, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/ui/StatCard';
import Terminal from '../components/ui/Terminal';
import { challenges } from '../data/challenges';

const termLines = [
  { type: 'cmd', text: './cyberforge --status', delay: 300 },
  { type: 'out', text: 'Platform: ONLINE', delay: 900 },
  { type: 'out', text: 'Active challenges: 18', delay: 1300 },
  { type: 'out', text: 'Your streak: 7 days 🔥', delay: 1700 },
  { type: 'success', text: 'Keep hacking, operator.', delay: 2300 },
];

function ActivityIcon({ type }) {
  const props = { size: 14 };
  if (type === 'solve') return <CheckCircle {...props} color="var(--accent-green)" />;
  if (type === 'badge') return <Trophy {...props} color="#ffd700" />;
  if (type === 'hint') return <Lightbulb {...props} color="var(--accent-yellow)" />;
  return <Zap {...props} color="var(--accent-cyan)" />;
}

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function Dashboard() {
  const { user } = useApp();
  const [recentChallenges, setRecentChallenges] = useState([]);

  useEffect(() => {
    const unsolved = challenges.filter(c => !user?.solvedChallenges?.includes(c.id)).slice(0, 3);
    setRecentChallenges(unsolved);
  }, [user]);

  if (!user) return null;

  const totalChallenges = challenges.length;
  const solvedCount = user.solvedChallenges?.length || 0;
  const completionPct = Math.round((solvedCount / totalChallenges) * 100);

  const categoryStats = Object.entries(user.categoryStats || {})
    .filter(([, v]) => v.solved > 0)
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 5);

  return (
    <div className="page-container">
      {/* Welcome */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div className="animate-fade-in-up">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-green)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            <span className="status-dot green" style={{ marginRight: 8 }} />
            Session Active
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, margin: 0 }}>
            Welcome back, <span style={{ color: 'var(--accent-green)' }}>{user.username}</span>.
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.95rem' }}>
            Sharpen your skills. Break the challenges. Capture the flag.
          </p>
        </div>
        <div className="d-flex gap-2 animate-fade-in delay-200">
          <Link to="/challenges" className="btn btn-primary d-flex align-items-center gap-2">
            <Flag size={16} /> New Challenge
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { value: user.points, label: 'Total Points', icon: Zap, color: 'var(--accent-green)', trend: 200 },
          { value: solvedCount, label: 'Challenges Solved', icon: Flag, color: 'var(--accent-cyan)' },
          { value: user.rank, label: 'Global Rank', icon: Trophy, color: '#ffd700', prefix: '#', animate: false },
          { value: user.streak, label: 'Day Streak', icon: Flame, color: 'var(--accent-orange)', suffix: ' Days' },
          { value: completionPct, label: 'Completion', icon: Target, color: 'var(--accent-purple)', suffix: '%' },
        ].map((s, i) => (
          <div key={s.label} className={`col-6 col-md-4 col-lg animate-fade-in-up delay-${i * 100}`}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Left column */}
        <div className="col-lg-8">
          {/* Recommended challenges */}
          <div className="mb-4 animate-fade-in-up delay-200">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="section-title">Recommended For You</div>
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
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,136,0.25)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Flag size={18} color="var(--accent-cyan)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{c.title}</div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="cat-chip" style={{ fontSize: '0.62rem' }}>{c.category}</span>
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

          {/* Category performance */}
          <div className="animate-fade-in-up delay-300">
            <div className="section-title mb-3">Category Performance</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '20px' }}>
              {categoryStats.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '20px 0' }}>
                  No categories solved yet. Start with a challenge!
                </div>
              ) : categoryStats.map(([cat, stats]) => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {stats.solved}/{stats.total} · {stats.points} pts
                    </span>
                  </div>
                  <div className="cf-progress">
                    <div className="cf-progress-bar" style={{ width: `${(stats.solved / stats.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-lg-4">
          {/* Terminal */}
          <div className="mb-4 animate-fade-in-up delay-100">
            <div className="section-title mb-3">System Status</div>
            <Terminal lines={termLines} />
          </div>

          {/* Recent activity */}
          <div className="animate-fade-in-up delay-200">
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
