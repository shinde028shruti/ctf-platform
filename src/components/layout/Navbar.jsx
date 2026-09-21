import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Bell, Shield, LogOut, User, Settings, LayoutDashboard, Menu, Search, X, TerminalSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import NotificationPanel from '../ui/NotificationPanel';
import UniversalSearch from '../ui/UniversalSearch';
import PowerShellTerminal from '../ui/PowerShellTerminal';
import Sidebar from './Sidebar';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [psOpen, setPsOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    setMobileNavOpen(false);
    setSearchOpen(false);
    setPsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  const { unreadCount } = useApp();
  const isLanding = location.pathname === '/';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="cf-navbar d-flex align-items-center px-3 px-lg-4">
        {/* Mobile hamburger */}
        <button
          className="icon-btn d-lg-none me-2"
          aria-label="Open navigation menu"
          onClick={() => setMobileNavOpen(o => !o)}
          style={{ flexShrink: 0 }}
        >
          {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="d-flex align-items-center gap-2 me-4 text-decoration-none">
          <div style={{ width: 32, height: 32, filter: 'drop-shadow(0 0 8px rgba(119,100,224,0.55))' }}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 6 L54 17 L54 39 C54 52 32 60 32 60 C32 60 10 52 10 39 L10 17 Z"
                fill="none" stroke="url(#shield-grad)" strokeWidth="2.5"/>
              <path d="M23 32 L30 39 L42 25" stroke="url(#shield-grad)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="shield-grad" x1="10" y1="6" x2="54" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F1F71"/>
                  <stop offset="1" stopColor="#7764E0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-name d-none d-sm-block">CyberForge</span>
        </Link>

        {/* Universal search (desktop) */}
        {!isLanding && <UniversalSearch />}

        {/* Right actions */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Mobile search toggle */}
          {!isLanding && (
            <button
              className="icon-btn d-md-none"
              aria-label="Toggle search"
              onClick={() => setSearchOpen(o => !o)}
            >
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
          )}

          {isAuthenticated ? (
            <>
              {/* PowerShell console */}
              <button className="icon-btn" title="PowerShell console" onClick={() => { setPsOpen(o => !o); setNotifOpen(false); setProfileOpen(false); }}>
                <TerminalSquare size={16} />
              </button>

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
                      <User size={14} color="var(--accent-green)" /> Profile
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

            </>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-outline-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile search bar */}
      {!isLanding && searchOpen && (
        <div className="cf-mobile-search">
          <UniversalSearch mobile onNavigate={() => setSearchOpen(false)} />
        </div>
      )}

      {/* Mobile sidebar drawer */}
      {mobileNavOpen && (
        <>
          <div className="mobile-backdrop d-lg-none" onClick={() => setMobileNavOpen(false)} />
          <div className="mobile-drawer d-lg-none">
            <Sidebar />
          </div>
        </>
      )}

      {/* PowerShell console drawer */}
      {psOpen && <PowerShellTerminal onClose={() => setPsOpen(false)} />}
    </>
  );
}
