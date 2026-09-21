import React, { useState, useEffect } from 'react';
import { Flag, Users, Plus, Eye, Layers, CheckCircle, FileText, Radio, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { challengeService } from '../../services/challengeService';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/ui/StatCard';

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

export default function AdminDashboard() {
  const { user } = useApp();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await challengeService.getAllChallenges();
      setChallenges(list);
      setLoading(false);
    })();
  }, []);

  const published = challenges.filter(c => c.status === 'published').length;
  const drafts     = challenges.filter(c => c.status === 'draft').length;
  const totalSolves = challenges.reduce((s, c) => s + (c.solves || 0), 0);
  const avgSolves = challenges.length ? Math.round(totalSolves / challenges.length) : 0;

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
    { label: 'Total Solves',     value: totalSolves, icon: Flag, color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.12)', animate: true },
    { label: 'Avg Solves / Chal', value: avgSolves, icon: Radio, color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.12)' },
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
                  {drafts} draft{ drafts === 1 ? '' : 's'} waiting · {avgSolves}/challenge avg solves
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
              <Link to="/admin/challenges" className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                View all <ArrowRight size={13} />
              </Link>
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
    </div>
  );
}