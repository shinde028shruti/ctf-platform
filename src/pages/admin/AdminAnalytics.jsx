import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Activity, Target, Trophy, Flag, Download, Radio, Users as UsersIcon, Zap } from 'lucide-react';
import { challengeService } from '../../services/challengeService';
import { adminService } from '../../services/adminService';
import { downloadCsv } from '../../utils/exportUtils';

const DIFF_COLORS = {
  easy: 'var(--diff-easy)', medium: 'var(--accent-yellow)', hard: 'var(--diff-hard)', insane: 'var(--accent-red)',
};

const rating = (diff) => ({ easy: 1, medium: 2, hard: 3, insane: 4 }[diff] || 2);

export default function AdminAnalytics() {
  const [challenges, setChallenges] = useState([]);
  const [solves, setSolves] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, s, u] = await Promise.all([
        challengeService.getAllChallenges(),
        adminService.getSolvesHistory(),
        adminService.getUsers(),
      ]);
      setChallenges(c); setSolves(s); setUsers(u); setLoading(false);
    })();
  }, []);

  const analysis = useMemo(() => {
    const totalAttempts = solves.length;
    const totalCorrect = solves.filter(s => s.correct).length;
    const successRate = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const uniqueSolvers = new Set(solves.filter(s => s.correct).map(s => s.user)).size;

    const byChallenge = challenges.map(ch => {
      const events = solves.filter(s => s.challengeId === ch.id);
      const correct = events.filter(s => s.correct);
      const firstBlood = correct.length
        ? correct.reduce((a, b) => (a.submittedAt <= b.submittedAt ? a : b))
        : null;
      return {
        ...ch,
        attempts: events.length,
        correct: correct.length,
        successRate: events.length ? Math.round((correct.length / events.length) * 100) : null,
        firstBlood,
      };
    }).sort((a, b) => b.correct - a.correct);

    const topSolvers = [...solves
      .filter(s => s.correct)
      .reduce((m, s) => m.set(s.user, (m.get(s.user) || 0) + 1), new Map())]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([username, count], i) => ({
        username,
        count,
        points: users.find(u => u.username === username)?.points || 0,
        rank: i + 1,
      }));

    const now = new Date();
    const localKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (13 - i));
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      return { label, key: localKey(d), count: 0 };
    });
    const dayIndex = {};
    days.forEach((d, i) => { dayIndex[d.key] = i; });
    solves.filter(s => s.correct).forEach(s => {
      const key = s.submittedAt.slice(0, 10);
      if (key in dayIndex) days[dayIndex[key]].count += 1;
    });
    const maxDay = Math.max(1, ...days.map(d => d.count));

    return { totalAttempts, totalCorrect, successRate, uniqueSolvers, byChallenge, topSolvers, days, maxDay };
  }, [challenges, solves, users]);

  if (loading) {
    return <div className="page-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading analytics...</div>;
  }

  const metricCards = [
    { icon: Activity, value: analysis.totalAttempts, label: 'Flag Submissions', color: 'var(--accent-cyan)' },
    { icon: Target,   value: `${analysis.successRate}%`, label: 'Success Rate', color: 'var(--accent-green)' },
    { icon: UsersIcon, value: analysis.uniqueSolvers, label: 'Unique Solvers', color: 'var(--accent-purple)' },
    { icon: Zap,      value: analysis.totalCorrect,  label: 'Correct Flags',  color: 'var(--accent-orange)' },
  ];

  const exportReport = () => {
    downloadCsv({
      filename: `challenge-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: ['title', 'category', 'difficulty', 'points', 'solves', 'attempts', 'correct', 'successRateMetric', 'firstBlood'],
      rows: analysis.byChallenge.map(c => ({
        title: c.title,
        category: c.category,
        difficulty: c.difficulty,
        points: c.points,
        solves: c.solves,
        attempts: c.attempts,
        correct: c.correct,
        successRateMetric: c.successRate == null ? '' : `${c.successRate}%`,
        firstBlood: c.firstBlood ? `${c.firstBlood.user} @ ${c.firstBlood.submittedAt}` : '',
      })),
    });
  };

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Challenge Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0' }}>
            Live solve trends across the last 14 days of activity.
          </p>
        </div>
        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={exportReport}>
          <Download size={15} /> Export Report (CSV)
        </button>
      </div>

      <div className="row g-3 mb-4">
        {metricCards.map(m => (
          <div key={m.label} className="col-6 col-md-3">
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                  <m.icon size={18} />
                </div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{m.value}</div>
              </div>
              <div className="stat-label">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        {/* Solve trend */}
        <div className="col-lg-8">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px 20px' }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="section-title d-flex align-items-center gap-2">
                <TrendingUp size={15} color="var(--accent-green)" /> Solves — Last 14 Days
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {analysis.days.reduce((s, d) => s + d.count, 0)} correct flags
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
              {analysis.days.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: d.count ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{d.count || ''}</span>
                  <div style={{
                    width: '100%', maxWidth: 26, borderRadius: '5px 5px 0 0',
                    background: d.count ? 'linear-gradient(180deg, var(--accent-green), rgba(16,185,129,0.35))' : 'var(--bg-elevated)',
                    height: `${Math.max(4, (d.count / analysis.maxDay) * 100)}%`,
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top solvers */}
        <div className="col-lg-4">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px 20px', height: '100%' }}>
            <div className="section-title mb-3 d-flex align-items-center gap-2">
              <Trophy size={15} color="var(--accent-yellow)" /> Top Solvers
            </div>
            <div className="d-flex flex-column gap-2">
              {analysis.topSolvers.map(s => (
                <div key={s.username} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: s.rank === 1 ? 'rgba(234,179,8,0.2)' : 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800,
                    color: s.rank === 1 ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                  }}>{s.rank}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.username}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>{s.points.toLocaleString()} pts</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-green)' }}>{s.count}</span>
                </div>
              ))}
              {analysis.topSolvers.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>No solves recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Per-challenge table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-title d-flex align-items-center gap-2">
            <Flag size={15} color="var(--accent-purple)" /> Per-Challenge Performance
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {analysis.byChallenge.length} challenges
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                {['Challenge', 'Difficulty', 'Total Solves', 'Live Attempts', 'Correct', 'Success Rate', 'First Blood'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {analysis.byChallenge.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No challenges yet.</td></tr>
              ) : analysis.byChallenge.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.category}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: DIFF_COLORS[c.difficulty.toLowerCase()] || 'var(--text-muted)' }}>
                      {'▮'.repeat(rating(c.difficulty))}{'▯'.repeat(4 - rating(c.difficulty))}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{c.solves.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.attempts}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: c.correct ? 'var(--accent-green)' : 'var(--text-muted)' }}>{c.correct}</td>
                  <td>
                    {c.successRate == null ? (
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>—</span>
                    ) : (
                      <div style={{ minWidth: 90 }}>
                        <div className="d-flex justify-content-between mb-1">
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: c.successRate >= 60 ? 'var(--accent-green)' : c.successRate >= 30 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>{c.successRate}%</span>
                        </div>
                        <div className="cf-progress" style={{ height: 5 }}>
                          <div className="cf-progress-bar" style={{ width: `${c.successRate}%`, background: c.successRate >= 60 ? 'var(--accent-green)' : c.successRate >= 30 ? 'var(--accent-yellow)' : 'var(--accent-red)' }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {c.firstBlood ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Radio size={12} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{c.firstBlood.user}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{c.firstBlood.submittedAt.slice(0, 10)}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>No live data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}