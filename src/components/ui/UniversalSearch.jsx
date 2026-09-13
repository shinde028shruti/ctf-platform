import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Flag, Folder, Calendar, User, SearchX } from 'lucide-react';
import { challenges } from '../../data/challenges';
import { events } from '../../data/events';
import { leaderboardUsers } from '../../data/users';
import { fuzzScore } from '../../utils/fuzzySearch';

const GROUP_ORDER = ['Challenges', 'Categories', 'Events', 'Users'];

function buildIndex() {
  const items = [];

  challenges.forEach(c => {
    items.push({
      id: `c-${c.id}`,
      type: 'Challenges',
      title: c.title,
      subtitle: `${c.category} · ${c.difficulty} · ${c.points} pts`,
      icon: Flag,
      iconColor: 'var(--accent-green)',
      to: `/challenges/${c.id}`,
      key: `${c.title} ${c.category} ${c.difficulty}`,
    });
  });

  const cats = [];
  challenges.forEach(c => {
    if (!cats.includes(c.category)) cats.push(c.category);
  });
  cats.forEach(cat => {
    items.push({
      id: `cat-${cat}`,
      type: 'Categories',
      title: cat,
      subtitle: 'Browse all challenges in this category',
      icon: Folder,
      iconColor: 'var(--accent-teal)',
      to: `/challenges?category=${encodeURIComponent(cat)}`,
      key: `${cat} category challenge`,
    });
  });

  events.forEach(e => {
    items.push({
      id: `e-${e.id}`,
      type: 'Events',
      title: e.title,
      subtitle: `${e.format} · ${e.status}`,
      icon: Calendar,
      iconColor: 'var(--accent-yellow)',
      to: '/events',
      key: `${e.title} ${e.subtitle} ${e.type} ${e.tags?.join(' ')}`,
    });
  });

  leaderboardUsers.forEach(u => {
    items.push({
      id: `u-${u.id}`,
      type: 'Users',
      title: u.username,
      subtitle: `${u.points} pts · Rank #${u.rank || u.global_rank || '?'}`,
      icon: User,
      iconColor: 'var(--text-muted)',
      to: '/leaderboard',
      key: `${u.username}`,
    });
  });

  return items;
}

export default function UniversalSearch({ mobile = false, onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const index = useMemo(buildIndex, []);

  const grouped = useMemo(() => {
    if (!query.trim()) return {};
    const scored = index
      .map(item => ({ item, score: fuzzScore(query, item.key) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
    const byType = {};
    scored.forEach(r => {
      (byType[r.item.type] = byType[r.item.type] || []).push(r.item);
    });
    Object.keys(byType).forEach(t => { byType[t] = byType[t].slice(0, 5); });
    return byType;
  }, [query, index]);

  const totalHits = Object.values(grouped).reduce((n, g) => n + g.length, 0);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function keyHandler(e) {
      if (e.key === 'Escape') setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

const go = item => {
    setOpen(false);
    setQuery('');
    navigate(item.to);
    onNavigate?.();
  };

  return (
    <div ref={wrapRef}
      className={mobile ? 'cf-search-mobile' : 'cf-search-desktop'}>
      <div style={{ position: 'relative' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', top: '50%', left: 11, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="form-control cf-search-input"
          placeholder="Search... (Ctrl+K)"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          style={{ paddingLeft: 36, paddingRight: 30, fontSize: '0.85rem' }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            style={searchClearStyle}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
          borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
          overflow: 'hidden', zIndex: 1080,
        }}>
          {query.trim() && totalHits === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <SearchX size={22} color="var(--text-muted)" style={{ marginBottom: 6 }} />
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                No results for &ldquo;{query}&rdquo;
              </div>
            </div>
          ) : (
            GROUP_ORDER.filter(g => grouped[g]?.length).map(group => (
              <div key={group}>
                <div style={{
                  background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '7px 14px', borderBottom: '1px solid var(--border-color)',
                }}>
                  {group}
                </div>
                {grouped[group].map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => go(item)} className="cf-dropdown-item"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', border: '1px solid var(--border-color)',
                      }}>
                        <Icon size={14} color={item.iconColor} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{item.title}</div>
                        <div style={{
                          fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{item.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
          {query.trim() === '' && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              Type to search across the platform
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const searchClearStyle = {
  position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
  background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
  width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
};