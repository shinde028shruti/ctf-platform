import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Edit, Eye, Copy, ToggleLeft, ToggleRight, Trash2, Search, CheckCircle, Clock, Upload } from 'lucide-react';
import { challengeService } from '../../services/challengeService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ExportMenu from '../../components/ui/ExportMenu';
import { downloadExcel, downloadPdf, parseExcelFile } from '../../utils/exportUtils';

function ActionMenu({ challenge, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--accent-green)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="cf-dropdown" style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100 }}>
          {items.map(({ icon: Icon, label, action, className, color }) => (
            <button key={action} className={`cf-dropdown-item ${className}`}
              onClick={() => { onAction(challenge, action); setOpen(false); }}>
              <Icon size={14} color={color} /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
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
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState('');
  const fileRef = useRef(null);

  const showToast = (msg, color = 'var(--accent-green)') => { setToast({ msg, color }); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    const list = await challengeService.getAllChallenges();
    setChallenges(list);
    return list;
  };

  useEffect(() => {
    (async () => { await load(); setLoading(false); })();
  }, []);

  // Auto-publish scheduled challenges every 30s
  useEffect(() => {
    (async () => {
      const publishedIds = await challengeService.resolveScheduled();
      if (publishedIds.length) {
        setChallenges(await load());
        showToast(`Auto-published ${publishedIds.length} scheduled challenge${publishedIds.length > 1 ? 's' : ''}.`);
      }
    })();
    const iv = setInterval(async () => {
      const publishedIds = await challengeService.resolveScheduled();
      if (publishedIds.length) {
        setChallenges(await load());
        showToast(`Auto-published ${publishedIds.length} scheduled challenge${publishedIds.length > 1 ? 's' : ''}.`);
      }
    }, 30000);
    return () => clearInterval(iv);
  }, []);

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
      const dup = await challengeService.createChallenge({
        ...challenge,
        title: `${challenge.title} (Copy)`,
        status: 'draft',
        solves: 0,
      });
      setChallenges(prev => [...prev, dup]);
      showToast(`Duplicated "${challenge.title}"`);
      return;
    }
    if (action === 'toggle') {
      const updated = await challengeService.toggleChallengeStatus(challenge.id);
      setChallenges(prev => prev.map(c => c.id === challenge.id ? updated : c));
      showToast(`Challenge ${updated.status === 'published' ? 'published' : 'unpublished'}.`);
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
    const updated = await challengeService.scheduleChallenge(scheduleModal.id, scheduleAt);
    setChallenges(prev => prev.map(c => c.id === scheduleModal.id ? updated : c));
    setScheduleBusy(false);
    setScheduleModal(null);
    if (updated.status === 'scheduled') {
      showToast(`"${updated.title}" will auto-publish at ${scheduleAt.replace('T', ' ')}.`, 'var(--accent-orange)');
    } else {
      showToast(`Schedule cleared for "${updated.title}".`);
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
          title: 'CyberForge — Challenge Report',
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
      showToast('Export failed.', 'var(--accent-red)');
    }
    setExportBusy('');
  };

  const importExcel = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportBusy(true);
    try {
      const sheets = await parseExcelFile(file);
      let items = [];
      const full = sheets.find(s => s.name === 'Full Data');
      if (full && full.rows.length) {
        items = full.rows.map(r => (r.payload ? JSON.parse(r.payload) : r));
      } else if (sheets[0]) {
        items = sheets[0].rows;
      }
      if (!items.length) throw new Error('Empty workbook.');
      const result = await challengeService.importChallenges(items);
      await load();
      showToast(`Imported ${result.imported} challenge${result.imported !== 1 ? 's' : ''} (${result.added} new).`);
    } catch {
      showToast('Import failed — invalid Excel file.', 'var(--accent-red)');
    }
    setImportBusy(false);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    await challengeService.deleteChallenge(deleteModal.id);
    setChallenges(prev => prev.filter(c => c.id !== deleteModal.id));
    setDeleteModal(null);
    setDeleting(false);
    showToast('Challenge deleted.');
  };

  if (loading) return <LoadingSpinner fullPage text="Loading challenges..." />;

  return (
    <div className="page-container">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 3000,
          background: 'var(--bg-card)', border: `1px solid ${toast.color}`,
          borderRadius: 10, padding: '12px 20px',
          fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
          color: toast.color, boxShadow: 'var(--shadow-lg)',
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
          <ExportMenu onExport={exportChallenges} busy={!!exportBusy} />
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={() => fileRef.current?.click()} disabled={importBusy}>
            {importBusy ? <span className="spinner-border spinner-border-sm" /> : <Upload size={14} />} Import Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={importExcel} />
          <Link to="/admin/challenges/new" className="btn btn-primary d-flex align-items-center gap-2">
            <Plus size={16} /> Create Challenge
          </Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search challenges..."
          value={search} onChange={e => setSearch(e.target.value)} />
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    No challenges found
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
                    <td>
                      {statusChip(c)}
                    </td>
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
