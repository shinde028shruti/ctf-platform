import React, { useState, useEffect } from 'react';
import { Flag, Users, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { challengeService } from '../../services/challengeService';

export default function AdminDashboard() {
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

  const stats = [
    { label: 'Total Challenges', value: challenges.length },
    { label: 'Published',        value: published },
    { label: 'Drafts',           value: drafts },
    { label: 'Total Solves',     value: totalSolves.toLocaleString() },
    { label: 'Registered Users', value: 4820 },
  ];

  const recent = [...challenges].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="col-6 col-md-4 col-lg">
            <div className="stat-card">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="row g-3 mb-4">
        {[
          { to: '/admin/challenges/new',  label: 'Create Challenge', icon: Plus,      color: 'var(--accent-green)' },
          { to: '/admin/challenges',      label: 'Manage Challenges', icon: Flag,     color: 'var(--accent-cyan)' },
          { to: '/admin/users',           label: 'View Users',       icon: Users,     color: 'var(--accent-green)' },
          { to: '/challenges',            label: 'View Platform',    icon: Eye,       color: 'var(--accent-green)' },
        ].map(({ to, label, icon: Icon, color }) => (
          <div key={to} className="col-6 col-md-3">
            <Link to={to} className="text-decoration-none">
              <div className="cf-card p-3 text-center cf-card-glow" style={{ cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, margin: '0 auto 10px' }}>
                  <Icon size={20} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Recent challenges */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-title">Recent Challenges</div>
          <Link to="/admin/challenges" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View all</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              {['Challenge', 'Category', 'Difficulty', 'Solves', 'Status', 'Created'].map(h => (
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
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
