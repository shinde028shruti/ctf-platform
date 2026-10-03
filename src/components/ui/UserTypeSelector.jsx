import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Swords, ChevronRight, CheckCircle, Zap, BookOpen, Target, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function UserTypeSelector() {
  const { user } = useApp();
  const userType = user?.userType;
  const auth = !!user;
  const [hoveredType, setHoveredType] = useState(null);

  const options = [
    {
      type: 'student',
      icon: GraduationCap,
      title: 'Student',
      tagline: 'Learn & Practice',
      accentColor: '#6C8EF5',          /* solid indigo-blue */
      borderColor: 'rgba(108,142,245,0.35)',
      glowColor:   'rgba(108,142,245,0.12)',
      features: [
        { icon: BookOpen, text: 'Curated learning path with guided challenges' },
        { icon: Target,   text: 'Easy-to-medium difficulty prioritised' },
        { icon: Zap,      text: 'Cheatsheets and hints encouraged' },
        { icon: TrendingUp, text: 'Progress tracking across all categories' },
      ],
    },
    {
      type: 'competitor',
      icon: Swords,
      title: 'Competitor',
      tagline: 'Compete & Dominate',
      accentColor: '#C47FE8',          /* solid soft-purple */
      borderColor: 'rgba(196,127,232,0.35)',
      glowColor:   'rgba(196,127,232,0.12)',
      features: [
        { icon: Swords,     text: 'All challenges unlocked at full difficulty' },
        { icon: TrendingUp, text: 'Leaderboard-driven competitive experience' },
        { icon: Zap,        text: 'Optimised for speed and scoring efficiency' },
        { icon: Target,     text: 'Event participation and rank climbing' },
      ],
    },
  ];

  return (
    <section style={{
      padding: '100px 0 90px',
      position: 'relative',
      background: 'transparent',
    }}>
      {/* Top fade bridge — hero bleeds into this section */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 140,
        background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Ambient blobs behind the cards */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', left: '10%', top: '20%',
          width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,142,245,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', right: '8%', bottom: '15%',
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,127,232,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Section heading ── */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
            color: 'var(--text-muted)', letterSpacing: '0.18em',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            <span style={{ width: 24, height: 1, background: 'var(--border-bright)', display: 'inline-block' }} />
            Choose Your Path
            <span style={{ width: 24, height: 1, background: 'var(--border-bright)', display: 'inline-block' }} />
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800, margin: 0, lineHeight: 1.15,
            color: 'var(--text-primary)',
          }}>
            Student <span style={{ color: 'var(--text-muted)', fontWeight: 300 }}>or</span> Competitor?
          </h2>
          <p style={{
            color: 'var(--text-secondary)', maxWidth: 500,
            margin: '14px auto 0', lineHeight: 1.75, fontSize: '0.95rem',
          }}>
            Your mode shapes which challenges surface and how the platform guides you.
          </p>
        </motion.div>

        {/* ── Cards ── */}
        <div className="row g-4 justify-content-center">
          {options.map((opt, i) => {
            const Icon    = opt.icon;
            const isActive  = userType === opt.type;
            const isHovered = hoveredType === opt.type;

            return (
              <motion.div
                key={opt.type}
                className="col-md-6 col-lg-5"
                initial={{ opacity: 0, y: 44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.13 }}
              >
                <Link
                  to={auth ? '/challenges' : '/register'}
                  className="text-decoration-none d-block h-100"
                  onMouseEnter={() => setHoveredType(opt.type)}
                  onMouseLeave={() => setHoveredType(null)}
                >
                  {/* Glass card — transparent background, only border + blur */}
                  <div style={{
                    position: 'relative',
                    height: '100%',
                    borderRadius: 20,
                    padding: '36px 32px 32px',
                    /* Glassmorphism: thin solid-colored border, very light tint */
                    background: isHovered || isActive
                      ? `linear-gradient(135deg, ${opt.glowColor} 0%, rgba(255,255,255,0.02) 100%)`
                      : 'rgba(255,255,255,0.025)',
                    border: isActive
                      ? `1.5px solid ${opt.accentColor}`
                      : `1px solid ${isHovered ? opt.borderColor : 'rgba(255,255,255,0.08)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: isActive
                      ? `0 0 40px ${opt.glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)`
                      : isHovered
                        ? `0 8px 40px ${opt.glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`
                        : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                    transition: 'all 0.28s ease',
                    overflow: 'hidden',
                  }}>

                    {/* Corner accent stripe */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '100%', height: 2,
                      background: `linear-gradient(90deg, transparent 0%, ${opt.accentColor} 50%, transparent 100%)`,
                      opacity: isActive || isHovered ? 1 : 0,
                      transition: 'opacity 0.28s ease',
                      borderRadius: '20px 20px 0 0',
                    }} />

                    {/* Active badge */}
                    {isActive && (
                      <span style={{
                        position: 'absolute', top: 16, right: 16,
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                        color: opt.accentColor,
                        background: `${opt.accentColor}18`,
                        border: `1px solid ${opt.accentColor}40`,
                        borderRadius: 20, padding: '4px 10px',
                        letterSpacing: '0.08em',
                      }}>
                        <CheckCircle size={10} strokeWidth={2.5} /> Active
                      </span>
                    )}

                    {/* Icon + title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: `${opt.accentColor}14`,
                        border: `1px solid ${opt.accentColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        color: opt.accentColor,
                        transition: 'background 0.28s, box-shadow 0.28s',
                        boxShadow: isHovered || isActive ? `0 0 20px ${opt.accentColor}28` : 'none',
                      }}>
                        <Icon size={30} strokeWidth={1.6} />
                      </div>
                      <div>
                        <div style={{
                          fontSize: '1.55rem', fontWeight: 800,
                          color: 'var(--text-primary)', lineHeight: 1.1,
                          letterSpacing: '-0.01em',
                        }}>
                          {opt.title}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                          color: opt.accentColor, letterSpacing: '0.14em',
                          textTransform: 'uppercase', marginTop: 4, fontWeight: 600,
                        }}>
                          {opt.tagline}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                      height: 1,
                      background: `linear-gradient(90deg, ${opt.accentColor}40 0%, transparent 80%)`,
                      marginBottom: 24,
                    }} />

                    {/* Feature list */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {opt.features.map((f, fi) => {
                        const FIcon = f.icon;
                        return (
                          <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{
                              flexShrink: 0, marginTop: 1,
                              width: 24, height: 24, borderRadius: 8,
                              background: `${opt.accentColor}12`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: opt.accentColor,
                            }}>
                              <FIcon size={13} strokeWidth={2} />
                            </span>
                            <span style={{
                              fontSize: '0.875rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.55,
                            }}>
                              {f.text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* CTA row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        color: opt.accentColor,
                        fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}>
                        {auth ? 'Browse Challenges' : 'Sign Up & Select'}
                        <ChevronRight size={15} strokeWidth={2.5} />
                      </span>

                      {/* Mini rank indicator dots */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3].map(d => (
                          <span key={d} style={{
                            width: 5, height: opt.type === 'competitor' ? 5 + d * 4 : 16 - d * 3,
                            borderRadius: 2,
                            background: isHovered || isActive ? opt.accentColor : 'var(--border-bright)',
                            transition: 'background 0.28s, height 0.28s',
                            alignSelf: 'flex-end',
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
