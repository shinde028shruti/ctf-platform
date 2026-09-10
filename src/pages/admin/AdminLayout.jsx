import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flag, PlusCircle, Tag, Users, FileText, Calendar, Settings, ChevronLeft, Menu, Shield, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const adminNav = [
  { to: '/admin',                 icon: LayoutDashboard, label: 'Dashboard',         end: true },
  { to: '/admin/challenges',      icon: Flag,            label: 'Challenges' },
  { to: '/admin/challenges/new',  icon: PlusCircle,      label: 'Create Challenge' },
  { to: '/admin/categories',      icon: Tag,             label: 'Categories' },
  { to: '/admin/users',           icon: Users,           label: 'Users' },
  { to: '/admin/submissions',     icon: FileText,        label: 'Submissions' },
  { to: '/admin/events',          icon: Calendar,        label: 'Events' },
  { to: '/admin/settings',        icon: Settings,        label: 'Settings' },
];

export default function AdminLayout() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 220,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        padding: '16px 8px',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, transition: 'width 0.25s ease',
        position: 'sticky', top: 64,
        height: 'calc(100vh - 64px)', overflowY: 'auto', overflowX: 'hidden',
        zIndex: 100,
      }}
        className="d-none d-lg-flex"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: 20, padding: '0 6px' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="var(--accent-green)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Admin
              </span>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-green)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
          </button>
        </div>

        {adminNav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '10px 14px', marginBottom: 2 }}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: collapsed ? '10px' : '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', transition: 'color 0.15s', justifyContent: collapsed ? 'center' : 'flex-start' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ChevronLeft size={16} />
            {!collapsed && 'Back to App'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {/* Mobile admin header */}
        <div className="d-flex d-lg-none align-items-center gap-3 px-3 py-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 64, zIndex: 99 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-secondary)', padding: '6px 10px', cursor: 'pointer', display: 'flex' }}>
            <Menu size={16} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-green)' }}>Admin Panel</span>
        </div>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', zIndex: 950, padding: '16px 8px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="var(--accent-green)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>ADMIN PANEL</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            {adminNav.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} /><span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}
