import React, { useMemo } from 'react';
import { Award, Trophy, CheckCircle2, Compass, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { achievements, setInsaneChallengeIds } from '../data/achievements';
import { challenges } from '../data/challenges';
import AchievementBadge from '../components/ui/AchievementBadge';

setInsaneChallengeIds(
  challenges.filter(c => c.difficulty === 'Insane' || c.id === 24).map(c => c.id)
);

export default function Achievements() {
  const { user } = useApp();

  const stats = useMemo(() => {
    const solvedIdList = user?.solvedChallenges || [];
    const list = achievements.map(a => ({
      ...a,
      earned: typeof a.check === 'function' ? a.check(user, solvedIdList) : false,
      progress:
        a.categoryKey && a.categoryStatsKey
          ? { gained: user?.categoryStats?.[a.category]?.solved || 0 }
          : null,
    }));
    const earnedCount = list.filter(a => a.earned).length;
    return { list, earnedCount, total: list.length };
  }, [user]);

  const bonus = stats.list.filter(a => a.earned).reduce((s, a) => s + a.reward, 0);
  const pct = Math.round((stats.earnedCount / stats.total) * 100);

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="section-title mb-2">Collection</div>
        <h1 style={{ margin: 0 }}>Achievements</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.9rem' }}>
          Earn badges, unlock the grid, and show the world what you are made of.
        </p>
      </div>

      {/* Summary */}
      <div className="d-flex flex-column flex-md-row flex-wrap gap-3 mb-4 animate-fade-in-up delay-100">
        <div style={{
          flex: 1, minWidth: 220, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 50, background: 'rgba(116,100,220,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} color="var(--accent-green)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stats.earnedCount}<span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/{stats.total}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>Badges Unlocked</div>
          </div>
        </div>

        <div style={{
          flex: 1, minWidth: 220, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 50, background: 'rgba(116,100,220,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} color="var(--accent-green)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              +{bonus.toLocaleString()}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>Bonus Points Earned</div>
          </div>
        </div>

        <div style={{
          flex: 1.4, minWidth: 260, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 14, padding: 20,
        }}>
          <div className="d-flex justify-content-between mb-2">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Collection Progress</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>{pct}%</span>
          </div>
          <div className="cf-progress" style={{ height: 8 }}>
            <div className="cf-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
            {stats.total - stats.earnedCount} more to discover
          </div>
        </div>
      </div>

      {/* Grid */}
      {stats.earnedCount > 0 && (
        <div className="mb-4" style={{ background: 'linear-gradient(135deg, rgba(116,100,220,0.06) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(116,100,220,0.15)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono)' }}>
          <CheckCircle2 size={18} color="var(--accent-green)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Newly unlocked: <strong style={{ color: 'var(--accent-green)' }}>{stats.list.filter(a => a.earned).map(a => a.name).join(', ')}</strong>
          </span>
        </div>
      )}

      <div className="row g-3">
        {stats.list.map((a, i) => (
          <div key={a.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <div
              className="h-100 animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.04}s`,
                background: a.earned ? 'var(--bg-card)' : 'var(--bg-secondary)',
                border: `1px solid ${a.earned ? 'rgba(116,100,220,0.25)' : 'var(--border-color)'}`,
                borderRadius: 14,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                position: 'relative',
                overflow: 'hidden',
                opacity: a.earned ? 1 : 0.75,
                transition: 'all 0.2s',
              }}
            >
              {a.earned && (
                <div style={{
                  position: 'absolute', top: 0, right: 0, padding: '5px 12px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'rgba(116,100,220,0.12)', borderBottomLeftRadius: 10,
                  color: 'var(--accent-green)', borderLeft: '1px solid rgba(116,100,220,0.2)', borderBottom: '1px solid rgba(116,100,220,0.2)',
                }}>
                  Earned
                </div>
              )}

              <div className="d-flex justify-content-between align-items-start">
                <AchievementBadge icon={a.icon} gradient={a.gradient} glow={a.glow} locked={!a.earned} />
                <span className="tag-chip" style={{ alignSelf: 'flex-start' }}>{a.category}</span>
              </div>

              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: a.earned ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {a.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 4 }}>
                  {a.description}
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                {a.earned ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Reward earned: <span style={{ color: 'var(--accent-green)' }}>+{a.reward} pts</span>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Reward: <span style={{ color: 'var(--text-muted)' }}>+{a.reward} pts</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 32, padding: '28px', textAlign: 'center',
        border: '1px dashed var(--border-bright)', borderRadius: 14,
      }}>
        <Compass size={22} color="var(--accent-green)" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hungry for more?</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
          Complete the Newbie Bootcamp to unlock bigger legends of the forge.
        </div>
        <a href="/challenges" className="btn btn-outline-secondary btn-sm mt-3">
          <BookOpen size={14} /> Browse Challenges
        </a>
      </div>
    </div>
  );
}