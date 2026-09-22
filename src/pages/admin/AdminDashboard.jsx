import React, { useState, useEffect } from 'react';
import { Flag, Users, Plus, Eye, Layers, CheckCircle, FileText, Radio, ArrowRight, ShieldCheck, Activity, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { challengeService } from '../../services/challengeService';
import { adminService } from '../../services/adminService';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/ui/StatCard';
import { downloadCsv } from '../../utils/exportUtils';

const heroStyle = {
  background: 'linear-gradient(135deg, rgba(116,100,220,0.09) 0%, rgba(116,100,220,0.02) 45%, rgba(139,92,246,0.05) 100%)',
  border: '1px solid var(--border-bright)',
  borderRadius: 18,
  padding: '28px 32px',
  position: 'relative',
  overflow: 'hidden',
};

const quickActions = [
  { to: '/admin/challenges/new', label: 'Create Challenge', icon: Plus,    color: 'var(--accent-green)' },
  { to: '/admin/challenges',     label: 'Manage Challenges', icon: Layers,  color: 'var(--accent-cyan)' },
  { to: '/admin/users',          label: 'View Users',        icon: Users,   color: 'var(--accent-purple)' },
  { to: '/challenges',           label: 'View Platform',     icon: Eye,     color: 'var(--accent-orange)' },
];

function AuditPreview() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLogs((await adminService.getAuditLogs()).slice(0, 6));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Loading...</div>;
  }

  return (
    <div className="d-flex flex-column">
      {logs.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>No activity yet.</div>
      ) : (
        logs.map(log => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0,
              background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={13} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{log.actor}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}> {log.action.replace('.', ' · ')} </span>
                <span style={{ fontWeight: 600 }}>{log.target}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: 'var(--text-muted)' }}>{log.timestamp} · {log.ip}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useApp();
  const [challenges, setChallenges] = useState([]);
  const [solves, setSolves] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [list, s, u] = await Promise.all([
        challengeService.getAllChallenges(),
        adminService.getSolvesHistory(),
        adminService.getUsers(),
      ]);
      setChallenges(list); setSolves(s); setAdminUsers(u); setLoading(false);
    })();
  }, []);

  const published = challenges.filter(c => c.status === 'published').length;
  const drafts     = challenges.filter(c => c.status === 'draft').length;
  const scheduled  = challenges.filter(c => c.status === 'scheduled').length;
  const totalSolves = challenges.reduce((s, c) => s + (c.solves || 0), 0);
  const avgSolves = challenges.length ? Math.round(totalSolves / challenges.length) : 0;

  const liveSolves = solves.filter(s => s.correct).length;
  const liveAttempts = solves.length;

  const recentSolves = [...solves].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 8);
  const challengeTitle = (id) => challenges.find(c => c.id === Number(id))?.title || `Challenge #${id}`;

  const exportLeaderboard = () => {
    const rows = [...adminUsers]
      .sort((a, b) => b.points - a.points)
      .map((u, i) => ({ rank: i + 1, username: u.username, email: u.email, role: u.role, solved: u.solved, points: u.points, status: u.status }));
    downloadCsv({ filename: `leaderboard-${new Date().toISOString().slice(0, 10)}.csv`, columns: ['rank', 'username', 'email', 'role', 'solved', 'points', 'status'], rows });
  };

  const byCategory = [...challenges.reduce((m, c) => {
    m.set(c.category, (m.get(c.category) || 0) + 1);
    return m;
  }, new Map())].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const recent = [...challenges].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const maxCatCount = byCategory.length ? byCategory[0][1] : 1;
  const publishPct = challenges.length ? Math.round((published / challenges.length) * 100) : 0;

  const stats = [
    { label: 'Total Challenges', value: challenges.length, icon: Layers, color: 'var(--accent-cyan)', bg: 'rgba(61,221,208,0.12)' },
    { label: 'Published',        value: published, icon: CheckCircle, color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Drafts',           value: drafts, icon: FileText, color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.12)' },
    { label: 'Scheduled',        value: scheduled, icon: Radio, color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.12)', hint: scheduled ? 'Auto-publish armed' : undefined },
    { label: 'Total Solves',     value: totalSolves, icon: Flag, color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.12)', animate: true },
    { label: 'Live Flags',       value: liveSolves, icon: Activity, color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.12)', hint: `${liveAttempts} attempts recorded` },
  ];

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="animate-fade-in-up">
        <div style={heroStyle}>
          <div className="row align-items-center g-4 position-relative" style={{ zIndex: 1 }}>
            <div className="col-lg-8">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-green)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
                <span className="status-dot green" style={{ marginRight: 8 }} />
                Admin Session Active
              </div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, margin: 0 }}>
                Welcome back, <span style={{ color: 'var(--accent-green)' }}>{user.username}</span>.
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.95rem', maxWidth: 520 }}>
                Administer the platform. Publish challenges, review submissions, and keep the field running.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--accent-purple)',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: 20, padding: '5px 14px',
                }}>
                  <ShieldCheck size={13} />
                  Administrator Access
                </span>
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
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Challenges</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1.1 }}>{challenges.length}</div>
                  </div>
                  <div className="text-end">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Published</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1.1 }}>{published}</div>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Publish rate</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 700 }}>{publishPct}%</span>
                </div>
                <div className="cf-progress">
                  <div className="cf-progress-bar" style={{ width: `${publishPct}%` }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  {drafts} draft{drafts === 1 ? '' : 's'} · {scheduled} scheduled · {avgSolves}/challenge avg solves
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mt-4 mb-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`col-6 col-md-4 col-xl animate-fade-in-up delay-${i * 100}`}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-5">
        <div className="section-title mb-3">Quick Actions</div>
        <div className="row g-3">
          {quickActions.map(({ to, label, icon: Icon, color }) => (
            <div key={to} className="col-6 col-lg-3">
              <Link to={to} className="text-decoration-none">
                <div className="cf-card p-3 text-center cf-card-glow" style={{ cursor: 'pointer', height: '100%' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, margin: '0 auto 10px' }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    Navigate <ArrowRight size={11} />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Recent challenges */}
        <div className="col-lg-8">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title">Recent Challenges</div>
              <div className="d-flex align-items-center gap-2">
                <button onClick={exportLeaderboard} className="d-flex align-items-center gap-1" style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  <Download size={13} /> Export CSV
                </button>
                <Link to="/admin/challenges" className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  View all <ArrowRight size={13} />
                </Link>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Loading challenges...
              </div>
            ) : recent.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                No challenges yet. Create your first one.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      {['Challenge', 'Category', 'Difficulty', 'Solves', 'Status'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</td>
                        <td><span className="cat-chip" style={{ fontSize: '0.65rem' }}>{c.category}</span></td>
                        <td><span className={`diff-badge diff-${c.difficulty.toLowerCase()}`}>{c.difficulty}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{c.solves}</td>
                        <td>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                            color: c.status === 'published' ? 'var(--diff-easy)' : 'var(--accent-yellow)',
                            background: c.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                            padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
                          }}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Category distribution */}
        <div className="col-lg-4">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px 20px', height: '100%' }}>
            <div className="section-title mb-4">Challenges by Category</div>
            {loading ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Loading...</div>
            ) : byCategory.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>No data yet.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {byCategory.map(([cat, count]) => (
                  <div key={cat}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cat}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {count} <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>chal</span>
                      </span>
                    </div>
                    <div className="cf-progress">
                      <div className="cf-progress-bar" style={{ width: `${Math.max(3, (count / maxCatCount) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live activity feed */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title d-flex align-items-center gap-2">
                <span className="status-dot green" /> Recent Solves
              </div>
              <Link to="/admin/analytics" className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Analytics <ArrowRight size={13} />
              </Link>
            </div>
            {recentSolves.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                No solve activity recorded yet.
              </div>
            ) : (
              <div>
                {recentSolves.map((s, i) => {
                  const chal = challenges.find(c => c.id === Number(s.challengeId));
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < recentSolves.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: s.correct ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${s.correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-primary)',
                      }}>
                        {s.user.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>{s.user}</span>{' '}
                          {s.correct ? 'solved' : 'failed'}{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>{chal?.title || `#${s.challengeId}`}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>{s.submittedAt}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800, color: s.correct ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {s.correct ? 'SOLVED' : 'MISS'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px 20px', height: '100%' }}>
            <div className="section-title mb-3 d-flex align-items-center gap-2">
              <Radio size={14} color="var(--accent-cyan)" /> Recent Admin Activity
            </div>
            <AuditPreview />
          </div>
        </div>
      </div>
    </div>
  );
}