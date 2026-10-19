import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, Flag, Flame, Target, Star, Calendar, TrendingUp, CheckCircle, Lightbulb, Zap, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { achievementService, resolveIcon } from '../services/achievementService';
import { activityKey } from '../utils/activity';

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

/** '@handle' for display, whether or not the user typed the leading '@'. */
function handleLabel(value) {
  return value.startsWith('@') ? value : `@${value}`;
}

/** Resolve a stored handle to a profile URL; keeps a full URL as-is. */
function socialUrl(value, host) {
  if (/^https?:\/\//.test(value)) return value;
  return `https://${host}/${value.replace(/^@/, '')}`;
}

function ActivityIcon({ type }) {
  const s = { size: 14 };
  if (type === 'solve') return <CheckCircle {...s} color="var(--accent-green)" />;
  if (type === 'badge') return <Trophy {...s} color="var(--accent-green)" />;
  if (type === 'hint')  return <Lightbulb {...s} color="var(--accent-orange)" />;
  return <Zap {...s} color="var(--accent-cyan)" />;
}

export default function Profile() {
  const { user, stats, statsLoading, statsError, refreshStats } = useApp();
  const [progressRange, setProgressRange] = useState('weekly');

  // Badges come from the real player achievement board — the same source the
  // Achievements page uses — rather than a static display list, and rather than
  // `user.badges` (which /auth/me/ never populates, so it was always empty).
  // `earned` is computed server-side from the caller's stored solve history.
  //
  // A request sequence number guards against a stale response (from a retry or
  // a previous account) overwriting newer state. Loading and failure are held
  // separately from a successful empty result, so a failed request can never be
  // rendered as "0 earned".
  const [achievements, setAchievements] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgesError, setBadgesError] = useState('');
  const badgesReq = useRef(0);

  const loadBadges = useCallback(async () => {
    const req = badgesReq.current + 1;
    badgesReq.current = req;
    setBadgesLoading(true);
    setBadgesError('');
    try {
      const list = await achievementService.getActiveAchievements();
      if (badgesReq.current === req) setAchievements(list);
    } catch (err) {
      if (badgesReq.current === req) {
        setBadgesError(err?.message || 'Could not load your badges.');
      }
    } finally {
      if (badgesReq.current === req) setBadgesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBadges();
    // Invalidate any in-flight request when the identity changes (login /
    // account switch) or on unmount, so one account's board can never land in
    // another account's view.
    return () => { badgesReq.current += 1; };
  }, [loadBadges, user?.username]);

  const reduceMotion = useReducedMotion();
  if (!user) return null;

  // First load shows a spinner; a failed refresh keeps the last good stats.
  if (statsLoading && !stats) {
    return (
      <div className="page-container">
        <LoadingSpinner fullPage text="Loading your profile..." />
      </div>
    );
  }

  if (statsError && !stats) {
    return (
      <div className="page-container">
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 16, padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            {statsError}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => refreshStats()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // All numbers are backend-authoritative (see statsService). `points` is the
  // spendable balance; `earnedPoints` is the gross total before hint spending.
  const rank = stats?.rank ?? null;
  const spendable = stats?.points ?? user.points ?? 0;
  const earned = stats?.earnedPoints ?? 0;
  const spentOnHints = stats?.spentOnHints ?? 0;
  const solvedCount = stats?.solved ?? 0;

  // Level / rank / Elite come from the same server-derived payload the
  // Dashboard and Sidebar read, so all three surfaces always agree.
  const progression = stats?.progression ?? null;
  const level = progression?.level ?? 1;
  const tier = progression?.tier ?? 'Rookie';
  const elitePct = progression?.elitePct ?? 0;

  const categoryProgress = stats?.categoryProgress ?? [];
  const totalChallenges = categoryProgress.reduce((s, c) => s + c.total, 0);
  const completionPct = totalChallenges ? Math.round((solvedCount / totalChallenges) * 100) : 0;
  const topCategories = [...categoryProgress].sort((a, b) => b.points - a.points);

  const joinDateLabel = (stats?.joinDate ?? user.joinDate)
    ? new Date(stats?.joinDate ?? user.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const progressData = progressRange === 'weekly'
    ? (stats?.progress?.weekly || [])
    : (stats?.progress?.monthly || []);
  const maxProgress = Math.max(1, ...progressData.map(p => p.points));
  const totalProgress = progressData.reduce((s, p) => s + p.points, 0);
  /* Average over active periods only. Averaging over every day would drag the
     line down for rest days, which reads as a drop in effort rather than a rest. */
  const activeDays = progressData.filter(p => p.points > 0);
  const avgActive = activeDays.length ? Math.round(totalProgress / activeDays.length) : 0;
  const peak = progressData.reduce((best, p) => (p.points > (best?.points ?? -1) ? p : best), null);
  const bestDay = peak && peak.points > 0 ? peak : null;
  const recentActivity = stats?.recentActivity ?? [];

  // Earned/locked split is authoritative: `earned` is derived by the server
  // from the user's stored solves, so it always matches the Achievements page.
  const earnedBadges = achievements.filter(a => a.earned);
  const lockedBadges = achievements.filter(a => !a.earned);

  return (
    <div className="page-container">
      <div className="row g-4">
        {/* Profile card */}
        <div className="col-12 col-xl-5">
          <div className="d-flex flex-column" style={{ gap: 20, height: '100%' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 16, overflow: 'hidden', flex: 1,
              animation: 'fadeInUp 0.4s ease',
            }}>
            {/* Banner */}
            <div style={{
              height: 100,
              background: 'linear-gradient(135deg, rgba(116,100,220,0.1) 0%, rgba(116,100,220,0.06) 50%, rgba(139,92,246,0.06) 100%)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 14, left: 24, right: 24,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {joinDateLabel && <><Calendar size={12} color="var(--accent-green)" />Member since {joinDateLabel}</>}
                </span>
              </div>
              <div style={{
                position: 'absolute', bottom: -28, left: 24,
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900,
                color: '#0A0917',
                border: '3px solid var(--bg-card)',
              }}>
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user.username[0].toUpperCase()}
              </div>
            </div>

            <div style={{ padding: '40px 24px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{user.displayName || user.username}</h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  @{user.username}{user.email ? ` · ${user.email}` : ''}
                </div>
                {user.bio && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>{user.bio}</p>}
                {(user.website || user.twitter || user.github) && (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
                    {user.website && (
                      <a href={user.website} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {user.twitter && (
                      <a href={socialUrl(user.twitter, 'twitter.com')} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                        {handleLabel(user.twitter)}
                      </a>
                    )}
                    {user.github && (
                      <a href={socialUrl(user.github, 'github.com')} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                        {handleLabel(user.github)}
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="divider" style={{ margin: '16px 0' }} />

              {[
                { icon: Trophy, color: 'var(--accent-green)',  label: 'Global Rank', value: rank != null ? `#${rank}` : '—' },
                { icon: Award,  color: 'var(--accent-cyan)',   label: 'Level', value: `${level} · ${tier}` },
                { icon: TrendingUp, color: 'var(--accent-purple)', label: 'Elite Progress', value: `${elitePct}%` },
                { icon: Zap,    color: 'var(--accent-cyan)',   label: 'Points Balance', value: spendable.toLocaleString() },
                { icon: Star,   color: 'var(--accent-purple)', label: 'Points Earned', value: earned.toLocaleString() },
                { icon: Lightbulb, color: 'var(--accent-orange)', label: 'Spent on Hints', value: spentOnHints.toLocaleString() },
                { icon: Flag,   color: 'var(--accent-green)',   label: 'Challenges Solved', value: solvedCount },
                { icon: Flame,  color: 'var(--accent-green)', label: 'Current Streak', value: '—' },
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
            </div>
          </div>

            {/* Category performance — its own card, separated by the column gap */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 16, padding: '24px', flexShrink: 0,
              animation: 'fadeInUp 0.4s ease 0.2s both',
            }}>
              <div className="section-title mb-4">Category Performance</div>
              {topCategories.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '8px 0' }}>
                  No category data yet.
                </div>
              ) : topCategories.map(c => (
                <div key={c.id} style={{ marginBottom: 16 }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, display: 'inline-block' }} />
                      {c.name}
                    </span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.solved}/{c.total}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                        {c.points} pts
                      </span>
                    </div>
                  </div>
                  <div className="cf-progress">
                    <div className="cf-progress-bar" style={{ width: `${c.total ? (c.solved / c.total) * 100 : 0}%`, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-12 col-xl-7">
          {/* Badges */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px', marginBottom: 20, animation: 'fadeInUp 0.4s ease 0.1s both' }}>
            <div className="section-title mb-4">Badges</div>

            {badgesLoading ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                Loading badges...
              </div>
            ) : badgesError ? (
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 10, padding: '20px 16px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {badgesError}
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={loadBadges}>
                  Retry
                </button>
              </div>
            ) : achievements.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '8px 0' }}>
                No badges available yet.
              </div>
            ) : (
              <>
                {earnedBadges.length > 0 && (
                  <>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      Earned ({earnedBadges.length})
                    </div>
                    <div className="d-flex flex-wrap gap-3 mb-4">
                      {earnedBadges.map(b => {
                        const color = b.gradient[0];
                        const BIcon = resolveIcon(b.icon);
                        return (
                          <div key={b.id} style={{
                            background: `${color}12`,
                            border: `1px solid ${color}40`,
                            borderRadius: 12, padding: '12px 16px',
                            textAlign: 'center', minWidth: 90,
                            transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${color}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <div style={{ marginBottom: 6 }}><BIcon size={32} color={color} /></div>
                            <div style={{ fontWeight: 700, fontSize: '0.75rem', color, marginBottom: 2 }}>{b.name}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{b.rarity}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Locked ({lockedBadges.length})
                </div>
                <div className="d-flex flex-wrap gap-3">
                  {lockedBadges.map(b => {
                    const color = b.gradient[0];
                    const BIcon = resolveIcon(b.icon);
                    return (
                      <div key={b.id} style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 12, padding: '12px 16px',
                        textAlign: 'center', minWidth: 90, opacity: 0.4,
                        filter: 'grayscale(100%)',
                      }} title={b.description}>
                        <div style={{ marginBottom: 6 }}><BIcon size={32} color={color} /></div>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 2 }}>{b.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{b.rarity}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{
              marginTop: 20, padding: '14px 16px',
              background: 'rgba(116,100,220,0.06)',
              border: '1px solid rgba(116,100,220,0.16)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Flame size={16} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                Every expert was once a beginner. Ready to start a new streak?
              </p>
            </div>
          </div>

          {/* Progress overview */}
          <div className="po-card">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
              <div>
                <div className="section-title mb-1">Progress Overview</div>
                <div className="po-sub">
                  {progressRange === 'weekly'
                    ? 'Points captured each day of this week'
                    : 'Points captured across the last 30 days'}
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {bestDay && (
                  <span className="po-peak">
                    <Flame size={12} /> Peak {bestDay.label} · {bestDay.points} pts
                  </span>
                )}
                <div className="toggle-pill">
                  <button className={progressRange === 'weekly' ? 'active' : ''} onClick={() => setProgressRange('weekly')}>Weekly</button>
                  <button className={progressRange === 'monthly' ? 'active' : ''} onClick={() => setProgressRange('monthly')}>Monthly</button>
                </div>
              </div>
            </div>

            <div className="po-stats">
              {[
                { icon: TrendingUp, label: 'Points earned', value: totalProgress.toLocaleString(), sub: progressRange === 'weekly' ? 'this week' : 'last 30 days', tone: 'cyan' },
                { icon: Flame, label: 'Best day', value: bestDay ? bestDay.label : '—', sub: bestDay ? `${bestDay.points.toLocaleString()} pts` : 'no points yet', tone: 'green' },
                { icon: Zap, label: 'Avg / active day', value: avgActive.toLocaleString(), sub: 'pts', tone: 'purple' },
                { icon: Target, label: 'Active days', value: `${activeDays.length}/${progressData.length}`, sub: progressData.length === 1 ? 'period' : 'periods', tone: 'orange' },
              ].map(({ icon: Icon, label, value, sub, tone }) => (
                <div key={label} className={`po-stat po-stat-${tone}`}>
                  <div className="po-stat-icon"><Icon size={15} /></div>
                  <div className="po-stat-body">
                    <div className="po-stat-label">{label}</div>
                    <div className="po-stat-value">{value}</div>
                    <div className="po-stat-sub">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {progressData.length === 0 ? (
              <div className="po-empty">No progress recorded yet. Go capture a flag!</div>
            ) : (
              <div className="po-plot">
                {/* Reference lines sit behind the bars: the dashed average, plus a
                    hairline at the halfway mark so bar heights stay readable. */}
                <div className="po-line po-line-grid" style={{ bottom: '50%' }} aria-hidden="true" />
                {avgActive > 0 && (
                  <div className="po-line po-line-avg" style={{ bottom: `${Math.min(100, (avgActive / maxProgress) * 100)}%` }} aria-hidden="true">
                    <span className="po-line-tag">AVG {avgActive}</span>
                  </div>
                )}

                <div className="po-cols">
                  {progressData.map((p, i) => {
                    const pct = (p.points / maxProgress) * 100;
                    const barPct = p.points > 0 ? Math.max(9, pct) : 0;
                    return (
                      <div key={i} className={`po-col ${p.points > 0 ? 'is-active' : 'is-rest'}`}>
                        <div className="po-tip">
                          <span className="po-tip-label">{p.label}</span>
                          <span className="po-tip-value">{p.points.toLocaleString()} pts</span>
                        </div>
                        {p.points > 0 && (
                          <span className="po-value" style={{ bottom: `calc(${barPct}% + 6px)` }}>{p.points}</span>
                        )}
                        <motion.div
                          className="po-bar"
                          initial={{ height: 0 }}
                          animate={{ height: p.points > 0 ? `${barPct}%` : '3px' }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
                        />
                        <div className="po-xlabel">{p.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', animation: 'fadeInUp 0.4s ease 0.3s both' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div className="section-title">Recent Activity</div>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                No activity yet.
              </div>
            ) : recentActivity.map((a, i) => (
              <div key={activityKey(a)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-color)' : 'none',
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
                {a.type === 'hint' ? (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-orange)', whiteSpace: 'nowrap' }}>
                    −{a.cost} pts
                  </span>
                ) : a.points ? (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>
                    +{a.points} pts
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
