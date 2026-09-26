import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ThemedSelect from './ThemedSelect';

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
          <ThemedSelect
            value={filters.category}
            options={CATEGORIES.map(c => ({ value: c, label: c === 'All' ? 'All Categories' : c }))}
            onChange={v => set('category', v)}
          />
        </div>
        <div className="col-6 col-sm-3 col-md-2">
          <ThemedSelect
            value={filters.difficulty}
            options={DIFFICULTIES.map(d => ({ value: d, label: d === 'All' ? 'All Levels' : d }))}
            onChange={v => set('difficulty', v)}
          />
        </div>
        <div className="col-6 col-sm-3 col-md-2">
          <ThemedSelect
            value={filters.status}
            options={STATUSES.map(s => ({ value: s, label: s === 'All' ? 'All Status' : s[0].toUpperCase() + s.slice(1) }))}
            onChange={v => set('status', v)}
          />
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <ThemedSelect
            value={filters.sort}
            options={SORTS}
            onChange={v => set('sort', v)}
          />
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
