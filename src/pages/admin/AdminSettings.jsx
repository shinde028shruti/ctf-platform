import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, UserPlus, Lock, Wrench, Bell, Save, ToggleLeft, ToggleRight } from 'lucide-react';

function Switch({ label, desc, state, onToggle }) {
  return (
    <div className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: state ? 'var(--accent-green)' : 'var(--text-muted)', display: 'flex' }} title={state ? 'On' : 'Off'}>
        {state ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, right }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="d-flex align-items-center gap-2">
          <Icon size={16} color="var(--violet-bright)" />
          <span className="section-title" style={{ fontSize: '0.7rem' }}>{title}</span>
        </div>
        {right}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

export default function AdminSettings() {
  const [platform, setPlatform] = useState({ name: 'CyberForge', tagline: 'Break. Learn. Capture the Flag.', domain: 'cyberforge.io' });
  const [toggles, setToggles] = useState({
    allowRegistration: true,
    requireApproval:  false,
    publicLeaderboard: true,
    allowHints:       true,
    maintenance:      false,
    emailNotifs:      true,
  });
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const toggle = k => setToggles(t => ({ ...t, [k]: !t[k] }));

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Admin Settings</h1>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={save}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      {saved && (
        <div className="mb-4" style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          color: 'var(--diff-easy)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
          borderRadius: 10, padding: '12px 18px',
        }}>
          Settings saved successfully.
        </div>
      )}

      {/* General */}
      <SectionCard icon={Globe} title="General" right={<SettingsIcon size={14} color="var(--text-muted)" />}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform Name</label>
            <input className="form-control" value={platform.name} onChange={e => setPlatform(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Domain</label>
            <input className="form-control" value={platform.domain} onChange={e => setPlatform(p => ({ ...p, domain: e.target.value }))} />
          </div>
          <div className="col-12">
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tagline</label>
            <input className="form-control" value={platform.tagline} onChange={e => setPlatform(p => ({ ...p, tagline: e.target.value }))} />
          </div>
        </div>
      </SectionCard>

      {/* Registration */}
      <SectionCard icon={UserPlus} title="Registration & Access" right={<Lock size={14} color="var(--text-muted)" />}>
        <Switch label="Allow new registrations" desc="Enable public signup on the platform" state={toggles.allowRegistration} onToggle={() => toggle('allowRegistration')} />
        <Switch label="Require admin approval" desc="New accounts must be approved before login" state={toggles.requireApproval} onToggle={() => toggle('requireApproval')} />
        <Switch label="Public leaderboard" desc="Expose the leaderboard to unauthenticated users" state={toggles.publicLeaderboard} onToggle={() => toggle('publicLeaderboard')} />
      </SectionCard>

      {/* Gameplay */}
      <SectionCard icon={Wrench} title="Gameplay" right={<SettingsIcon size={14} color="var(--text-muted)" />}>
        <Switch label="Allow hints" desc="Let participants unlock hints for challenges" state={toggles.allowHints} onToggle={() => toggle('allowHints')} />
        <div className="py-3">
          <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Hint cost (% of challenge points)
          </label>
          <input type="range" className="form-range" min={0} max={50} defaultValue={25} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: 4 }}>25% default</div>
        </div>
      </SectionCard>

      {/* Maintenance */}
      <SectionCard icon={Wrench} title="Notifications & Maintenance" right={<Bell size={14} color="var(--text-muted)" />}>
        <Switch label="Email notifications" desc="Send automated notification emails to admins" state={toggles.emailNotifs} onToggle={() => toggle('emailNotifs')} />
        <Switch label="Maintenance mode" desc="Temporarily take the platform offline for updates" state={toggles.maintenance} onToggle={() => toggle('maintenance')} />
        {toggles.maintenance && (
          <div className="mt-3" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-yellow)' }}>
            Maintenance mode is ON. Users will see a maintenance notice.
          </div>
        )}
      </SectionCard>
    </div>
  );
}