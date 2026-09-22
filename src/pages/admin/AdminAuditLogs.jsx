import React, { useState, useEffect } from 'react';
import { Search, ScrollText, ListFilter, Download } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { downloadCsv } from '../../utils/exportUtils';

const ACTION_COLORS = {
  'challenge.create':  'var(--accent-green)',
  'challenge.update':  'var(--accent-cyan)',
  'challenge.publish': 'var(--diff-easy)',
  'challenge.delete':  'var(--diff-hard)',
  'user.promote':      'var(--accent-purple)',
  'user.suspend':      'var(--accent-yellow)',
  'user.ban':          'var(--diff-hard)',
  'settings.update':   'var(--accent-orange)',
  'category.create':   'var(--accent-teal)',
  'submission.review': 'var(--violet-bright)',
};

function actionBadge(action) {
  const color = ACTION_COLORS[action] || 'var(--accent-cyan)';
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
      color, background: `${color}14`, border: `1px solid ${color}33`,
      padding: '3px 10px', borderRadius: 6, whiteSpace: 'nowrap',
    }}>
      {action}
    </span>
  );
}

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLogs(await adminService.getAuditLogs());
      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter(l =>
    l.actor.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.target.toLowerCase().includes(search.toLowerCase()) ||
    l.ip.includes(search)
  );

  const uniqueActors = [...new Set(logs.map(l => l.actor))];

  const exportCsv = () => {
    downloadCsv({
      filename: `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: ['id', 'actor', 'action', 'target', 'ip', 'timestamp'],
      rows: filtered,
    });
  };

  return (
    <div className="page-container">
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading audit logs...</div>
      ) : (
        <>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '8px 0 0' }}>
            A record of administrative actions across the platform.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={exportCsv}>
            <Download size={14} /> Export CSV
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-yellow)' }}>
            <ListFilter size={14} /> {filtered.length} / {logs.length} entries
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search actor, action, target or IP..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ScrollText size={15} color="var(--violet-bright)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Recent activity by {uniqueActors.join(', ')}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                {['Actor', 'Action', 'Target', 'IP Address', 'Timestamp'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No audit entries found</td></tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.actor}</span>
                    </td>
                    <td>{actionBadge(l.action)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{l.target}</td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                        padding: '2px 8px', borderRadius: 6,
                      }}>
                        {l.ip}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
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