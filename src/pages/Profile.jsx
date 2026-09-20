import React from 'react';
import { Trophy, Flag, Flame, Target, Star, Calendar, TrendingUp, CheckCircle, Lightbulb, Zap, Code, Lock, Search, Binary, Medal, Ghost } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { badges as allBadges } from '../data/notifications';

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function ActivityIcon({ type }) {
  const s = { size: 14 };
  if (type === 'solve') return <CheckCircle {...s} color="var(--accent-green)" />;
  if (type === 'badge') return <Trophy {...s} color="var(--accent-green)" />;
  if (type === 'hint')  return <Lightbulb {...s} color="var(--accent-green)" />;
  return <Zap {...s} color="var(--accent-cyan)" />;
}

const badgeIcons = { Trophy, Flame, Code, Lock, Search, Zap, Binary, Target, Medal, Ghost };

export default function Profile() {
  const { user } = useApp();
  if (!user) return null;

  const userBadges = allBadges.filter(b => user.badges?.includes(b.id));
  const lockedBadges = allBadges.filter(b => !user.badges?.includes(b.id));

  const totalChallenges = Object.values(user.categoryStats || {}).reduce((s, v) => s + v.total, 0);
  const solvedCount = user.solvedChallenges?.length || 0;
  const completionPct = totalChallenges ? Math.round((solvedCount / totalChallenges) * 100) : 0;

  const topCategories = Object.entries(user.categoryStats || {})
    .sort((a, b) => b[1].points - a[1].points);

  return (
    <div className="page-container">
      <div className="row g-4">
        {/* Profile card */}
        <div className="col-lg-4">
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 16, overflow: 'hidden', animation: 'fadeInUp 0.4s ease',
          }}>
            {/* Banner */}
            <div style={{
              height: 100,
              background: 'linear-gradient(135deg, rgba(116,100,220,0.1) 0%, rgba(116,100,220,0.06) 50%, rgba(139,92,246,0.06) 100%)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', bottom: -28, left: 24,
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900,
                color: '#0A0917',
                border: '3px solid var(--bg-card)',
              }}>
                {user.username[0].toUpperCase()}
              </div>
            </div>

            <div style={{ padding: '40px 24px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{user.username}</h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                {user.bio && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>{user.bio}</p>}
              </div>

              <div className="divider" style={{ margin: '16px 0' }} />

              {[
                { icon: Trophy, color: 'var(--accent-green)',  label: 'Global Rank', value: `#${user.rank}` },
                { icon: Zap,    color: 'var(--accent-cyan)',   label: 'Total Points', value: user.points?.toLocaleString() },
                { icon: Flag,   color: 'var(--accent-green)',   label: 'Challenges Solved', value: solvedCount },
                { icon: Flame,  color: 'var(--accent-green)', label: 'Current Streak', value: `${user.streak} days` },
                { icon: Target, color: 'var(--accent-green)', label: 'Completion', value: `${completionPct}%` },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                    <Icon size={15} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{value}</div>
                  </div>
                </div>
              ))}

              <div className="divider" style={{ margin: '16px 0' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Joined {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-lg-8">
          {/* Badges */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px', marginBottom: 20, animation: 'fadeInUp 0.4s ease 0.1s both' }}>
            <div className="section-title mb-4">Badges</div>

            {userBadges.length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Earned ({userBadges.length})
                </div>
                <div className="d-flex flex-wrap gap-3 mb-4">
                  {userBadges.map(b => (
                    <div key={b.id} style={{
                      background: `${b.color}12`,
                      border: `1px solid ${b.color}40`,
                      borderRadius: 12, padding: '12px 16px',
                      textAlign: 'center', minWidth: 90,
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${b.color}20`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ marginBottom: 6 }}>{(() => { const BIcon = badgeIcons[b.icon] || Trophy; return <BIcon size={32} color={b.color} />; })()}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.75rem', color: b.color, marginBottom: 2 }}>{b.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{b.rarity}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Locked ({lockedBadges.length})
            </div>
            <div className="d-flex flex-wrap gap-3">
              {lockedBadges.map(b => (
                <div key={b.id} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12, padding: '12px 16px',
                  textAlign: 'center', minWidth: 90, opacity: 0.4,
                  filter: 'grayscale(100%)',
                }} title={b.description}>
                  <div style={{ marginBottom: 6 }}>{(() => { const BIcon = badgeIcons[b.icon] || Trophy; return <BIcon size={32} color={b.color} />; })()}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 2 }}>{b.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{b.rarity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category performance */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px', marginBottom: 20, animation: 'fadeInUp 0.4s ease 0.2s both' }}>
            <div className="section-title mb-4">Category Performance</div>
            {topCategories.map(([cat, stats]) => (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cat}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {stats.solved}/{stats.total}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                      {stats.points} pts
                    </span>
                  </div>
                </div>
                <div className="cf-progress">
                  <div className="cf-progress-bar" style={{ width: `${stats.total ? (stats.solved / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', animation: 'fadeInUp 0.4s ease 0.3s both' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div className="section-title">Recent Activity</div>
            </div>
            {(user.recentActivity || []).map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                borderBottom: i < (user.recentActivity?.length - 1) ? '1px solid var(--border-color)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ActivityIcon type={a.type} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.type === 'solve' ? `Solved: ${a.challengeName}` : a.type === 'badge' ? `Badge: ${a.badge}` : `Hint revealed: ${a.challengeName}`}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(a.timestamp)}</div>
                </div>
                {a.points && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>
                    +{a.points} pts
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
