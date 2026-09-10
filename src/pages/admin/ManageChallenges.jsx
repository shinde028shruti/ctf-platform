import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Edit, Eye, Copy, ToggleLeft, ToggleRight, Trash2, Search } from 'lucide-react';
import { challengeService } from '../../services/challengeService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

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
    { icon: Eye,         label: 'Preview',   action: 'preview',  className: '' },
    { icon: Copy,        label: 'Duplicate', action: 'duplicate',className: '' },
    {
      icon: challenge.status === 'published' ? ToggleLeft : ToggleRight,
      label: challenge.status === 'published' ? 'Unpublish' : 'Publish',
      action: 'toggle', className: '',
    },
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
          {items.map(({ icon: Icon, label, action, className }) => (
            <button key={action} className={`cf-dropdown-item ${className}`}
              onClick={() => { onAction(challenge, action); setOpen(false); }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManageChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    (async () => {
      const list = await challengeService.getAllChallenges();
      setChallenges(list);
      setLoading(false);
    })();
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
    if (action === 'delete') {
      setDeleteModal(challenge);
    }
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
          background: 'var(--bg-card)', border: '1px solid var(--accent-green)',
          borderRadius: 10, padding: '12px 20px',
          fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
          color: 'var(--accent-green)', boxShadow: 'var(--shadow-lg)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          ✓ {toast}
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Manage Challenges</h1>
        </div>
        <Link to="/admin/challenges/new" className="btn btn-primary d-flex align-items-center gap-2">
          <Plus size={16} /> Create Challenge
        </Link>
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
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                        color: c.status === 'published' ? 'var(--diff-easy)' : 'var(--accent-yellow)',
                        background: c.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                        padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
                      }}>
                        {c.status}
                      </span>
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
    </div>
  );
}
