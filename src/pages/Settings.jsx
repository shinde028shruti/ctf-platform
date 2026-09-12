import React, { useState } from 'react';
import { User, Lock, Bell, Shield, Trash2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const TABS = [
  { id: 'profile',   icon: User,   label: 'Profile' },
  { id: 'security',  icon: Lock,   label: 'Security' },
  { id: 'notif',     icon: Bell,   label: 'Notifications' },
  { id: 'danger',    icon: Trash2, label: 'Danger Zone' },
];

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '24px', marginBottom: 16 }}>
      <h5 style={{ fontWeight: 700, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>{title}</h5>
      {children}
    </div>
  );
}

function SaveBtn({ saving, saved, onClick }) {
  return (
    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={onClick} disabled={saving} style={{ minWidth: 120 }}>
      {saving ? (
        <><span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Saving...</>
      ) : saved ? (
        <><CheckCircle size={14} /> Saved</>
      ) : 'Save Changes'}
    </button>
  );
}

export default function Settings() {
  const { user, updateUser } = useApp();
  const [tab, setTab] = useState('profile');

  const [profile, setProfile] = useState({ username: user?.username || '', website: user?.website || '', twitter: user?.twitter || '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ solves: true, achievements: true, new_challenges: true, events: true, rank_changes: false });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const save = async (fn) => {
    setSaving(true); setError(''); setSaved(false);
    try { await fn(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (e) { setError(e.message); }
    setSaving(false);
  };

  const saveProfile = () => save(async () => {
    const updated = await authService.updateProfile(profile);
    updateUser(updated);
  });

  const savePassword = () => save(async () => {
    if (!pw.current) throw new Error('Enter your current password.');
    if (pw.next.length < 6) throw new Error('New password must be at least 6 characters.');
    if (pw.next !== pw.confirm) throw new Error('Passwords do not match.');
    await new Promise(r => setTimeout(r, 600)); // mock
    setPw({ current: '', next: '', confirm: '' });
  });

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="section-title mb-2">Account</div>
        <h1 style={{ margin: 0 }}>Settings</h1>
      </div>

      <div className="row g-4">
        {/* Sidebar tabs */}
        <div className="col-lg-3">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => { setTab(id); setError(''); setSaved(false); }} style={{
                width: '100%', background: tab === id ? 'rgba(14,201,181,0.07)' : 'none',
                border: 'none', borderLeft: tab === id ? '3px solid var(--accent-green)' : '3px solid transparent',
                color: tab === id ? 'var(--accent-green)' : 'var(--text-secondary)',
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}>
                <Icon size={16} color={icon === User ? 'var(--accent-green)' : undefined} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="col-lg-9">
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--accent-red)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {tab === 'profile' && (
            <div className="animate-fade-in">
              <Section title="Public Profile">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Username</label>
                    <input className="form-control" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed here.</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Website</label>
                    <input className="form-control" placeholder="https://yoursite.com" value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Twitter</label>
                    <input className="form-control" placeholder="@handle" value={profile.twitter} onChange={e => setProfile(p => ({ ...p, twitter: e.target.value }))} />
                  </div>
                </div>
                <SaveBtn saving={saving} saved={saved} onClick={saveProfile} />
              </Section>
            </div>
          )}

          {tab === 'security' && (
            <div className="animate-fade-in">
              <Section title="Change Password">
                <div className="row g-3 mb-4">
                  <div className="col-12">
                    <label className="form-label">Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-control" type={showPw ? 'text' : 'password'} value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} style={{ paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showPw ? <EyeOff size={16} color="var(--accent-green)" /> : <Eye size={16} color="var(--accent-green)" />}
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">New Password</label>
                    <input className="form-control" type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-control" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                  </div>
                </div>
                <SaveBtn saving={saving} saved={saved} onClick={savePassword} />
              </Section>

              <Section title="Two-Factor Authentication">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Authenticator App</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add an extra layer of security to your account.</div>
                  </div>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => alert('2FA setup would open here in production.')}>
                    Set up 2FA
                  </button>
                </div>
              </Section>
            </div>
          )}

          {tab === 'notif' && (
            <div className="animate-fade-in">
              <Section title="Notification Preferences">
                {[
                  { key: 'solves',         label: 'Challenge Solved',   desc: 'When you successfully submit a correct flag.' },
                  { key: 'achievements',   label: 'Achievements',       desc: 'When you unlock a new badge or achievement.' },
                  { key: 'new_challenges', label: 'New Challenges',     desc: 'When new challenges are added to the platform.' },
                  { key: 'events',         label: 'Events',             desc: 'CTF event announcements and reminders.' },
                  { key: 'rank_changes',   label: 'Rank Changes',       desc: 'When your global rank changes significantly.' },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                      <input type="checkbox" checked={notifPrefs[key]} onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: 24,
                        background: notifPrefs[key] ? 'var(--accent-green)' : 'var(--bg-elevated)',
                        border: `1px solid ${notifPrefs[key] ? 'var(--accent-green)' : 'var(--border-bright)'}`,
                        transition: 'all 0.25s',
                      }}>
                        <span style={{
                          position: 'absolute', top: 3, left: notifPrefs[key] ? 21 : 3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: notifPrefs[key] ? '#071a1a' : 'var(--text-muted)',
                          transition: 'left 0.25s',
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  <button className="btn btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
                    {saved ? <><CheckCircle size={14} style={{ marginRight: 6 }} />Saved</> : 'Save Preferences'}
                  </button>
                </div>
              </Section>
            </div>
          )}

          {tab === 'danger' && (
            <div className="animate-fade-in">
              <Section title="Danger Zone">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 4 }}>Delete Account</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('This is a demo — account deletion would be permanent in production.')) alert('Account deletion would be handled by the backend API.'); }}>
                    <Trash2 size={14} style={{ marginRight: 6 }} />Delete Account
                  </button>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
