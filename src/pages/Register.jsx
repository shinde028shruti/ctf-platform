import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AnimatedAuthBg from '../components/ui/AnimatedAuthBg';

export default function Register() {
  const { register, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const pwStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strength = pwStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'var(--accent-red)', 'var(--accent-orange)', 'var(--accent-yellow)', 'var(--diff-easy)'];
  const usernameInvalid = form.username.length > 0 && !/^[a-zA-Z0-9_]+$/.test(form.username);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { setError('All fields are required.'); return; }
    if (form.username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (form.username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(form.username)) { setError('Username must be 3–20 characters. Letters, numbers, and underscores only.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Enter a valid email address.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <AnimatedAuthBg />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(116,100,220,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(116,100,220,0.025) 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 16px' }}>
        <div className="text-center mb-3">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <path d="M32 6 L54 17 L54 39 C54 52 32 60 32 60 C32 60 10 52 10 39 L10 17 Z"
                fill="none" stroke="url(#lg2)" strokeWidth="2.5" />
              <path d="M23 32 L30 39 L42 25" stroke="url(#lg2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="lg2" x1="10" y1="6" x2="54" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7764E0" /><stop offset="1" stopColor="#9BA6FF" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
          <div className="auth-title">CYBERFORGE</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: 4 }}>
            Join the CYBERFORGE. Prove your skills.
          </p>
        </div>

        <div className="auth-card" style={{ padding: '28px' }}>
          {success ? (
            <div className="text-center" style={{ padding: '24px 0' }}>
              <CheckCircle size={48} color="var(--accent-green)" style={{ marginBottom: 16 }} />
              <h5 style={{ color: 'var(--accent-green)' }}>Account Created!</h5>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <h5 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Create your account</h5>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  color: 'var(--accent-red)', borderRadius: 8, padding: '10px 14px',
                  fontSize: '0.85rem', marginBottom: 16, fontFamily: 'var(--font-mono)',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <label className="form-label"><User size={13} color="var(--accent-green)" style={{ marginRight: 6 }} />Username</label>
                  <input className="form-control" placeholder="h4ck3r_name" value={form.username}
                    onChange={e => set('username', e.target.value)} autoComplete="username" maxLength={20} />
                  {usernameInvalid && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', marginTop: 4 }}>
                      Letters, numbers, and underscores only.
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label"><Mail size={13} style={{ marginRight: 6 }} />Email Address</label>
                  <input className="form-control" type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => set('email', e.target.value)} autoComplete="email" />
                </div>

                <div className="mb-2">
                  <label className="form-label"><Lock size={13} style={{ marginRight: 6 }} />Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    }}>
                      {showPw ? <EyeOff size={16} color="var(--accent-green)" /> : <Eye size={16} color="var(--accent-green)" />}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i <= strength ? strengthColors[strength] : 'var(--bg-elevated)',
                            transition: 'all 0.3s ease',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: strengthColors[strength] }}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label"><Lock size={13} style={{ marginRight: 6 }} />Confirm Password</label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="Repeat password"
                    value={form.confirm}
                    onChange={e => set('confirm', e.target.value)}
                    style={{ borderColor: form.confirm && form.password !== form.confirm ? 'var(--accent-red)' : '' }}
                  />
                  {form.confirm && form.password !== form.confirm && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', marginTop: 4 }}>Passwords don't match</div>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
                  By creating an account you agree to our{' '}
                  <a href="#" style={{ color: 'var(--accent-green)' }}>Terms of Service</a> and{' '}
                  <a href="#" style={{ color: 'var(--accent-green)' }}>Privacy Policy</a>.
                </div>

                <button className="btn btn-primary w-100" type="submit" disabled={loading}
                  style={{ padding: '11px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                  {loading ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Creating account...
                    </span>
                  ) : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div className="text-center mt-3">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Sign in</Link>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
