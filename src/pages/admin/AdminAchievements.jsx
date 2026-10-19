import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Award, Sparkles, Trash2, Pencil, Eye, EyeOff, Gem, RotateCcw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/ui/Modal';
import AchievementBadge from '../../components/ui/AchievementBadge';
import { useApp } from '../../context/AppContext';
import { challengeService } from '../../services/challengeService';
import { adminService } from '../../services/adminService';
import {
  achievementService, ICON_CHOICES, resolveIcon,
  CRITERIA_TYPES, criteriaMeta, RARITIES, GRADIENT_PRESETS, describeRule,
} from '../../services/achievementService';

const RARITY_COLORS = {
  Common: '#94a3b8',
  Uncommon: '#10b981',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
};

/** The draft mirrors the wire shape closely; `buildConfig` flattens the
 *  rule-specific fields back into the `criteria_config` object the API wants. */
const emptyDraft = () => ({
  name: '',
  description: '',
  category: 'General',
  icon: 'Trophy',
  gradient: GRADIENT_PRESETS[0],
  image: '',
  rarity: 'Common',
  reward: 100,
  active: true,
  criteriaType: 'first_solve',
  target: 1,
  categoryRef: '',
  challengeRef: '',
});

const draftFrom = (a) => ({
  name: a.name,
  description: a.description,
  category: a.category,
  icon: a.icon,
  gradient: a.gradient,
  image: a.image,
  rarity: a.rarity,
  reward: a.reward,
  active: a.active,
  criteriaType: a.criteriaType || 'first_solve',
  target: a.criteriaConfig?.target ?? 1,
  categoryRef: a.criteriaConfig?.category ?? '',
  challengeRef: a.criteriaConfig?.challenge ?? '',
});

const buildConfig = (draft) => {
  switch (draft.criteriaType) {
    case 'total_solves':
      return { target: Math.max(1, Number(draft.target) || 1) };
    case 'category_solves':
      return {
        category: Number(draft.categoryRef) || null,
        target: Math.max(1, Number(draft.target) || 1),
      };
    case 'challenge_solved':
      return { challenge: Number(draft.challengeRef) || null };
    case 'first_solve':
    default:
      return {};
  }
};

/** Raw DRF field errors from an ApiError -> { field: "message" }. */
const extractFieldErrors = (err) => {
  const data = err?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const out = {};
  for (const [field, value] of Object.entries(data)) {
    if (field === 'detail') continue;
    out[field] = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
  }
  return out;
};

export default function AdminAchievements() {
  const { user: currentUser } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Real categories and challenges, loaded once for the rule pickers.
  const [categories, setCategories] = useState([]);
  const [challengeList, setChallengeList] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await achievementService.getAchievements();
      setItems(list);
      setError('');
    } catch (err) {
      setError(err?.message || 'Could not load achievements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cats, chs] = await Promise.all([
          challengeService.getCategories(),
          challengeService.getAllChallenges(),
        ]);
        if (!alive) return;
        setCategories(Array.isArray(cats) ? cats : (cats?.results ?? []));
        setChallengeList(Array.isArray(chs) ? chs : (chs?.results ?? []));
      } catch {
        // The rule pickers simply stay empty; the page itself still works and a
        // save surfaces any server-side validation error.
      }
    })();
    return () => { alive = false; };
  }, []);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.name])),
    [categories],
  );
  const challengeTitles = useMemo(
    () => Object.fromEntries(challengeList.map(c => [c.id, c.title])),
    [challengeList],
  );
  const lookups = { categoryNames, challengeTitles };

  const openCreate = () => { setDraft(emptyDraft()); setFieldErrors({}); setEditing('create'); };

  const openEdit = (a) => { setDraft(draftFrom(a)); setFieldErrors({}); setEditing(a); };

  const save = async () => {
    if (saving) return;
    if (!draft.name.trim()) return;
    setSaving(true);
    setFieldErrors({});
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category,
      icon: draft.icon,
      gradient: draft.gradient,
      image: draft.image,
      rarity: draft.rarity,
      reward: Number(draft.reward) || 0,
      active: draft.active,
      criteriaType: draft.criteriaType,
      criteriaConfig: buildConfig(draft),
    };
    const isCreate = editing === 'create';
    try {
      if (isCreate) {
        await achievementService.createAchievement(payload);
      } else {
        await achievementService.updateAchievement(editing.id, payload);
      }
      await adminService.logAction(
        currentUser?.username || 'admin',
        isCreate ? 'achievement.create' : 'achievement.update',
        payload.name,
      );
      toast.success(isCreate ? 'Achievement created.' : 'Achievement updated.');
      setEditing(null);
      await load();
    } catch (err) {
      // A 400 carries per-field DRF messages; surface them next to the inputs
      // instead of claiming success. The modal and the draft are preserved.
      setFieldErrors(extractFieldErrors(err));
      toast.error(err?.message || 'Could not save the achievement.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await achievementService.deleteAchievement(deleteTarget.id);
      await adminService.logAction(currentUser?.username || 'admin', 'achievement.delete', deleteTarget.name);
      toast.success('Achievement deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not delete the achievement.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (a) => {
    try {
      // Update the row only after the backend confirms, so a failed request
      // never leaves the table showing a status the server did not accept.
      const next = await achievementService.setActive(a.id, !a.active);
      setItems(prev => prev.map(x => (x.id === a.id ? next : x)));
      toast.success(next.active ? 'Achievement is live.' : 'Achievement hidden from players.');
    } catch (err) {
      toast.error(err?.message || 'Could not change the achievement status.');
    }
  };

  const setCriteriaType = (criteriaType) => {
    const meta = criteriaMeta(criteriaType);
    setDraft(d => ({
      ...d,
      criteriaType,
      categoryRef: meta.needs === 'category'
        ? (d.categoryRef || categories[0]?.id || '')
        : d.categoryRef,
      challengeRef: meta.needs === 'challenge'
        ? (d.challengeRef || challengeList[0]?.id || '')
        : d.challengeRef,
    }));
  };

  const filtered = items.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()));

  const activeCount = items.filter(a => a.active).length;
  const totalReward = items.reduce((s, a) => s + (a.reward || 0), 0);

  const statCards = [
    { icon: Award, value: items.length, label: 'Achievements', color: 'var(--accent-cyan)' },
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

  if (error && items.length === 0) {
    return (
      <div className="page-container">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', margin: '0 0 16px' }}>{error}</p>
          <button className="btn btn-primary d-flex align-items-center gap-2" style={{ margin: '0 auto' }} onClick={load}>
            <RotateCcw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const ruleError = fieldErrors.criteria_config || fieldErrors.criteria_type || fieldErrors.criteriaType;

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
                    {items.length === 0 ? 'No achievements yet. Create your first badge.' : 'No achievements found'}
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ flexShrink: 0 }}>
                          <AchievementBadge icon={resolveIcon(a.icon)} image={a.image} gradient={a.gradient} glow={`${a.gradient[0]}66`} locked={!a.active} size={30} />
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
                        {a.criteriaLabel || describeRule(a.criteriaType, a.criteriaConfig, lookups)}
                      </div>
                      <span className="cat-chip" style={{ fontSize: '0.66rem', marginTop: 3, display: 'inline-block' }}>{a.category}</span>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {a.earnedCount} earned
                      </div>
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
                        <button
                          onClick={() => setDeleteTarget(a)}
                          disabled={a.earnedCount > 0}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--accent-red)', borderRadius: 6, padding: '4px 8px', cursor: a.earnedCount > 0 ? 'not-allowed' : 'pointer', opacity: a.earnedCount > 0 ? 0.45 : 1, display: 'flex' }}
                          title={a.earnedCount > 0 ? 'Earned achievements cannot be deleted — deactivate instead' : 'Delete'}
                        >
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
          <AchievementBadge icon={resolveIcon(draft.icon)} image={draft.image} gradient={draft.gradient} glow={`${draft.gradient[0]}66`} size={54} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{draft.name || 'Untitled Achievement'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 3 }}>
              {draft.description || 'Add a description players will read on their badge.'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--accent-green)', marginTop: 6 }}>
              Reward +{draft.reward || 0} pts · {describeRule(draft.criteriaType, buildConfig(draft), lookups)}
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">Name</label>
            <input className="form-control" placeholder="e.g. Night Owl" value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            {fieldErrors.name && <div style={{ color: 'var(--accent-red)', fontSize: '0.72rem', marginTop: 4 }}>{fieldErrors.name}</div>}
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
                <select className="form-select" value={draft.criteriaType} onChange={e => setCriteriaType(e.target.value)}>
                  {CRITERIA_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {criteriaMeta(draft.criteriaType).needs === 'category' && (
                <div className="col-md-4">
                  <select className="form-select" value={draft.categoryRef}
                    onChange={e => setDraft(d => ({ ...d, categoryRef: e.target.value }))}>
                    {categories.length === 0 && <option value="">No categories loaded</option>}
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {criteriaMeta(draft.criteriaType).needs === 'challenge' && (
                <div className="col-md-4">
                  <select className="form-select" value={draft.challengeRef}
                    onChange={e => setDraft(d => ({ ...d, challengeRef: e.target.value }))}>
                    {challengeList.length === 0 && <option value="">No challenges loaded</option>}
                    {challengeList.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
              {criteriaMeta(draft.criteriaType).needs === 'target' && (
                <div className="col-md-3">
                  <input className="form-control" type="number" min={1} placeholder="Target"
                    value={draft.target}
                    onChange={e => setDraft(d => ({ ...d, target: e.target.value }))} />
                </div>
              )}
              {criteriaMeta(draft.criteriaType).needs === 'category' && (
                <div className="col-md-3">
                  <input className="form-control" type="number" min={1} placeholder="Target"
                    value={draft.target}
                    onChange={e => setDraft(d => ({ ...d, target: e.target.value }))} />
                </div>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Unlocks at {describeRule(draft.criteriaType, buildConfig(draft), lookups)}.
            </div>
            {ruleError && <div style={{ color: 'var(--accent-red)', fontSize: '0.72rem', marginTop: 4 }}>{ruleError}</div>}
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
            {fieldErrors.gradient && <div style={{ color: 'var(--accent-red)', fontSize: '0.72rem', marginTop: 4 }}>{fieldErrors.gradient}</div>}
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
            <button className="btn btn-danger d-flex align-items-center gap-2" onClick={remove} disabled={deleting || deleteTarget?.earnedCount > 0}>
              {deleting ? <span className="spinner-border spinner-border-sm" /> : <><Trash2 size={14} /> Delete</>}
            </button>
          </>
        }
      >
        {deleteTarget?.earnedCount > 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            <strong style={{ color: 'var(--text-primary)' }}>&quot;{deleteTarget?.name}&quot;</strong>{' '}
            has already been earned by {deleteTarget.earnedCount} player{deleteTarget.earnedCount === 1 ? '' : 's'} and
            can no longer be deleted.{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Deactivate</strong> it instead to hide it from players.
          </p>
        ) : (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Remove{' '}
            <strong style={{ color: 'var(--text-primary)' }}>&quot;{deleteTarget?.name}&quot;</strong>{' '}
            from the board? This hides the definition; no player has earned it yet.
          </p>
        )}
      </Modal>
    </div>
  );
}
