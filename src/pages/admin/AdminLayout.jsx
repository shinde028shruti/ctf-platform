import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flag, PlusCircle, Tag, Users, FileText, Calendar, Settings, ScrollText, ChevronLeft, Menu, Shield, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const adminNav = [
  { to: '/admin',                 icon: LayoutDashboard, label: 'Dashboard',         end: true },
  { to: '/admin/challenges',      icon: Flag,            label: 'Challenges' },
  { to: '/admin/challenges/new',  icon: PlusCircle,      label: 'Create Challenge' },
  { to: '/admin/categories',      icon: Tag,             label: 'Categories' },
  { to: '/admin/users',           icon: Users,           label: 'Users' },
  { to: '/admin/submissions',     icon: FileText,        label: 'Submissions' },
  // { to: '/admin/events',          icon: Calendar,        label: 'Events' },
  { to: '/admin/audit-logs',     icon: ScrollText,      label: 'Audit Logs' },
  { to: '/admin/settings',        icon: Settings,        label: 'Settings' },
];

export default function AdminLayout() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-height))', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900 }}
        />
      )}

      {/* Sidebar */}
      <aside className="cf-sidebar d-none d-lg-flex flex-column" style={{ height: '100%', minHeight: '100%', position: 'static', marginTop: 0, paddingTop: 24 }}>
        <div className="sidebar-section-label">Admin</div>
        {adminNav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* System section hidden
        <div className="sidebar-section-label mt-2">System</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="sidebar-nav-item"
          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.875rem' }}
        >
          <ChevronLeft size={16} style={{ flexShrink: 0 }} />
          <span>Back to App</span>
        </button>
        */}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100%', minHeight: 0 }}>
        {/* Mobile admin header */}
        <div className="d-flex d-lg-none align-items-center gap-3 px-3 py-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 99 }}>
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
