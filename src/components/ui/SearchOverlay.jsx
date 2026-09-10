import React, { useState, useEffect, useRef } from 'react';
import { Search, Flag, Users, Tag, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { challenges, categories } from '../../data/challenges';
import { events } from '../../data/events';
import { leaderboardUsers } from '../../data/users';

export default function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();

    const challengeResults = challenges
      .filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.tags.some(t => t.includes(q)))
      .slice(0, 4)
      .map(c => ({ type: 'challenge', icon: Flag, label: c.title, sub: c.category, color: 'var(--accent-cyan)', to: `/challenges/${c.id}` }));

    const userResults = leaderboardUsers
      .filter(u => u.username.toLowerCase().includes(q))
      .slice(0, 2)
      .map(u => ({ type: 'user', icon: Users, label: u.username, sub: `#${u.rank} · ${u.points.toLocaleString()} pts`, color: 'var(--accent-green)', to: `/profile` }));

    const categoryResults = categories
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 2)
      .map(c => ({ type: 'category', icon: Tag, label: c.name, sub: `${c.count} challenges`, color: 'var(--accent-purple)', to: `/challenges` }));

    const eventResults = events
      .filter(e => e.title.toLowerCase().includes(q))
      .slice(0, 2)
      .map(e => ({ type: 'event', icon: Calendar, label: e.title, sub: e.subtitle, color: 'var(--accent-blue)', to: `/events` }));

    setResults([...challengeResults, ...userResults, ...categoryResults, ...eventResults]);
  }, [query]);

  const go = (to) => { navigate(to); onClose(); };

  return (
    <div className="search-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-box" style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
          <Search size={20} color="var(--accent-green)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search challenges, users, categories, events..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
          />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)' }}>
            {results.map((r, i) => (
              <div key={i} className="search-result-item" onClick={() => go(r.to)}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: `${r.color}15`, color: r.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <r.icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.sub}</div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  color: 'var(--text-muted)', background: 'var(--bg-elevated)',
                  padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                }}>
                  {r.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)' }}>
            No results for "{query}"
          </div>
        )}

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 16 }}>
          {[['↵', 'select'], ['↑↓', 'navigate'], ['esc', 'close']].map(([key, label]) => (
            <span key={key} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
