import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Shield, Menu, X, ChevronDown, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import NotificationPanel from '../ui/NotificationPanel';
import SearchOverlay from '../ui/SearchOverlay';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { unreadCount } = useApp();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/challenges', label: 'Challenges' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/events', label: 'Events' },
    { to: '/about', label: 'About' },
  ];

  return (
    <>
      <nav className="cf-navbar d-flex align-items-center px-3 px-lg-4">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="d-flex align-items-center gap-2 me-4 text-decoration-none">
          <div style={{ width: 32, height: 32 }}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 6 L54 17 L54 39 C54 52 32 60 32 60 C32 60 10 52 10 39 L10 17 Z"
                fill="none" stroke="url(#shield-grad)" strokeWidth="2.5"/>
              <path d="M23 32 L30 39 L42 25" stroke="url(#shield-grad)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="shield-grad" x1="10" y1="6" x2="54" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00ff88"/>
                  <stop offset="1" stopColor="#0ec9b5"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-name d-none d-sm-block">CyberForge</span>
        </Link>

        {/* Desktop Nav */}
        {isAuthenticated && (
          <div className="d-none d-lg-flex align-items-center gap-1 me-auto">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
        {!isAuthenticated && <div className="me-auto" />}

        {/* Right actions */}
        <div className="d-flex align-items-center gap-2 ms-auto ms-lg-0">
          {/* Search */}
          <button className="icon-btn" onClick={() => setSearchOpen(true)} title="Search (Ctrl+K)">
            <Search size={16} />
          </button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}>
                  <Bell size={16} />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
              </div>

              {/* Profile dropdown */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  className="avatar-btn"
                  onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                >
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </button>
                {profileOpen && (
                  <div className="cf-dropdown" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 1050 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{user?.points?.toLocaleString()} pts</div>
                    </div>
                    <button className="cf-dropdown-item" onClick={() => { navigate('/profile'); setProfileOpen(false); }}>
                      <User size={14} /> Profile
                    </button>
                    <button className="cf-dropdown-item" onClick={() => { navigate('/dashboard'); setProfileOpen(false); }}>
                      <LayoutDashboard size={14} /> Dashboard
                    </button>
                    {user?.role === 'admin' && (
                      <button className="cf-dropdown-item" onClick={() => { navigate('/admin'); setProfileOpen(false); }}>
                        <Shield size={14} /> Admin Panel
                      </button>
                    )}
                    <button className="cf-dropdown-item" onClick={() => { navigate('/settings'); setProfileOpen(false); }}>
                      <Settings size={14} /> Settings
                    </button>
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 4 }}>
                      <button className="cf-dropdown-item danger" onClick={handleLogout}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button className="icon-btn d-lg-none" onClick={() => setMenuOpen(o => !o)}>
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-outline-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isAuthenticated && menuOpen && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '12px 16px',
          position: 'sticky', top: 64, zIndex: 999
        }}>
          {navLinks.map(l => (
            <NavLink
              key={l.to} to={l.to}
              className={({ isActive }) => `d-block py-2 px-3 mb-1 rounded text-decoration-none ${isActive ? 'text-accent' : ''}`}
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
