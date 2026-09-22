import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Info, AlertTriangle, Wrench, Trash2, Edit, Eye, EyeOff, X } from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { adminService } from '../../services/adminService';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/ui/Modal';

const PRIORITY_STYLES = {
  info:       { label: 'Info',       color: 'var(--accent-cyan)',    bg: 'rgba(61,221,208,0.12)',    icon: Info },
  update:     { label: 'Update',     color: 'var(--accent-green)',   bg: 'rgba(16,185,129,0.12)',    icon: Info },
  maintenance:{ label: 'Maintenance',color: 'var(--accent-yellow)',  bg: 'rgba(234,179,8,0.12)',     icon: Wrench },
  urgent:     { label: 'Urgent',     color: 'var(--accent-red)',     bg: 'rgba(239,68,68,0.12)',     icon: AlertTriangle },
};

const EMPTY_DRAFT = {
  title: '', body: '', priority: 'info', active: true, showFrom: '', showUntil: '',
};

export default function AdminAnnouncements() {
  const { user: currentUser } = useApp();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const list = await announcementService.getAnnouncements();
    setAnnouncements(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setDraft(EMPTY_DRAFT); setEditing('create'); };
  const openEdit = (a) => {
    setDraft({
      title: a.title, body: a.body, priority: a.priority, active: a.active,
      showFrom: a.showFrom ? String(a.showFrom).replace(' ', 'T').slice(0, 16) : '',
      showUntil: a.showUntil ? String(a.showUntil).replace(' ', 'T').slice(0, 16) : '',
    });
    setEditing(a);
  };

  const save = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    const payload = {
      title: draft.title.trim(),
      body: draft.body.trim(),
      priority: draft.priority,
      active: draft.active,
      showFrom: draft.showFrom || null,
      showUntil: draft.showUntil || null,
    };
    if (editing === 'create') {
      await announcementService.createAnnouncement(payload);
    } else {
      await announcementService.updateAnnouncement(editing.id, payload);
    }
    await adminService.logAction(currentUser?.username || 'admin', editing === 'create' ? 'announcement.create' : 'announcement.update', payload.title);
    setSaving(false);
    setEditing(null);
    await load();
  };

  const remove = async () => {
    setDeleting(true);
    await announcementService.deleteAnnouncement(deleteTarget.id);
    await adminService.logAction(currentUser?.username || 'admin', 'announcement.delete', deleteTarget.title);
    setDeleting(false);
    setDeleteTarget(null);
    await load();
  };

  const toggleActive = async (a) => {
    const next = await announcementService.updateAnnouncement(a.id, { active: !a.active });
    setAnnouncements(prev => prev.map(x => x.id === a.id ? next : x));
  };

  const now = Date.now();
  const liveCount = announcements.filter(a => a.active && (!a.showFrom || new Date(a.showFrom).getTime() <= now) && (!a.showUntil || new Date(a.showUntil).getTime() >= now)).length;

  if (loading) {
    return <div className="page-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading announcements...</div>;
  }

  const rows = [...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Announcements</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0' }}>
            Broadcast to players — {liveCount} live right now.
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}>
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          No announcements yet. Create your first broadcast.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  {['Announcement', 'Priority', 'Schedule', 'Status', 'Created', 'Actions'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(a => {
                  const p = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.info;
                  const Icon = p.icon;
                  const from = a.showFrom ? String(a.showFrom).replace('T', ' ') : null;
                  const until = a.showUntil ? String(a.showUntil).replace('T', ' ') : null;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{a.title}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.body}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: p.color, background: p.bg, padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Icon size={11} /> {p.label}
                        </span>
                      </td>
                      <td>
                        {from || until ? (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {from && <div>From {from}</div>}
                            {until && <div>Until {until}</div>}
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Always</span>
                        )}
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{a.createdAt}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button onClick={() => openEdit(a)} style={{ background: 'rgba(61,221,208,0.1)', border: '1px solid rgba(61,221,208,0.28)', color: 'var(--accent-cyan)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(a)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--accent-red)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'create' ? 'New Announcement' : `Edit "${editing?.title}"`}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={save} disabled={saving || !draft.title.trim()}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : <><Megaphone size={14} /> {editing === 'create' ? 'Broadcast' : 'Save Changes'}</>}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input className="form-control" placeholder="e.g. Scheduled Maintenance" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
        </div>
        <div className="mb-3">
          <label className="form-label">Message</label>
          <textarea className="form-control" rows={3} placeholder="Short message shown to every player." value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} />
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Priority</label>
            <select className="form-select" value={draft.priority} onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))}>
              {Object.entries(PRIORITY_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="col-md-6 d-flex align-items-end pb-1">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.active} onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active immediately</span>
            </label>
          </div>
          <div className="col-md-6">
            <label className="form-label">Show From (optional)</label>
            <input className="form-control" type="datetime-local" value={draft.showFrom} onChange={e => setDraft(d => ({ ...d, showFrom: e.target.value }))} style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Show Until (optional)</label>
            <input className="form-control" type="datetime-local" value={draft.showUntil} onChange={e => setDraft(d => ({ ...d, showUntil: e.target.value }))} style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Announcement"
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
          <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget?.title}"</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}