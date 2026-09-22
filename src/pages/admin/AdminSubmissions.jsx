import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle2, XCircle, Clock, Eye, Download } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { downloadCsv } from '../../utils/exportUtils';

function resultBadge(status) {
  const s = status === 'correct'
    ? { color: 'var(--diff-easy)', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 }
    : { color: 'var(--diff-hard)', bg: 'rgba(239,68,68,0.1)', icon: XCircle };
  const Icon = s.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      color: s.color, background: s.bg, padding: '2px 10px', borderRadius: 20,
    }}>
      <Icon size={12} /> {status}
    </span>
  );
}

function truncateFlag(flag) {
  return flag.length > 28 ? `${flag.slice(0, 25)}...` : flag;
}

export default function AdminSubmissions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setSubmissions(await adminService.getSubmissions());
      setLoading(false);
    })();
  }, []);

  const correct = submissions.filter(s => s.status === 'correct').length;
  const wrong   = submissions.filter(s => s.status === 'wrong').length;
  const totalPts = submissions.reduce((sum, s) => sum + s.points, 0);

  const filtered = submissions.filter(s =>
    (statusFilter === 'all' || s.status === statusFilter) &&
    (s.user.toLowerCase().includes(search.toLowerCase()) ||
     s.challenge.toLowerCase().includes(search.toLowerCase()) ||
     s.flag.toLowerCase().includes(search.toLowerCase()))
  );

  const exportCsv = () => {
    downloadCsv({
      filename: `submissions-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: ['id', 'user', 'challenge', 'flag', 'status', 'points', 'submittedAt'],
      rows: filtered,
    });
  };

  const statCards = [
    { icon: FileText,   value: submissions.length, label: 'Submissions',    color: 'var(--accent-cyan)' },
    { icon: CheckCircle2, value: correct,          label: 'Correct',        color: 'var(--accent-green)' },
    { icon: XCircle,    value: wrong,              label: 'Incorrect',      color: 'var(--accent-red)' },
    { icon: Clock,      value: totalPts,           label: 'Total Points',   color: 'var(--accent-purple)' },
  ];

  return (
    <div className="page-container">
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading submissions...</div>
      ) : (
        <>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Submissions</h1>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={exportCsv}>
            <Download size={14} /> Export CSV
          </button>
          {['all', 'correct', 'wrong'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <s.icon size={18} />
                </div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value.toLocaleString()}</div>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search user, challenge or flag..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                {['User', 'Challenge', 'Flag', 'Result', 'Points', 'Submitted'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No submissions found</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{s.user}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{s.id}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.challenge}</td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-yellow)',
                        background: 'rgba(234,179,8,0.08)', border: '1px dashed rgba(234,179,8,0.3)',
                        padding: '3px 10px', borderRadius: 6,
                      }}>
                        {truncateFlag(s.flag)}
                      </span>
                    </td>
                    <td>{resultBadge(s.status)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.points > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {s.points > 0 ? `+${s.points}` : `+${s.points}`}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{s.submittedAt}</td>
                  </tr>
                ))
              )}
</tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}