import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MedalIcon from '../components/ui/MedalIcon';
import { leaderboardService } from '../services/leaderboardService';

const TABS = ['Global', 'Weekly', 'Country/Region', 'Category']; 
const TAB_LOADERS = {
  'Global': 'getGlobalLeaderboard',
  'Weekly': 'getWeeklyLeaderboard',
  'Country/Region': 'getCountryLeaderboard',
  'Category': 'getCategoryLeaderboard',
};

function Podium({ users }) {
  const [first, second, third] = users;
  const items = [
    { user: second, pos: 2, height: 120, color: '#c0c0c0' },
    { user: first,  pos: 1, height: 160, color: '#ffd700' },
    { user: third,  pos: 3, height:  90, color: '#cd7f32' },
  ];

  return (
    <div className="podium-container animate-fade-in-up">
      {items.map(({ user, pos, height, color }) => user && (
        <div key={pos} className="podium-item">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ marginBottom: 4 }}><MedalIcon tier={pos} size={34} /></div>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}40, ${color}20)`,
              border: `2px solid ${color}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800,
              color, margin: '0 auto 6px',
            }}>
              {user.username[0].toUpperCase()}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {user.username}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color, fontWeight: 700 }}>
              {user.points.toLocaleString()} pts
            </div>
          </div>
          <div className={`podium-pedestal podium-${pos}`} style={{ height, width: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 900, color }}>
              {pos}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState('Global');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setFilter('All');
      setSearch('');
      try {
        const loader = leaderboardService[TAB_LOADERS[tab]];
        const list = loader ? await loader() : [];
        setData(list);
      } catch { setData([]); }
      setLoading(false);
    })();
  }, [tab]);

  const isFilterable = tab === 'Country/Region' || tab === 'Category';
  const filterOptions = isFilterable
    ? [...new Set(data.map(u => u.meta).filter(Boolean))]
    : [];

  const visibleData = data.filter(u => {
    const matchFilter = !isFilterable || filter === 'All' || u.meta === filter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || u.username.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const top3 = visibleData.slice(0, 3);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div className="section-title mb-2">Rankings</div>
        <h1 style={{ margin: 0 }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.9rem' }}>
          Compete globally. Every flag counts.
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 10, padding: 4, marginBottom: 28,
        width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? 'var(--bg-elevated)' : 'none',
            border: tab === t ? '1px solid var(--border-bright)' : '1px solid transparent',
            color: tab === t ? 'var(--accent-green)' : 'var(--text-muted)',
            borderRadius: 7, padding: '8px 20px',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {isFilterable && !loading && (
        <div className="d-flex flex-column flex-md-row gap-2 mb-3 animate-fade-in-up">
          <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="form-control"
              placeholder={`Search ${tab === 'Country/Region' ? 'players' : 'experts'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
          </div>
          <select
            className="form-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 200, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
          >
            <option value="All">All {tab === 'Country/Region' ? 'Regions' : 'Categories'}</option>
            {filterOptions.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullPage text="Loading leaderboard..." />
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && <Podium users={top3} />}
          {visibleData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              No results match your search.
            </div>
          )}

          {/* Table */}
          <div className="table-scroll" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
          }}>
            <table className="lb-table">
              <thead>
                <tr>
                  {['Rank','Player','Points','Solved','Accuracy'].map(h => (
                    <th key={h} style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleData.map((u, i) => (
                  <tr key={u.id}
                    className={`lb-row ${u.isCurrentUser ? 'current-user' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <td>
                      <span className={`lb-rank ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}`}>
                        {i < 3
                          ? <MedalIcon tier={i + 1} size={17} />
                          : `#${u.rank}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: u.isCurrentUser
                            ? 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))'
                            : 'var(--bg-elevated)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700,
                          color: u.isCurrentUser ? '#071a1a' : 'var(--text-secondary)',
                          flexShrink: 0,
                        }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: u.isCurrentUser ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                            {u.username} {u.isCurrentUser && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-green)', opacity: 0.7 }}>(you)</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {u.meta || u.country}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-green)' }}>
                        {u.points.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {u.solved}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${u.accuracy}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {u.accuracy}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
