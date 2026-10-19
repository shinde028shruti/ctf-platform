import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Flag, Trophy, Award,
  User, Settings, Shield, BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/challenges',  icon: Flag,            label: 'Challenges' },
  { to: '/leaderboard', icon: Trophy,          label: 'Leaderboard', color: 'var(--accent-green)' },
  { to: '/achievements', icon: Award,           label: 'Achievements' },
];

const accountItems = [
  { to: '/profile',  icon: User,     label: 'Profile', color: 'var(--accent-green)' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user } = useApp();

  return (
    <aside className="cf-sidebar d-none d-lg-flex flex-column">
      <div className="sidebar-section-label">Navigation</div>
      {navItems.map(({ to, icon: Icon, label, color }) => (
        <NavLink
          key={to} to={to}
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={16} color={color} />
          <span>{label}</span>
        </NavLink>
      ))}

      <div className="sidebar-section-label mt-2">Account</div>
      {accountItems.map(({ to, icon: Icon, label, color }) => (
        <NavLink
          key={to} to={to}
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={16} color={color} />
          <span>{label}</span>
        </NavLink>
      ))}

      {user?.role === 'admin' && (
        <>
          <div className="sidebar-section-label mt-2">Admin</div>
          <NavLink to="/admin" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Shield size={16} />
            <span>Admin Panel</span>
          </NavLink>
        </>
      )}

      {/* User stats mini */}
      {user && (
        <div style={{
          marginTop: 'auto',
          padding: '14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 900, color: '#0A0917',
            }}>
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.username?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName || user.username}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                @{user.username}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Your Stats
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Points</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700 }}>
              {user.points?.toLocaleString()}
            </span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Streak</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-orange)', fontWeight: 700 }}>
              {user.streak ? `${user.streak} days` : '—'}
            </span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rank</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {user.rank != null ? `#${user.rank}` : '—'}
            </span>
          </div>
          {user.progression && (
            <>
              <div className="cf-progress">
                <div className="cf-progress-bar" style={{ width: `${user.progression.elitePct}%` }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                L{user.progression.level} {user.progression.tier}
                {!user.progression.isMax && ` · ${user.progression.elitePct}% to Elite`}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
