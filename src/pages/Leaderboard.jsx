import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Flame, Target } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { leaderboardService } from '../services/leaderboardService';

const TABS = ['Global', 'Weekly', 'Monthly', 'Event'];
const flagEmoji = { US:'🇺🇸', DE:'🇩🇪', RU:'🇷🇺', CN:'🇨🇳', IN:'🇮🇳', GB:'🇬🇧', FR:'🇫🇷', JP:'🇯🇵', CA:'🇨🇦', BR:'🇧🇷', AU:'🇦🇺', NL:'🇳🇱', SE:'🇸🇪', PL:'🇵🇱', ES:'🇪🇸' };

function Podium({ users }) {
  const [first, second, third] = users;
  const items = [
    { user: second, pos: 2, height: 120, color: '#c0c0c0', medal: '🥈' },
    { user: first,  pos: 1, height: 160, color: '#ffd700', medal: '🥇' },
    { user: third,  pos: 3, height:  90, color: '#cd7f32', medal: '🥉' },
  ];

  return (
    <div className="podium-container animate-fade-in-up">
      {items.map(({ user, pos, height, color, medal }) => user && (
        <div key={pos} className="podium-item">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{medal}</div>
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
              #{pos}
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let list = [];
        if (tab === 'Global')  list = await leaderboardService.getGlobalLeaderboard();
        if (tab === 'Weekly')  list = await leaderboardService.getWeeklyLeaderboard();
        if (tab === 'Monthly') list = await leaderboardService.getMonthlyLeaderboard();
        if (tab === 'Event')   list = await leaderboardService.getEventLeaderboard(1);
        setData(list);
      } catch { setData([]); }
      setLoading(false);
    })();
  }, [tab]);

  const top3 = data.slice(0, 3);
  const rest  = data.slice(3);

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

      {loading ? (
        <LoadingSpinner fullPage text="Loading leaderboard..." />
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && <Podium users={top3} />}

          {/* Table */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            <table className="lb-table">
              <thead>
                <tr>
                  {['Rank','Player','Points','Solved','Accuracy','Streak'].map(h => (
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
                {data.map((u, i) => (
                  <tr key={u.id}
                    className={`lb-row ${u.isCurrentUser ? 'current-user' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <td>
                      <span className={`lb-rank ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}`}>
                        {i < 3
                          ? ['🥇','🥈','🥉'][i]
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
                            {flagEmoji[u.country] || '🌐'} {u.country}
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
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: u.streak >= 7 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                        {u.streak >= 7 ? '🔥' : ''} {u.streak}d
                      </span>
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
