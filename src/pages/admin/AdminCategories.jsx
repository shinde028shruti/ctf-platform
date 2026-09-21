import React, { useState } from 'react';
import { Plus, Search, Tag, Layers, Puzzle, Pencil, Trash2 } from 'lucide-react';
import { categories, challenges } from '../../data/challenges';

export default function AdminCategories() {
  const [search, setSearch] = useState('');

  const enriched = categories.map(cat => ({
    ...cat,
    challengeCount: challenges.filter(c => c.category === cat.name).length || cat.count,
  }));

  const filtered = enriched.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { icon: Tag,    value: categories.length,  label: 'Categories',    color: 'var(--accent-cyan)' },
    { icon: Layers, value: challenges.length,  label: 'Challenges',    color: 'var(--accent-green)' },
    { icon: Puzzle, value: enriched.reduce((s, c) => s + c.challengeCount, 0), label: 'Total Challenges', color: 'var(--accent-purple)' },
  ];

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>Categories</h1>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2">
          <Plus size={16} /> Create Category
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
        <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search categories..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                {['Category', 'Description', 'Challenges', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No categories found</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: `${c.color}1f`, border: `1px solid ${c.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Tag size={16} color={c.color} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 380 }}>
                      <span style={{ fontSize: '0.8rem' }}>{c.description}</span>
                    </td>
                    <td><span className="cat-chip" style={{ fontSize: '0.7rem' }}>{c.challengeCount} challenges</span></td>
                    <td>
                      <div className="d-flex gap-2">
                        <button onClick={() => {}} style={{ background: 'rgba(116,100,220,0.1)', border: '1px solid rgba(116,100,220,0.28)', color: 'var(--violet-bright)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => {}} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--accent-red)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex' }} title="Delete">
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
    </div>
  );
}