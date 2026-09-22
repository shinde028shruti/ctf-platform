import React, { useEffect, useState } from 'react';
import {
  Search, Users as UsersIcon, Shield, ShieldCheck, UserCheck, Trash2, Ban,
  MailOpen, RotateCcw, ArrowUpCircle, ArrowDownCircle, X, FileText, Activity, Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/adminService';
import { challenges } from '../../data/challenges';
import Modal from '../../components/ui/Modal';

const ROLE_COLORS = { admin: 'var(--accent-purple)', moderator: 'var(--accent-cyan)', user: 'var(--text-muted)' };

function statusBadge(status) {
  const map = {
    active:    { color: 'var(--diff-easy)',   bg: 'rgba(16,185,129,0.1)' },
    suspended: { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.1)' },
    banned:    { color: 'var(--diff-hard)',    bg: 'rgba(239,68,68,0.1)' },
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

function challengeTitle(id) {
  return challenges.find(c => c.id === Number(id))?.title || `Challenge #${id}`;
}

const STATUS_ACTION_LABELS = {
  suspend: 'Suspend',
  unsuspend: 'Un-suspend',
  ban: 'Ban',
  unban: 'Un-ban',
};

export default function AdminUsers() {
  const { user: currentUser } = useApp();
  const actor = currentUser?.username || 'admin';

  const [users, setUsers] = useState([]);
  const [solves, setSolves] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [reasonModal, setReasonModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [messageModal, setMessageModal] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [busy, setBusy] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState({ subject: '', body: '' });

  useEffect(() => {
    (async () => {
      const [u, s, sub] = await Promise.all([
        adminService.getUsers(),
        adminService.getSolvesHistory(),
        adminService.getSubmissions(),
      ]);
      setUsers(u); setSolves(s); setSubmissions(sub); setLoading(false);
    })();
  }, []);

  const refreshUsers = async () => setUsers(await adminService.getUsers());

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.username.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount     = users.filter(u => u.status === 'active').length;
  const suspendedCount  = users.filter(u => u.status === 'suspended').length;
  const bannedCount     = users.filter(u => u.status === 'banned').length;
  const moderatorsCount = users.filter(u => u.role === 'moderator').length;

  const statCards = [
    { icon: UsersIcon,   value: users.length,       label: 'Total Users',   color: 'var(--accent-cyan)' },
    { icon: UserCheck,   value: activeCount,        label: 'Active',        color: 'var(--accent-green)' },
    { icon: Shield,      value: moderatorsCount,    label: 'Moderators',    color: 'var(--accent-yellow)' },
    { icon: ShieldCheck, value: bannedCount + suspendedCount, label: 'Restricted', color: 'var(--accent-red)' },
  ];

  const openStatusModal = (u, action) => {
    setReason('');
    setReasonModal({ user: u, action });
  };

  const confirmStatus = async () => {
    const { user: u, action } = reasonModal;
    setBusy(action);
    const status = action === 'suspend' ? 'suspended' : action === 'ban' ? 'banned' : 'active';
    await adminService.updateUserStatus(u.id, status, reason);
    await adminService.logAction(actor, `user.${action}`, u.username);
    setReasonModal(null); setBusy('');
    await refreshUsers();
    if (drawerUser?.id === u.id) setDrawerUser({ ...u, status, statusNote: reason || u.statusNote });
  };

  const handleRole = (u, action) => setConfirmModal({ user: u, action: 'role', role: action });

  const confirmRole = async () => {
    const { user: u, role } = confirmModal;
    setBusy(`role-${role}`);
    const targetRole = role === 'promote' ? 'moderator' : 'user';
    await adminService.updateUserRole(u.id, targetRole);
    await adminService.logAction(actor, role === 'promote' ? 'user.promote' : 'user.demote', u.username);
    setConfirmModal(null); setBusy('');
    await refreshUsers();
    if (drawerUser?.id === u.id) setDrawerUser({ ...u, role: targetRole });
  };

  const handleDelete = (u) => setConfirmModal({ user: u, action: 'delete' });

  const confirmDelete = async () => {
    const { user: u } = confirmModal;
    setBusy('delete');
    await adminService.deleteUser(u.id);
    await adminService.logAction(actor, 'user.delete', u.username);
    setConfirmModal(null); setBusy('');
    setDrawerUser(null);
    await refreshUsers();
  };

  const sendMessage = () => {
    setBusy('email');
    setTimeout(() => {
      setMessageModal(null); setMessage({ subject: '', body: '' }); setBusy('');
    }, 500);
  };

  const userSolves = drawerUser ? solves.filter(s => s.user === drawerUser.username) : [];
  const correctSolves = userSolves.filter(s => s.correct);
  const userSubmissions = drawerUser ? submissions.filter(s => s.user === drawerUser.username).slice(0, 8) : [];

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Loading users...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>User Management</h1>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {['all', 'admin', 'moderator', 'user'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ textTransform: 'capitalize' }}>
              {r}
            </button>
          ))}
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

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search username or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                {['User', 'Role', 'Points', 'Solved', 'Status', 'Joined', 'Last Active', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No users found</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setDrawerUser(u)}>
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
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        color: ROLE_COLORS[u.role] || 'var(--text-muted)', padding: '2px 8px', borderRadius: 20,
                        background: u.role === 'admin' ? 'rgba(139,92,246,0.12)' : u.role === 'moderator' ? 'rgba(61,221,208,0.12)' : 'transparent',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{u.points.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{u.solved}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{u.joinDate}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{u.lastActive}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="d-flex gap-2">
                        <button onClick={() => setMessageModal(u)} style={{ background: 'rgba(61,221,208,0.1)', border: '1px solid rgba(61,221,208,0.28)', color: 'var(--accent-cyan)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Send message">
                          <MailOpen size={14} />
                        </button>
                        {u.role !== 'admin' && (
                          <>
                            {u.role === 'moderator' && (
                              <button onClick={() => handleRole(u, 'demote')} style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.28)', color: 'var(--accent-yellow)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Demote to user">
                                <ArrowDownCircle size={14} />
                              </button>
                            )}
                            {u.status === 'active' || u.status === 'suspended' ? (
                              <>
                                <button onClick={() => openStatusModal(u, u.status === 'suspended' ? 'unsuspend' : 'suspend')} style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.28)', color: 'var(--accent-yellow)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title={u.status === 'suspended' ? 'Un-suspend' : 'Suspend'}>
                                  <Ban size={14} />
                                </button>
                                <button onClick={() => openStatusModal(u, 'ban')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--accent-red)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Ban">
                                  <Ban size={14} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => openStatusModal(u, u.status === 'banned' ? 'unban' : 'unsuspend')} style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--diff-easy)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Restore access">
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </>
                        )}
                        <button onClick={() => handleDelete(u)} disabled={u.username === actor} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--accent-red)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', opacity: u.username === actor ? 0.4 : 1 }} title={u.username === actor ? 'Cannot delete yourself' : 'Delete'}>
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
          <strong style={{ color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{reasonModal?.action === 'suspend' ? 'suspended' : reasonModal?.action === 'ban' ? 'banned' : 'active'}</strong>.
        </p>
        <label className="form-label">Reason</label>
        <textarea
          className="form-control" rows={3}
          placeholder="Optional — recorded in the audit log"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </Modal>

      {/* Role / delete confirm */}
      <Modal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.action === 'delete' ? 'Delete User' : confirmModal?.action === 'role' ? (confirmModal?.role === 'promote' ? 'Promote User' : 'Demote User') : ''}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setConfirmModal(null)}>Cancel</button>
            <button className="btn btn-danger d-flex align-items-center gap-2" onClick={confirmModal?.action === 'delete' ? confirmDelete : confirmRole} disabled={busy === 'delete' || busy === `role-${confirmModal?.role}`}>
              {busy === 'delete' || busy === `role-${confirmModal?.role}` ? <span className="spinner-border spinner-border-sm" /> : <Trash2 size={14} />} Confirm
            </button>
          </>
        }
      >
        {confirmModal?.action === 'delete' ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{confirmModal?.user?.username}</strong>? Their data and solves will be removed. This cannot be undone.
          </p>
        ) : (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {confirmModal?.role === 'promote'
              ? `Grant moderator privileges to ${confirmModal?.user?.username}?`
              : `Revoke moderator privileges from ${confirmModal?.user?.username}?`}
          </p>
        )}
      </Modal>

      {/* Quick message modal */}
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
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{drawerUser.username}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{drawerUser.email}</div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                      color: ROLE_COLORS[drawerUser.role] || 'var(--text-muted)', padding: '2px 8px', borderRadius: 20,
                      background: drawerUser.role === 'admin' ? 'rgba(139,92,246,0.12)' : drawerUser.role === 'moderator' ? 'rgba(61,221,208,0.12)' : 'transparent',
                    }}>{drawerUser.role}</span>
                    {statusBadge(drawerUser.status)}
                  </div>
                </div>
              </div>

              {drawerUser.statusNote && (
                <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.28)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.8rem', color: 'var(--accent-yellow)' }}>
                  <strong>Note:</strong> {drawerUser.statusNote}
                </div>
              )}

              <div className="row g-2 mb-4">
                {[
                  { label: 'Points', value: drawerUser.points.toLocaleString(), color: 'var(--accent-green)' },
                  { label: 'Solved', value: drawerUser.solved, color: 'var(--accent-cyan)' },
                  { label: 'Joined', value: drawerUser.joinDate.slice(0, 7), color: 'var(--text-secondary)' },
                  { label: 'Last Active', value: drawerUser.lastActive, color: 'var(--text-secondary)' },
                ].map(m => (
                  <div key={m.label} className="col-6">
                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-title mb-3 d-flex align-items-center gap-2">
                <Activity size={14} color="var(--accent-green)" /> Solve History ({correctSolves.length})
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, marginBottom: 20 }}>
                {userSolves.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>No solve attempts recorded.</div>
                ) : userSolves.slice(0, 8).map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < userSolves.slice(0, 8).length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: s.correct ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.correct ? <Shield size={13} color="var(--diff-easy)" /> : <X size={13} color="var(--accent-red)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{challengeTitle(s.challengeId)}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.submittedAt}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: s.correct ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {s.correct ? 'SOLVED' : 'WRONG'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="section-title mb-3 d-flex align-items-center gap-2">
                <FileText size={14} color="var(--accent-cyan)" /> Recent Submissions
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, marginBottom: 20 }}>
                {userSubmissions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>No flag submissions found.</div>
                ) : userSubmissions.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < userSubmissions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.challenge}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>{s.submittedAt}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: s.status === 'correct' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {s.status === 'correct' ? `+${s.points}` : 'INCORRECT'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {drawerUser.role !== 'admin' && (
                  <>
                    <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={() => setMessageModal(drawerUser)}>
                      <MailOpen size={14} /> Message
                    </button>
                    {drawerUser.status === 'active' || drawerUser.status === 'suspended' ? (
                      <>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => openStatusModal(drawerUser, drawerUser.status === 'suspended' ? 'unsuspend' : 'suspend')}><Ban size={13} /> {drawerUser.status === 'suspended' ? 'Un-suspend' : 'Suspend'}</button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => openStatusModal(drawerUser, 'ban')}><UserCheck size={13} /> Ban</button>
                      </>
                    ) : (
                      <button className="btn btn-outline-success btn-sm" onClick={() => openStatusModal(drawerUser, drawerUser.status === 'banned' ? 'unban' : 'unsuspend')}><RotateCcw size={13} /> Restore</button>
                    )}
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => handleRole(drawerUser, drawerUser.role === 'moderator' ? 'demote' : 'promote')}>
                      {drawerUser.role === 'moderator' ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />} {drawerUser.role === 'moderator' ? 'Demote' : 'Promote'}
                    </button>
                  </>
                )}
                <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2" onClick={() => handleDelete(drawerUser)} disabled={drawerUser.username === actor}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}