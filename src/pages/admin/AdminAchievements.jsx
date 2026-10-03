import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Award, Sparkles, Trash2, Pencil, Eye, EyeOff, Gem,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import AchievementBadge from '../../components/ui/AchievementBadge';
import { useApp } from '../../context/AppContext';
import { categories } from '../../data/challenges';
import { adminService } from '../../services/adminService';
import {
  achievementService, ICON_CHOICES, resolveIcon,
  CRITERIA_METRICS, DIFFICULTIES, RARITIES, GRADIENT_PRESETS,
  metricMeta, describeCriteria,
} from '../../services/achievementService';

const RARITY_COLORS = {
  Common: '#94a3b8',
  Uncommon: '#10b981',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
};

const emptyDraft = () => ({
  name: '',
  description: '',
  category: 'General',
  icon: 'Trophy',
  gradient: GRADIENT_PRESETS[0],
  rarity: 'Common',
  reward: 100,
  active: true,
  criteria: { metric: 'solved_total', threshold: 5, category: null, difficulty: null },
});

export default function AdminAchievements() {
  const { user: currentUser } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setItems(await achievementService.getAchievements());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setDraft(emptyDraft()); setEditing('create'); };

  const openEdit = (a) => {
    setDraft({
      name: a.name,
      description: a.description,
      category: a.category,
      icon: a.icon,
      gradient: a.gradient,
      rarity: a.rarity,
      reward: a.reward,
      active: a.active,
      criteria: { ...emptyDraft().criteria, ...a.criteria },
    });
    setEditing(a);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    const payload = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      reward: Number(draft.reward) || 0,
      criteria: { ...draft.criteria, threshold: Number(draft.criteria.threshold) || 1 },
    };
    if (editing === 'create') {
      await achievementService.createAchievement(payload);
    } else {
      await achievementService.updateAchievement(editing.id, payload);
    }
    await adminService.logAction(
      currentUser?.username || 'admin',
      editing === 'create' ? 'achievement.create' : 'achievement.update',
      payload.name,
    );
    setSaving(false);
    setEditing(null);
    await load();
  };

  const remove = async () => {
    setDeleting(true);
    await achievementService.deleteAchievement(deleteTarget.id);
    await adminService.logAction(currentUser?.username || 'admin', 'achievement.delete', deleteTarget.name);
    setDeleting(false);
    setDeleteTarget(null);
    await load();
  };

  const toggleActive = async (a) => {
    const next = await achievementService.setActive(a.id, !a.active);
    setItems(prev => prev.map(x => (x.id === a.id ? next : x)));
  };

  const setMetric = (metric) => {
    const meta = metricMeta(metric);
    setDraft(d => ({
      ...d,
      criteria: {
        ...d.criteria,
        metric,
        category: meta.needs === 'category' ? (d.criteria.category || categories[0].name) : null,
        difficulty: meta.needs === 'difficulty' ? (d.criteria.difficulty || DIFFICULTIES[0]) : null,
      },
    }));
  };

  const filtered = items.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()));

  const activeCount = items.filter(a => a.active).length;
  const totalReward = items.reduce((s, a) => s + (a.reward || 0), 0);

  const statCards = [
    { icon: Award, value: items.length, label: 'Custom Achievements', color: 'var(--accent-cyan)' },
    { icon: Sparkles, value: activeCount, label: 'Live For Players', color: 'var(--accent-green)' },
    { icon: Gem, value: totalReward.toLocaleString(), label: 'Total Reward Pool', color: 'var(--accent-purple)' },
  ];

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Loading achievements...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Achievements</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0' }}>
            Create unlockable badges — each rule unlocks automatically when a player meets it.
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}>
          <Plus size={16} /> New Achievement
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-6 col-md-4">
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <s.icon size={18} />
                </div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search achievements..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                {['Achievement', 'Unlock Rule', 'Reward', 'Rarity', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {items.length === 0 ? 'No custom achievements yet. Create your first badge.' : 'No achievements found'}
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ flexShrink: 0 }}>
                          <AchievementBadge icon={resolveIcon(a.icon)} gradient={a.gradient} glow={`${a.gradient[0]}66`} locked={!a.active} size={30} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {describeCriteria(a.criteria)}
                      </div>
                      <span className="cat-chip" style={{ fontSize: '0.66rem', marginTop: 3, display: 'inline-block' }}>{a.category}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                        +{a.reward} pts
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        color: RARITY_COLORS[a.rarity] || 'var(--text-muted)',
                        background: `${RARITY_COLORS[a.rarity] || '#94a3b8'}14`,
                        border: `1px solid ${RARITY_COLORS[a.rarity] || '#94a3b8'}33`,
                        padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                      }}>
                        {a.rarity}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => toggleActive(a)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                          color: a.active ? 'var(--diff-easy)' : 'var(--text-muted)',
                          background: a.active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                          padding: '2px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}>
                          {a.active ? <><Eye size={11} /> Live</> : <><EyeOff size={11} /> Hidden</>}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button onClick={() => openEdit(a)} style={{ background: 'rgba(61,221,208,0.1)', border: '1px solid rgba(61,221,208,0.28)', color: 'var(--accent-cyan)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--accent-red)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing === 'create' ? 'New Achievement' : `Edit "${editing?.name}"`}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={save} disabled={saving || !draft.name.trim()}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : <><Award size={14} /> {editing === 'create' ? 'Create' : 'Save Changes'}</>}
            </button>
          </>
        }
      >
        {/* Live preview, so the badge never has to be imagined from four inputs. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: 16, marginBottom: 20,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12,
        }}>
          <AchievementBadge icon={resolveIcon(draft.icon)} gradient={draft.gradient} glow={`${draft.gradient[0]}66`} size={54} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{draft.name || 'Untitled Achievement'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 3 }}>
              {draft.description || 'Add a description players will read on their badge.'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--accent-green)', marginTop: 6 }}>
              Reward +{draft.reward || 0} pts · {describeCriteria(draft.criteria)}
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">Name</label>
            <input className="form-control" placeholder="e.g. Night Owl" value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Category</label>
            <select className="form-select" value={draft.category}
              onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}>
              {['General', ...categories.map(c => c.name)].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={2} placeholder="What does a player have to do to earn this?"
              value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
          </div>

          {/* Unlock rule */}
          <div className="col-12">
            <label className="form-label">Unlock Rule</label>
            <div className="row g-2">
              <div className="col-md-5">
                <select className="form-select" value={draft.criteria.metric} onChange={e => setMetric(e.target.value)}>
                  {CRITERIA_METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {metricMeta(draft.criteria.metric).needs === 'category' && (
                <div className="col-md-4">
                  <select className="form-select" value={draft.criteria.category || ''}
                    onChange={e => setDraft(d => ({ ...d, criteria: { ...d.criteria, category: e.target.value } }))}>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {metricMeta(draft.criteria.metric).needs === 'difficulty' && (
                <div className="col-md-4">
                  <select className="form-select" value={draft.criteria.difficulty || ''}
                    onChange={e => setDraft(d => ({ ...d, criteria: { ...d.criteria, difficulty: e.target.value } }))}>
                    {DIFFICULTIES.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              )}
              <div className="col-md-3">
                <input className="form-control" type="number" min={1} placeholder="Threshold"
                  value={draft.criteria.threshold}
                  onChange={e => setDraft(d => ({ ...d, criteria: { ...d.criteria, threshold: e.target.value } }))} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Unlocks at {describeCriteria(draft.criteria)}.
            </div>
          </div>

          {/* Icon picker */}
          <div className="col-12">
            <label className="form-label">Icon</label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: 6,
              maxHeight: 132, overflowY: 'auto', padding: 8,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10,
            }}>
              {ICON_CHOICES.map(name => {
                const Icon = resolveIcon(name);
                const selected = draft.icon === name;
                return (
                  <button key={name} type="button" title={name} onClick={() => setDraft(d => ({ ...d, icon: name }))}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 7,
                      background: selected ? 'rgba(116,100,220,0.2)' : 'transparent',
                      border: `1px solid ${selected ? 'var(--border-bright)' : 'transparent'}`,
                      borderRadius: 8, cursor: 'pointer',
                      color: selected ? 'var(--violet-bright)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}>
                    <Icon size={17} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gradient */}
          <div className="col-12">
            <label className="form-label">Gradient</label>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
              {GRADIENT_PRESETS.map(([a, b]) => {
                const selected = draft.gradient[0] === a && draft.gradient[1] === b;
                return (
                  <button key={a + b} type="button" title={`${a} → ${b}`}
                    onClick={() => setDraft(d => ({ ...d, gradient: [a, b] }))}
                    style={{
                      width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                      background: `linear-gradient(160deg, ${a} 0%, ${b} 100%)`,
                      border: `1px solid ${selected ? 'var(--border-bright)' : 'var(--border-color)'}`,
                      boxShadow: selected ? '0 0 0 2px rgba(116,100,220,0.35)' : 'none',
                    }} />
                );
              })}
            </div>
            <div className="d-flex align-items-center gap-2">
              <input type="color" className="form-control form-control-color" value={draft.gradient[0]} aria-label="Gradient start"
                onChange={e => setDraft(d => ({ ...d, gradient: [e.target.value, d.gradient[1]] }))} />
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <input type="color" className="form-control form-control-color" value={draft.gradient[1]} aria-label="Gradient end"
                onChange={e => setDraft(d => ({ ...d, gradient: [d.gradient[0], e.target.value] }))} />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label">Rarity</label>
            <select className="form-select" value={draft.rarity} onChange={e => setDraft(d => ({ ...d, rarity: e.target.value }))}>
              {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Reward (pts)</label>
            <input className="form-control" type="number" min={0} value={draft.reward}
              onChange={e => setDraft(d => ({ ...d, reward: e.target.value }))} />
          </div>
          <div className="col-md-4 d-flex align-items-end pb-1">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.active} onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Visible to players</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Achievement"
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger d-flex align-items-center gap-2" onClick={remove} disabled={deleting}>
              {deleting ? <span className="spinner-border spinner-border-sm" /> : <><Trash2 size={14} /> Delete</>}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Are you sure you want to permanently remove{' '}
          <strong style={{ color: 'var(--text-primary)' }}>&quot;{deleteTarget?.name}&quot;</strong>?{' '}
          Anyone who already unlocked it will lose the badge.
        </p>
      </Modal>
    </div>
  );
}