import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Terminal, Lock, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AnimatedAuthBg from '../components/ui/AnimatedAuthBg';

export default function Login() {
  const { login, googleLogin, isAuthenticated } = useApp();
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

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
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
      <AnimatedAuthBg />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(119,100,224,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(119,100,224,0.035) 1px, transparent 1px)',
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
                  <stop stopColor="#4F1F71" /><stop offset="1" stopColor="#7764E0" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
          <div className="auth-title">CYBERFORGE</div>
        </div>

        <div className="auth-card">
          <h5 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
            Sign in to your account
          </h5>

          {error && (
            <div style={{
              background: 'rgba(235,107,122,0.08)', border: '1px solid rgba(235,107,122,0.25)',
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
                <User size={13} color="var(--accent-green)" style={{ marginRight: 6 }} />Username or Email
              </label>
              <input
                className="form-control"
                placeholder="you@example.com"
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
                  {showPw ? <EyeOff size={16} color="var(--accent-green)" /> : <Eye size={16} color="var(--accent-green)" />}
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

        <button className="btn btn-outline-secondary w-100 mb-3" onClick={handleGoogle} disabled={loading}
          style={{ padding: '11px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        {/* Demo logins */}
          <div style={{ marginBottom: 16 }}>
            <div className="d-flex justify-content-center gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => demoLogin('user')} disabled={loading}
                style={{ fontSize: '0.78rem' }}>
                <Terminal size={13} style={{ marginRight: 6 }} />Demo User
              </button>
              <button className="btn btn-sm" onClick={() => demoLogin('admin')} disabled={loading}
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
