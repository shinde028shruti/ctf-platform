import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { User, Lock, Bell, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const TABS = [
  { id: 'profile',   icon: User,   label: 'Profile' },
  { id: 'security',  icon: Lock,   label: 'Security' },
  { id: 'notif',     icon: Bell,   label: 'Notifications' },
  { id: 'danger',    icon: Trash2, label: 'Danger Zone' },
];

const NOTIF_DEFAULTS = {
  solves: true,
  achievements: true,
  new_challenges: true,
  events: true,
  rank_changes: false,
};

const NOTIF_ITEMS = [
  { key: 'solves',         label: 'Challenge Solved',   desc: 'When you successfully submit a correct flag.' },
  { key: 'achievements',   label: 'Achievements',       desc: 'When you unlock a new badge or achievement.' },
  { key: 'new_challenges', label: 'New Challenges',     desc: 'When new challenges are added to the platform.' },
  { key: 'events',         label: 'Events',             desc: 'CTF event announcements and reminders.' },
  { key: 'rank_changes',   label: 'Rank Changes',       desc: 'When your global rank changes significantly.' },
];

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '24px', marginBottom: 16 }}>
      <h5 style={{ fontWeight: 700, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>{title}</h5>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, updateUser, logout } = useApp();

  const [tab, setTab] = useState('profile');

  const [profile, setProfile] = useState({
    displayName: user?.displayName || user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({ ...NOTIF_DEFAULTS, ...(user?.notifPrefs || {}) });

  const [busy, setBusy] = useState(null); // 'profile' | 'security' | 'notif'

  const saveProfile = async () => {
    if (!profile.displayName.trim()) { toast.error('Display name cannot be empty.'); return; }
    setBusy('profile');
    try {
      const updated = await authService.updateProfile({
        displayName: profile.displayName.trim(),
        bio: profile.bio,
        website: profile.website,
        twitter: profile.twitter,
      });
      updateUser(updated);
      toast.success('Profile saved successfully.');
    } catch (e) {
      toast.error(e.message);
    }
    setBusy(null);
  };

  const savePassword = async () => {
    if (!pw.current) { toast.error('Enter your current password.'); return; }
    if (pw.next.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    if (pw.next !== pw.confirm) { toast.error('New passwords do not match.'); return; }
    setBusy('security');
    await new Promise(r => setTimeout(r, 600));
    setPw({ current: '', next: '', confirm: '' });
    toast.success('Password changed successfully.');
    setBusy(null);
  };

  const saveNotifs = () => {
    setBusy('notif');
    setTimeout(() => {
      updateUser({ notifPrefs });
      toast.success('Notification preferences saved.');
      setBusy(null);
    }, 400);
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete your account? This action cannot be undone.')) return;
    if (!window.confirm('This is a demo environment. In production this would wipe all your data. Continue?')) return;
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="section-title mb-2">Account</div>
        <h1 style={{ margin: 0 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.9rem' }}>
          Manage your account, security, and preferences.
        </p>
      </div>

      <div className="row g-4">
        {/* Sidebar tabs */}
        <div className="col-lg-3">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                width: '100%', background: tab === id ? 'rgba(14,201,181,0.07)' : 'none',
                border: 'none', borderLeft: tab === id ? '3px solid var(--accent-green)' : '3px solid transparent',
                color: tab === id ? 'var(--accent-green)' : 'var(--text-secondary)',
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s', textAlign: 'left',
              }}>
                <Icon size={16} color={tab === id ? 'var(--accent-green)' : 'var(--text-muted)'} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="col-lg-9">
          {tab === 'profile' && (
            <div className="animate-fade-in">
              <Section title="Public Profile">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Display Name</label>
                    <input className="form-control" value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} />
                  </div>
                  <div className="col-md-6 d-flex align-items-end justify-content-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label className="form-label">Email</label>
                      <input className="form-control" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                    </div>
                    <span className="tag-chip" style={{ marginBottom: 8 }}>{user?.role || 'user'}</span>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Bio</label>
                    <textarea className="form-control" rows={3} placeholder="Tell the community about yourself..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
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
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={saveProfile} disabled={busy === 'profile'} style={{ minWidth: 120 }}>
                  {busy === 'profile' ? <span className="spinner-border spinner-border-sm" /> : <Save size={14} />} Save Changes
                </button>
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
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
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
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={savePassword} disabled={busy === 'security'} style={{ minWidth: 120 }}>
                  {busy === 'security' ? <span className="spinner-border spinner-border-sm" /> : <Lock size={14} />} Update Password
                </button>
              </Section>

              <Section title="Two-Factor Authentication">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Authenticator App</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add an extra layer of security to your account.</div>
                  </div>
                  <span className="tag-chip" style={{ color: 'var(--accent-yellow)' }}>{user?.tfaEnabled ? 'Enabled' : 'Off'}</span>
                </div>
              </Section>
            </div>
          )}

          {tab === 'notif' && (
            <div className="animate-fade-in">
              <Section title="Notification Preferences">
                {NOTIF_ITEMS.map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
                      <input type="checkbox" checked={!!notifPrefs[key]} onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
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
                  <button className="btn btn-primary d-flex align-items-center gap-2" onClick={saveNotifs} disabled={busy === 'notif'}>
                    {busy === 'notif' ? <span className="spinner-border spinner-border-sm" /> : <Save size={14} />} Save Preferences
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
                  <button className="btn btn-danger btn-sm d-flex align-items-center gap-2" onClick={handleDelete}>
                    <Trash2 size={14} /> Delete Account
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