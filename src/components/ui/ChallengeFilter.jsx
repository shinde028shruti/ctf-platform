import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = ['All', 'Web Exploitation', 'Cryptography', 'Reverse Engineering', 'Digital Forensics', 'OSINT', 'Networking', 'Binary Exploitation', 'Mobile Security', 'Steganography', 'Miscellaneous'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard', 'Insane'];
const STATUSES = ['All', 'solved', 'unsolved'];
const SORTS = [
  { value: 'default', label: 'Default' },
  { value: 'points_asc', label: 'Points: Low → High' },
  { value: 'points_desc', label: 'Points: High → Low' },
  { value: 'solves_desc', label: 'Most Solved' },
  { value: 'solves_asc', label: 'Least Solved' },
  { value: 'newest', label: 'Newest' },
];

export default function ChallengeFilter({ filters, onChange, total }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  const hasActive = filters.search || filters.category !== 'All' || filters.difficulty !== 'All' || filters.status !== 'All' || filters.sort !== 'default';

  const clear = () => onChange({ search: '', category: 'All', difficulty: 'All', status: 'All', sort: 'default' });

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      padding: '20px',
      marginBottom: 24,
    }}>
      {/* Search row */}
      <div className="d-flex gap-3 align-items-center mb-3">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 38 }}
            placeholder="Search challenges..."
            value={filters.search}
            onChange={e => set('search', e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          <SlidersHorizontal size={14} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{total} challenges</span>
        </div>
        {hasActive && (
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={clear}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="row g-2">
        <div className="col-12 col-sm-6 col-md-3">
          <select className="form-select form-select-sm" value={filters.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>
        <div className="col-6 col-sm-3 col-md-2">
          <select className="form-select form-select-sm" value={filters.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d === 'All' ? 'All Levels' : d}</option>)}
          </select>
        </div>
        <div className="col-6 col-sm-3 col-md-2">
          <select className="form-select form-select-sm" value={filters.status} onChange={e => set('status', e.target.value)}>
            <option value="All">All Status</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <select className="form-select form-select-sm" value={filters.sort} onChange={e => set('sort', e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActive && (
        <div className="d-flex flex-wrap gap-2 mt-3">
          {filters.category !== 'All' && (
            <span className="cat-chip" style={{ cursor: 'pointer' }} onClick={() => set('category', 'All')}>
              {filters.category} <X size={10} style={{ marginLeft: 4 }} />
            </span>
          )}
          {filters.difficulty !== 'All' && (
            <span className={`diff-badge diff-${filters.difficulty.toLowerCase()}`} style={{ cursor: 'pointer' }} onClick={() => set('difficulty', 'All')}>
              {filters.difficulty} <X size={10} style={{ marginLeft: 4 }} />
            </span>
          )}
          {filters.status !== 'All' && (
            <span className="tag-chip" style={{ cursor: 'pointer' }} onClick={() => set('status', 'All')}>
              {filters.status} <X size={10} style={{ marginLeft: 4 }} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
