import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, Users as UsersIcon, UserCheck, Ban, Trash2, X, Edit2, Save,
  ShieldCheck, Plus, ChevronLeft, ChevronRight, RefreshCw, MailOpen, Send,
  RotateCcw, AlertTriangle, Undo2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/adminService';
import Modal from '../../components/ui/Modal';

const PAGE_SIZE = 20;

const ROLE_COLORS = { admin: 'var(--accent-purple)', user: 'var(--text-muted)' };
const ROLE_BG = { admin: 'rgba(139,92,246,0.12)' };

const STATUS_ACTION_LABELS = {
  suspend: 'Suspend',
  ban: 'Ban',
  activate: 'Activate',
};

const ACTION_TO_STATUS = {
  suspend: 'suspended',
  ban: 'banned',
  activate: 'active',
};

const EMPTY_CREATE_FORM = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
};

function statusBadge(status) {
  const map = {
    active:    { color: 'var(--diff-easy)',     bg: 'rgba(16,185,129,0.1)' },
    suspended: { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.1)' },
    banned:    { color: 'var(--diff-hard)',     bg: 'rgba(239,68,68,0.1)' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      color: s.color, background: s.bg, padding: '2px 10px', borderRadius: 20,
    }}>
      {status}
    </span>
  );
}

function roleBadge(role) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      color: ROLE_COLORS[role] || 'var(--text-muted)', padding: '2px 8px', borderRadius: 20,
      background: ROLE_BG[role] || 'transparent',
    }}>
      {role}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Which status transitions to offer for a user, given their current status.
 * Only one of activate / suspend is ever shown; ban is always available while
 * the account is not already banned.
 */
function statusActionsFor(u) {
  if (u.status === 'suspended') {
    return [{ action: 'activate', label: 'Activate', color: 'var(--diff-easy)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: RotateCcw }];
  }
  if (u.status === 'banned') {
    return [{ action: 'activate', label: 'Activate', color: 'var(--diff-easy)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: RotateCcw }];
  }
  return [
    { action: 'suspend', label: 'Suspend', color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.28)', Icon: Ban },
    { action: 'ban', label: 'Ban', color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.28)', Icon: Ban },
  ];
}

export default function AdminUsers() {
  const { user: currentUser } = useApp();
  const actor = currentUser?.username || 'admin';

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ count: 0, next: null, previous: null, summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('active');

  const [availableGroups, setAvailableGroups] = useState([]);

  const [reasonModal, setReasonModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [messageModal, setMessageModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [groupSelection, setGroupSelection] = useState([]);

  const [busy, setBusy] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState({ subject: '', body: '' });
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.listUsers({
        page, pageSize: PAGE_SIZE, search, deleted: view === 'deleted',
      });
      setUsers(data?.results || []);
      setMeta({
        count: data?.count || 0,
        next: data?.next || null,
        previous: data?.previous || null,
        summary: data?.summary || null,
      });
    } catch (e) {
      setError(e.message || 'Failed to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, view]);

  useEffect(() => { load(); }, [load]);

  const switchView = (next) => {
    if (next === view) return;
    setView(next);
    setPage(1);
    setDrawerUser(null);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    (async () => {
      try {
        setAvailableGroups(await adminService.listGroups());
      } catch {
        setAvailableGroups([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (drawerUser) setGroupSelection((drawerUser.groups || []).map(g => g.id));
    else setGroupSelection([]);
  }, [drawerUser]);

  const totalPages = Math.max(1, Math.ceil(meta.count / PAGE_SIZE));
  const summary = meta.summary || { total: meta.count, active: 0, suspended: 0, banned: 0, deleted: 0 };
  const isDeletedView = view === 'deleted';

  const statCards = useMemo(() => ([
    { icon: UsersIcon,   value: summary.total ?? meta.count, label: 'Total Users', color: 'var(--accent-cyan)' },
    { icon: UserCheck,   value: summary.active ?? 0,         label: 'Active',      color: 'var(--accent-green)' },
    { icon: AlertTriangle, value: summary.suspended ?? 0,    label: 'Suspended',   color: 'var(--accent-yellow)' },
    { icon: ShieldCheck, value: summary.banned ?? 0,         label: 'Banned',      color: 'var(--accent-red)' },
  ]), [summary, meta.count]);

  /* ---- drawer -------------------------------------------------------- */

  const openDrawer = async (u) => {
    setEditForm(null);
    setDrawerUser(u);
    try {
      setDrawerUser(await adminService.getUser(u.id, { deleted: isDeletedView }));
    } catch (e) {
      toast.error(e.message);
    }
  };

  /* ---- status -------------------------------------------------------- */

  const openStatusModal = (u, action) => {
    setReason('');
    setReasonModal({ user: u, action });
  };

  const confirmStatus = async () => {
    const { user: u, action } = reasonModal;
    setBusy(action);
    try {
      const updated = await adminService.setUserStatus(u.id, ACTION_TO_STATUS[action], reason);
      await adminService.logAction(actor, `user.${action}`, u.username);
      toast.success(`${u.username} set to ${ACTION_TO_STATUS[action]}.`);
      setReasonModal(null);
      await load();
      if (drawerUser?.id === u.id) setDrawerUser(updated);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };

  /* ---- edit profile -------------------------------------------------- */

  const startEdit = () => setEditForm({
    first_name: drawerUser.first_name || '',
    last_name: drawerUser.last_name || '',
    email: drawerUser.email || '',
  });

  const saveEdit = async () => {
    setBusy('edit');
    try {
      const updated = await adminService.updateUser(drawerUser.id, editForm);
      toast.success('User updated.');
      setDrawerUser(updated);
      setEditForm(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };

  /* ---- groups -------------------------------------------------------- */

  const toggleGroup = (id) => setGroupSelection(prev => (
    prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
  ));

  const currentGroupIds = (drawerUser?.groups || []).map(g => g.id).sort().join(',');
  const groupsDirty = groupSelection.slice().sort().join(',') !== currentGroupIds;

  const saveGroups = async () => {
    setBusy('groups');
    try {
      const updated = await adminService.setUserGroups(drawerUser.id, groupSelection);
      await adminService.logAction(actor, 'user.groups', drawerUser.username);
      toast.success('Group membership updated.');
      setDrawerUser(updated);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };

  /* ---- create -------------------------------------------------------- */

  const submitCreate = async (e) => {
    e?.preventDefault?.();
    if (!createForm.username.trim() || !createForm.password) {
      toast.error('Username and password are required.');
      return;
    }
    setBusy('create');
    try {
      await adminService.createUser(createForm);
      await adminService.logAction(actor, 'user.create', createForm.username);
      toast.success(`User ${createForm.username} created.`);
      setCreateModal(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setPage(1);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  /* ---- delete / restore --------------------------------------------- */

  const handleDelete = (u) => setConfirmModal({ user: u, action: 'delete' });
  const handleRestore = (u) => setConfirmModal({ user: u, action: 'restore' });

  const confirmAction = async () => {
    const { user: u, action } = confirmModal;
    setBusy(action);
    try {
      if (action === 'restore') {
        const updated = await adminService.restoreUser(u.id);
        await adminService.logAction(actor, 'user.restore', u.username);
        toast.success(`Restored ${u.username}.`);
        setConfirmModal(null);
        if (drawerUser?.id === u.id) setDrawerUser(updated);
        await load();
      } else {
        await adminService.removeUser(u.id);
        await adminService.logAction(actor, 'user.delete', u.username);
        toast.success(`Moved ${u.username} to Deleted.`);
        setConfirmModal(null);
        if (drawerUser?.id === u.id) setDrawerUser(null);
        await load();
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };

  /* ---- message (client-only) ---------------------------------------- */

  const sendMessage = () => {
    setBusy('email');
    setTimeout(() => {
      setMessageModal(null); setMessage({ subject: '', body: '' }); setBusy('');
      toast.success('Message queued.');
    }, 500);
  };

  const canDelete = (u) => u.username !== actor && !u.is_superuser;
  const canRestore = (u) => !u.is_superuser;
  const drawerDeleted = !!drawerUser?.deleted_at;

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>User Management</h1>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          {!isDeletedView && (
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => { setCreateForm(EMPTY_CREATE_FORM); setCreateModal(true); }}>
              <Plus size={14} /> New User
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-6 col-md-3">
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

      <div className="d-flex align-items-center gap-3 flex-wrap mb-3">
        <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 3 }}>
          {[
            { key: 'active', label: 'Active' },
            { key: 'deleted', label: 'Deleted', count: summary.deleted ?? 0 },
          ].map(tab => {
            const active = view === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => switchView(tab.key)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                  background: active ? 'rgba(61,221,208,0.14)' : 'transparent',
                  color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.key === 'deleted' && <Undo2 size={12} />}
                {tab.label}
                {tab.count > 0 && (
                  <span style={{ background: active ? 'rgba(61,221,208,0.22)' : 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 6px' }}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search username or email..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: 'var(--accent-red)', fontSize: '0.85rem' }}>
          <AlertTriangle size={16} /> {error}
          <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={load}>Retry</button>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                {['User', 'Role', 'Points', 'Status', 'Joined', isDeletedView ? 'Deleted' : 'Last Login', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{isDeletedView ? 'No deleted users' : 'No users found'}</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => openDrawer(u)}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: 34, height: 34, borderRadius: 50, flexShrink: 0,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                          color: 'var(--accent-green)', textTransform: 'uppercase',
                        }}>
                          {u.username.slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.username}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{roleBadge(u.role)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{(u.points ?? 0).toLocaleString()}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(u.date_joined)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{isDeletedView ? formatDate(u.deleted_at) : formatDate(u.last_login)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="d-flex gap-2">
                        {isDeletedView ? (
                          <button
                            onClick={() => handleRestore(u)}
                            disabled={!canRestore(u)}
                            style={{ ...iconBtn('var(--accent-cyan)', 'rgba(61,221,208,0.1)', 'rgba(61,221,208,0.28)'), opacity: canRestore(u) ? 1 : 0.4, cursor: canRestore(u) ? 'pointer' : 'not-allowed' }}
                            title={canRestore(u) ? 'Restore' : 'Protected account'}
                          >
                            <Undo2 size={14} />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => setMessageModal(u)} style={iconBtn('var(--accent-cyan)', 'rgba(61,221,208,0.1)', 'rgba(61,221,208,0.28)')} title="Send message">
                              <MailOpen size={14} />
                            </button>
                            {u.username === actor ? (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center' }}>you</span>
                            ) : (
                              <>
                                {statusActionsFor(u).map(a => (
                                  <button key={a.action} onClick={() => openStatusModal(u, a.action)} style={iconBtn(a.color, a.bg, a.border)} title={a.label}>
                                    <a.Icon size={14} />
                                  </button>
                                ))}
                              </>
                            )}
                            <button onClick={() => handleDelete(u)} disabled={!canDelete(u)} style={{ ...iconBtn('var(--accent-red)', 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.28)'), opacity: canDelete(u) ? 1 : 0.4, cursor: canDelete(u) ? 'pointer' : 'not-allowed' }} title={canDelete(u) ? 'Delete' : 'Protected account'}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {meta.count} user{meta.count === 1 ? '' : 's'} · page {page} of {totalPages}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
            <ChevronLeft size={14} /> Prev
          </button>
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={() => setPage(p => p + 1)} disabled={!meta.next || loading}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Status action modal */}
      <Modal
        open={!!reasonModal}
        onClose={() => setReasonModal(null)}
        title={`${STATUS_ACTION_LABELS[reasonModal?.action]} ${reasonModal?.user?.username}`}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setReasonModal(null)}>Cancel</button>
            <button
              className={`btn ${reasonModal?.action === 'ban' || reasonModal?.action === 'suspend' ? 'btn-danger' : 'btn-primary'} d-flex align-items-center gap-2`}
              onClick={confirmStatus} disabled={busy === reasonModal?.action}
            >
              {busy === reasonModal?.action ? <span className="spinner-border spinner-border-sm" /> : <><Ban size={14} /> Confirm</>}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
          Change status of <strong style={{ color: 'var(--text-primary)' }}>{reasonModal?.user?.username}</strong> to{' '}
          <strong style={{ color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{ACTION_TO_STATUS[reasonModal?.action]}</strong>.
        </p>
        <label className="form-label">Reason</label>
        <textarea
          className="form-control" rows={3}
          placeholder="Optional — stored on the account"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </Modal>

      {/* Delete / restore confirm */}
      <Modal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.action === 'restore' ? 'Restore User' : 'Delete User'}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setConfirmModal(null)}>Cancel</button>
            <button
              className={`btn ${confirmModal?.action === 'restore' ? 'btn-primary' : 'btn-danger'} d-flex align-items-center gap-2`}
              onClick={confirmAction}
              disabled={busy === confirmModal?.action}
            >
              {busy === confirmModal?.action
                ? <span className="spinner-border spinner-border-sm" />
                : confirmModal?.action === 'restore' ? <><Undo2 size={14} /> Restore</> : <><Trash2 size={14} /> Confirm</>}
            </button>
          </>
        }
      >
        {confirmModal?.action === 'restore' ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Restore <strong style={{ color: 'var(--text-primary)' }}>{confirmModal?.user?.username}</strong>?
            The account becomes active again and the user can log in.
          </p>
        ) : (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Move <strong style={{ color: 'var(--text-primary)' }}>{confirmModal?.user?.username}</strong> to Deleted?
            The account is disabled but can be restored later.
          </p>
        )}
      </Modal>

      {/* Create user modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="New User"
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={submitCreate} disabled={busy === 'create'}>
              {busy === 'create' ? <span className="spinner-border spinner-border-sm" /> : <><UserCheck size={14} /> Create</>}
            </button>
          </>
        }
      >
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Username</label>
            <input className="form-control" value={createForm.username} onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div className="col-12">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="col-6">
            <label className="form-label">First name</label>
            <input className="form-control" value={createForm.first_name} onChange={e => setCreateForm(f => ({ ...f, first_name: e.target.value }))} />
          </div>
          <div className="col-6">
            <label className="form-label">Last name</label>
            <input className="form-control" value={createForm.last_name} onChange={e => setCreateForm(f => ({ ...f, last_name: e.target.value }))} />
          </div>
          <div className="col-12">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Quick message modal (client-only) */}
      <Modal
        open={!!messageModal}
        onClose={() => setMessageModal(null)}
        title={`Message ${messageModal?.username}`}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setMessageModal(null)}>Cancel</button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={sendMessage} disabled={busy === 'email'}>
              {busy === 'email' ? <span className="spinner-border spinner-border-sm" /> : <><Send size={14} /> Send</>}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">To</label>
          <input className="form-control" value={`${messageModal?.username} <${messageModal?.email}>`} disabled style={{ opacity: 0.7 }} />
        </div>
        <div className="mb-3">
          <label className="form-label">Subject</label>
          <input className="form-control" placeholder="Subject" value={message.subject} onChange={e => setMessage(m => ({ ...m, subject: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Message</label>
          <textarea className="form-control" rows={4} placeholder="Write your message..." value={message.body} onChange={e => setMessage(m => ({ ...m, body: e.target.value }))} />
        </div>
      </Modal>

      {/* User detail drawer */}
      {drawerUser && (
        <>
          <div className="admin-backdrop" onClick={() => setDrawerUser(null)} />
          <div className="admin-drawer">
            <div className="ps-header">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
              <span className="ps-title">User Details</span>
              <button className="ps-btn ms-auto" onClick={() => setDrawerUser(null)} title="Close"><X size={14} /></button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 900, color: '#0A0917',
                }}>
                  {drawerUser.username.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{drawerUser.username}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{drawerUser.email || '—'}</div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    {roleBadge(drawerUser.role)}
                    {statusBadge(drawerUser.status)}
                    {drawerUser.is_superuser && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-purple)' }}>SUPERUSER</span>
                    )}
                  </div>
                </div>
              </div>

              {drawerUser.status_note && (
                <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.28)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.8rem', color: 'var(--accent-yellow)' }}>
                  <strong>Note:</strong> {drawerUser.status_note}
                </div>
              )}

              {drawerDeleted && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                  <strong>Deleted</strong> {formatDate(drawerUser.deleted_at)} — this account is hidden from the active list and cannot log in until restored.
                </div>
              )}

              {/* Profile (view / edit) */}
              <div className="section-title mb-3">Profile</div>
              {editForm ? (
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label">First name</label>
                    <input className="form-control" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Last name</label>
                    <input className="form-control" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={saveEdit} disabled={busy === 'edit'}>
                      {busy === 'edit' ? <span className="spinner-border spinner-border-sm" /> : <><Save size={13} /> Save</>}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditForm(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="row g-2 mb-3">
                  {[
                    { label: 'Points', value: (drawerUser.points ?? 0).toLocaleString(), color: 'var(--accent-green)' },
                    { label: 'Active', value: drawerUser.is_active ? 'Yes' : 'No', color: drawerUser.is_active ? 'var(--diff-easy)' : 'var(--accent-red)' },
                    { label: 'Joined', value: formatDate(drawerUser.date_joined), color: 'var(--text-secondary)' },
                    { label: 'Last login', value: formatDate(drawerUser.last_login), color: 'var(--text-secondary)' },
                  ].map(m => (
                    <div key={m.label} className="col-6">
                      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                      </div>
                    </div>
                  ))}
                  {(drawerUser.first_name || drawerUser.last_name || drawerUser.bio) && (
                    <div className="col-12">
                      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 12px' }}>
                        {drawerUser.first_name || drawerUser.last_name ? (
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{`${drawerUser.first_name} ${drawerUser.last_name}`.trim()}</div>
                        ) : null}
                        {drawerUser.bio && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{drawerUser.bio}</div>}
                      </div>
                    </div>
                  )}
                  <div className="col-12">
                    {!drawerDeleted && (
                      <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={startEdit}>
                        <Edit2 size={13} /> Edit profile
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Groups */}
              <div className="section-title mb-3">Groups</div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                {availableGroups.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>No groups available.</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {availableGroups.map(g => (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: drawerDeleted ? 'not-allowed' : 'pointer', opacity: drawerDeleted ? 0.6 : 1 }}>
                        <input type="checkbox" checked={groupSelection.includes(g.id)} disabled={drawerDeleted} onChange={() => toggleGroup(g.id)} />
                        {g.name}
                      </label>
                    ))}
                  </div>
                )}
                {!drawerDeleted && (
                  <button className="btn btn-outline-secondary btn-sm mt-3 d-flex align-items-center gap-2" onClick={saveGroups} disabled={!groupsDirty || busy === 'groups'}>
                    {busy === 'groups' ? <span className="spinner-border spinner-border-sm" /> : <><Save size={13} /> Save groups</>}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="d-flex gap-2 flex-wrap">
                {drawerDeleted ? (
                  <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => handleRestore(drawerUser)} disabled={!canRestore(drawerUser)}>
                    <Undo2 size={14} /> Restore
                  </button>
                ) : (
                  <>
                    <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={() => setMessageModal(drawerUser)}>
                      <MailOpen size={14} /> Message
                    </button>
                    {drawerUser.username !== actor && statusActionsFor(drawerUser).map(a => (
                      <button key={a.action} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={() => openStatusModal(drawerUser, a.action)}>
                        <a.Icon size={13} /> {a.label}
                      </button>
                    ))}
                    <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2" onClick={() => handleDelete(drawerUser)} disabled={!canDelete(drawerUser)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function iconBtn(color, bg, border) {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color,
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'flex',
  };
}
