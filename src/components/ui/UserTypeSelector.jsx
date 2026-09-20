import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Swords, ChevronRight, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function UserTypeSelector() {
  const { user } = useApp();
  const userType = user?.userType;
  const auth = !!user;

  const options = [
    {
      type: 'student',
      icon: GraduationCap,
      title: 'Student',
      tagline: 'Learn & Practice',
      color: 'var(--accent-cyan)',
      bg: 'rgba(61,221,208,0.08)',
      features: [
        'Curated learning path with guided challenges',
        'Easy-to-medium challenges prioritized',
        'Cheatsheets and hints encouraged for learning',
        'Progress tracking across skill-building categories',
      ],
    },
    {
      type: 'competitor',
      icon: Swords,
      title: 'Competitor',
      tagline: 'Compete & Dominate',
      color: 'var(--accent-purple)',
      bg: 'rgba(139,92,246,0.08)',
      features: [
        'All challenges unlocked in full difficulty',
        'Leaderboard-driven competitive experience',
        'Optimized for speed and scoring efficiency',
        'Event participation and rank climbing',
      ],
    },
  ];

  return (
    <section style={{ padding: '80px 0', position: 'relative' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="section-title mb-2" style={{ justifyContent: 'center' }}>Choose Your Path</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Student or Competitor?</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '12px auto 0', lineHeight: 1.7 }}>
            Your mode shapes which challenges are surfaced and how the platform guides you.
          </p>
        </div>

        <div className="row g-4">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            const isActive = userType === opt.type;
            return (
              <div key={opt.type} className="col-md-6 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <Link
                  to={auth ? '/challenges' : '/register'}
                  className="text-decoration-none d-block h-100"
                >
                  <div
                    style={{
                      background: opt.bg,
                      border: isActive ? `2px solid ${opt.color}` : '1px solid var(--border-bright)',
                      borderRadius: 18,
                      padding: '32px 28px',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.25s ease',
                      boxShadow: isActive ? `0 0 30px ${opt.color}22` : 'none',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = opt.color;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      if (!isActive) e.currentTarget.style.borderColor = 'var(--border-bright)';
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: -40, right: -40,
                      width: 120, height: 120, borderRadius: '50%',
                      background: `radial-gradient(circle, ${opt.color}14 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />

                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: `${opt.color}18`,
                        border: `1px solid ${opt.color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: opt.color, flexShrink: 0,
                      }}>
                        <Icon size={28} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                          {opt.title}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: opt.color, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                          {opt.tagline}
                        </div>
                      </div>
                      {isActive && (
                        <span style={{
                          marginLeft: 'auto',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                          color: opt.color, background: `${opt.color}18`,
                          border: `1px solid ${opt.color}33`, borderRadius: 20,
                          padding: '4px 10px',
                        }}>
                          <CheckCircle size={11} /> Selected
                        </span>
                      )}
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {opt.features.map(f => (
                        <li key={f} style={{ display: 'flex', gap: 10, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <span style={{ color: opt.color, marginTop: 4, flexShrink: 0 }}>›</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      color: opt.color,
                      fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600,
                    }}>
                      {auth ? 'Browse Challenges' : 'Sign Up & Select'} <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}