import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Terminal, Lock, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const BG_LINES = [
  '> Initializing secure channel...',
  '> Establishing encrypted connection...',
  '> Verifying identity...',
  '> Access terminal ready.',
];

function AnimatedBg() {
  const [lines, setLines] = useState([]);
  useEffect(() => {
    BG_LINES.forEach((l, i) => {
      setTimeout(() => setLines(prev => [...prev, l]), i * 900);
    });
  }, []);
  return (
    <div style={{
      position: 'absolute', bottom: 40, left: 40,
      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
      color: 'rgba(14,201,181,0.2)', lineHeight: 2,
      pointerEvents: 'none',
    }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}

export default function Login() {
  const { login, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const u = await login(form.identifier, form.password);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
    setLoading(false);
  };

  const demoLogin = async (role = 'user') => {
    setLoading(true);
    try {
      const creds = role === 'admin' ? ['admin', 'admin123'] : ['h4ck3r_x', 'password123'];
      const u = await login(...creds);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <AnimatedBg />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(14,201,181,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14,201,181,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '0 16px' }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
            <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
              <path d="M32 6 L54 17 L54 39 C54 52 32 60 32 60 C32 60 10 52 10 39 L10 17 Z"
                fill="none" stroke="url(#lg1)" strokeWidth="2.5" />
              <path d="M23 32 L30 39 L42 25" stroke="url(#lg1)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="lg1" x1="10" y1="6" x2="54" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0ec9b5" /><stop offset="1" stopColor="#3dddd0" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
          <div className="auth-title">CYBERFORGE</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: 8 }}>
            Enter the arena.
          </p>
        </div>

        <div className="auth-card">
          <h5 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
            Sign in to your account
          </h5>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: 'var(--accent-red)', borderRadius: 8, padding: '10px 14px',
              fontSize: '0.85rem', marginBottom: 16, fontFamily: 'var(--font-mono)',
              animation: 'fadeInUp 0.2s ease',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">
                <User size={13} style={{ marginRight: 6 }} />Username or Email
              </label>
              <input
                className="form-control"
                placeholder="h4ck3r or hacker@cyberforge.io"
                value={form.identifier}
                onChange={e => set('identifier', e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">
                <Lock size={13} style={{ marginRight: 6 }} />Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="d-flex justify-content-end mt-1">
                <a href="#" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.target.style.color = 'var(--accent-green)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button className="btn btn-primary w-100" type="submit" disabled={loading}
              style={{ padding: '12px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Authenticating...
                </span>
              ) : 'LOGIN'}
            </button>
          </form>

          <div className="divider" style={{ margin: '20px 0' }} />

          {/* Demo logins */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
              — Quick Demo Access —
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm flex-1" onClick={() => demoLogin('user')} disabled={loading}
                style={{ fontSize: '0.78rem' }}>
                <Terminal size={13} style={{ marginRight: 6 }} />Demo User
              </button>
              <button className="btn btn-sm flex-1" onClick={() => demoLogin('admin')} disabled={loading}
                style={{
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                  color: 'var(--accent-purple)', fontSize: '0.78rem',
                }}>
                <Shield size={13} style={{ marginRight: 6 }} />Demo Admin
              </button>
            </div>
          </div>

          <div className="text-center">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No account?{' '}
              <Link to="/register" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                Create one
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
