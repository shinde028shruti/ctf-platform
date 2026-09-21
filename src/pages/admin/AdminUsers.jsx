import React, { useState } from 'react';
import { Search, Users as UsersIcon, Shield, ShieldCheck, UserCheck, Trash2, Ban, MailOpen } from 'lucide-react';
import { adminUsers } from '../../data/admin';

const ROLE_COLORS = { admin: 'var(--accent-purple)', moderator: 'var(--accent-cyan)', user: 'var(--text-muted)' };

function statusBadge(status) {
  const map = {
    active:    { color: 'var(--diff-easy)',   bg: 'rgba(16,185,129,0.1)' },
    suspended: { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.1)' },
    banned:    { color: 'var(--diff-hard)',    bg: 'rgba(239,68,68,0.1)' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      color: s.color, background: s.bg, padding: '2px 10px', borderRadius: 20,
    }}>
      {status}
    </span>
  );
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = adminUsers.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.username.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount     = adminUsers.filter(u => u.status === 'active').length;
  const adminsCount     = adminUsers.filter(u => u.role === 'admin').length;
  const moderatorsCount = adminUsers.filter(u => u.role === 'moderator').length;

  const statCards = [
    { icon: UsersIcon, value: adminUsers.length,  label: 'Total Users',     color: 'var(--accent-cyan)' },
    { icon: UserCheck, value: activeCount,        label: 'Active',          color: 'var(--accent-green)' },
    { icon: Shield,    value: moderatorsCount, label: 'Moderators',     color: 'var(--accent-yellow)' },
    { icon: ShieldCheck, value: adminsCount,      label: 'Admins',          color: 'var(--accent-purple)' },
  ];

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>User Management</h1>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {['all', 'admin', 'moderator', 'user'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ textTransform: 'capitalize' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <s.icon size={18} />
                </div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search username or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                {['User', 'Role', 'Points', 'Solved', 'Status', 'Joined', 'Last Active', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No users found</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: 34, height: 34, borderRadius: 50, flexShrink: 0,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                          color: 'var(--accent-green)', textTransform: 'uppercase',
                        }}>
                          {u.username.slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.username}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        color: ROLE_COLORS[u.role] || 'var(--text-muted)', padding: '2px 8px', borderRadius: 20,
                        background: u.role === 'admin' ? 'rgba(139,92,246,0.12)' : u.role === 'moderator' ? 'rgba(61,221,208,0.12)' : 'transparent',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{u.points.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{u.solved}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{u.joinDate}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{u.lastActive}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button onClick={() => {}} style={{ background: 'rgba(61,221,208,0.1)', border: '1px solid rgba(61,221,208,0.28)', color: 'var(--accent-cyan)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Send email">
                          <MailOpen size={14} />
                        </button>
                        <button onClick={() => {}} style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.28)', color: 'var(--accent-yellow)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Suspend">
                          <Ban size={14} />
                        </button>
                        <button onClick={() => {}} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--accent-red)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}