import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Edit, Eye, Copy, ToggleLeft, ToggleRight, Trash2, Search, CheckCircle, Clock, Upload, AlertTriangle, RefreshCw } from 'lucide-react';
import { challengeService } from '../../services/challengeService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ExportMenu from '../../components/ui/ExportMenu';
import { downloadExcel, downloadPdf } from '../../utils/exportUtils';

function ActionMenu({ challenge, onAction }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;

    const close = () => setOpen(false);
    const onOutsideClick = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) close();
    };
    const onScroll = () => close();

    // Defer attaching the outside-click listener so it doesn't catch
    // the same click that opened the dropdown.
    const timer = setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
    }, 0);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onOutsideClick);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const items = [
    { icon: Edit,        label: 'Edit',      action: 'edit',     className: '' },
    { icon: Eye,         label: 'Preview',   action: 'preview',  className: '', color: 'var(--accent-green)' },
    { icon: Copy,        label: 'Duplicate', action: 'duplicate',className: '' },
    {
      icon: challenge.status === 'published' ? ToggleLeft : ToggleRight,
      label: challenge.status === 'published' ? 'Unpublish' : 'Publish',
      action: 'toggle', className: '',
    },
    { icon: Clock,       label: 'Schedule',  action: 'schedule', className: '', color: 'var(--accent-orange)' },
    { icon: Trash2,      label: 'Delete',    action: 'delete',   className: 'danger' },
  ];

  return (
    <>
      <button ref={btnRef} onClick={toggle} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--accent-green)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <MoreVertical size={15} />
      </button>
      {open && createPortal(
        <div className="cf-dropdown" style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}>
          {items.map(({ icon: Icon, label, action, className, color }) => (
            <button key={action} className={`cf-dropdown-item ${className}`}
              onClick={() => { onAction(challenge, action); setOpen(false); }}>
              <Icon size={14} color={color} /> {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function statusChip(c) {
  const styles = {
    published: { color: 'var(--diff-easy)', bg: 'rgba(16,185,129,0.1)' },
    draft:     { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.1)' },
    scheduled: { color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.12)' },
  };
  const s = styles[c.status] || styles.draft;
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase',
        color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 20, width: 'fit-content', letterSpacing: '0.05em',
      }}>
        {c.status}
      </span>
      {c.status === 'scheduled' && c.publishAt && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          <Clock size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
          {String(c.publishAt).replace('T', ' ')}
        </span>
      )}
    </div>
  );
}

function scheduledValue(v) {
  if (!v) return '';
  return String(v).replace(' ', 'T').slice(0, 16);
}

export default function ManageChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState('');
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await challengeService.getAllChallenges({ search, status: statusFilter });
      setChallenges(list || []);
    } catch (e) {
      setError(e.message || 'Failed to load challenges.');
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = challenges.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (challenge, action) => {
    if (action === 'edit') {
      window.location.href = `/admin/challenges/${challenge.id}/edit`;
      return;
    }
    if (action === 'preview') {
      window.open(`/challenges/${challenge.id}`, '_blank');
      return;
    }
    if (action === 'duplicate') {
      try {
        const dup = await challengeService.createChallenge({
          title: `${challenge.title} (Copy)`,
          category: challenge.category,
          difficulty: challenge.difficulty,
          points: challenge.points,
          description: challenge.description,
          scenario: challenge.scenario,
          objectives: challenge.objectives,
          instructions: challenge.instructions,
          author: challenge.author,
          tags: challenge.tags,
          featured: false,
          trial: false,
          connectionInfo: challenge.connectionInfo,
          cheatsheet: challenge.cheatsheet,
          status: 'draft',
          flag: 'CTF{duplicate_flag}',
        });
        await load();
        showToast(`Duplicated "${challenge.title}"`);
      } catch (e) {
        showToast(e.message, true);
      }
      return;
    }
    if (action === 'toggle') {
      try {
        const newStatus = challenge.status === 'published' ? 'draft' : 'published';
        await challengeService.setChallengeStatus(challenge.id, newStatus);
        await load();
        showToast(`Challenge ${newStatus === 'published' ? 'published' : 'unpublished'}.`);
      } catch (e) {
        showToast(e.message, true);
      }
      return;
    }
    if (action === 'schedule') {
      setScheduleAt(scheduledValue(challenge.publishAt));
      setScheduleModal(challenge);
      return;
    }
    if (action === 'delete') {
      setDeleteModal(challenge);
    }
  };

  const confirmSchedule = async () => {
    setScheduleBusy(true);
    try {
      const newStatus = scheduleAt ? 'scheduled' : 'draft';
      await challengeService.setChallengeStatus(scheduleModal.id, newStatus, scheduleAt);
      await load();
      setScheduleModal(null);
      if (newStatus === 'scheduled') {
        showToast(`"${scheduleModal.title}" will auto-publish at ${scheduleAt.replace('T', ' ')}.`);
      } else {
        showToast(`Schedule cleared for "${scheduleModal.title}".`);
      }
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setScheduleBusy(false);
    }
  };

  const exportChallenges = async (format) => {
    setExportBusy(format);
    const stamp = new Date().toISOString().slice(0, 10);
    try {
      if (format === 'excel') {
        await downloadExcel({
          filename: `challenges-${stamp}.xlsx`,
          sheets: [
            {
              name: 'Overview',
              rows: challenges.map(c => ({
                'ID': c.id,
                'Title': c.title,
                'Category': c.category,
                'Difficulty': c.difficulty,
                'Points': c.points,
                'Solves': c.solves,
                'Status': c.status,
                'Author': c.author,
                'Created': c.createdAt,
              })),
            },
            {
              name: 'Full Data',
              rows: challenges.map(c => ({ id: c.id, payload: JSON.stringify(c) })),
            },
          ],
        });
        showToast(`Exported ${challenges.length} challenge${challenges.length !== 1 ? 's' : ''} to Excel.`);
      } else {
        await downloadPdf({
          filename: `challenges-${stamp}.pdf`,
          title: 'FlagHunt — Challenge Report',
          subtitle: `${challenges.length} challenges · full inventory`,
          orientation: 'landscape',
          columns: [
            { key: 'title',      label: 'Challenge' },
            { key: 'category',   label: 'Category' },
            { key: 'difficulty', label: 'Difficulty' },
            { key: 'points',     label: 'Points' },
            { key: 'solves',     label: 'Solves' },
            { key: 'status',     label: 'Status' },
            { key: 'createdAt',  label: 'Created' },
          ],
          rows: challenges,
        });
        showToast(`Exported ${challenges.length} challenge${challenges.length !== 1 ? 's' : ''} to PDF.`);
      }
    } catch {
      showToast('Export failed.', true);
    }
    setExportBusy('');
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await challengeService.deleteChallenge(deleteModal.id);
      setChallenges(prev => prev.filter(c => c.id !== deleteModal.id));
      setDeleteModal(null);
      showToast('Challenge deleted.');
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && challenges.length === 0) {
    return <LoadingSpinner fullPage text="Loading challenges..." />;
  }

  return (
    <div className="page-container">
      {/* Inline toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 3000,
          background: 'var(--bg-card)', border: `1px solid ${toast.isError ? 'var(--accent-red)' : 'var(--accent-green)'}`,
          borderRadius: 10, padding: '12px 20px',
          fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
          color: toast.isError ? 'var(--accent-red)' : 'var(--accent-green)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <CheckCircle size={14} style={{ marginRight: 8 }} /> {toast.msg}
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Manage Challenges</h1>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <ExportMenu onExport={exportChallenges} busy={!!exportBusy} />
          <Link to="/admin/challenges/new" className="btn btn-primary d-flex align-items-center gap-2">
            <Plus size={16} /> Create Challenge
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: 'var(--accent-red)', fontSize: '0.85rem',
        }}>
          <AlertTriangle size={16} /> {error}
          <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={load}>Retry</button>
        </div>
      )}

      {/* Search + status filter */}
      <div className="d-flex align-items-center gap-3 flex-wrap mb-3">
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search challenges..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 3 }}>
          {['all', 'published', 'draft', 'scheduled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              background: statusFilter === s ? 'rgba(61,221,208,0.14)' : 'transparent',
              color: statusFilter === s ? 'var(--accent-cyan)' : 'var(--text-muted)',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                {['Challenge', 'Category', 'Difficulty', 'Points', 'Solves', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && challenges.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading challenges...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {error ? 'Failed to load challenges' : 'No challenges found'}
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        by {c.author}
                      </div>
                    </td>
                    <td><span className="cat-chip" style={{ fontSize: '0.62rem' }}>{c.category}</span></td>
                    <td><span className={`diff-badge diff-${c.difficulty.toLowerCase()}`}>{c.difficulty}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{c.points}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{c.solves}</td>
                    <td>{statusChip(c)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{c.createdAt}</td>
                    <td><ActionMenu challenge={c} onAction={handleAction} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Challenge"
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger d-flex align-items-center gap-2" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : <><Trash2 size={14} /> Delete</>}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteModal?.title}"</strong>?
          <br /><br />
          <span style={{ color: 'var(--accent-red)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
            This action cannot be undone.
          </span>
        </p>
      </Modal>

      {/* Schedule modal */}
      <Modal
        open={!!scheduleModal}
        onClose={() => setScheduleModal(null)}
        title={`Schedule "${scheduleModal?.title}"`}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setScheduleModal(null)}>Cancel</button>
            <button
              className="btn btn-warning d-flex align-items-center gap-2"
              onClick={confirmSchedule}
              disabled={scheduleBusy}
              style={{ color: '#0A0917' }}
            >
              {scheduleBusy ? <span className="spinner-border spinner-border-sm" /> : <><Clock size={14} /> {scheduleAt ? 'Save Schedule' : 'Clear Schedule'}</>}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', marginTop: 0, fontSize: '0.875rem' }}>
          Pick a date & time for this challenge to auto-publish. Clearing the field moves it back to draft.
        </p>
        <label className="form-label">Publish At</label>
        <input
          className="form-control"
          type="datetime-local"
          value={scheduleAt}
          onChange={e => setScheduleAt(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
          The platform checks scheduled challenges every 30 seconds.
        </div>
      </Modal>
    </div>
  );
}
