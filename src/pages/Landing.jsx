import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight, Globe, Lock, Cpu, Search, Eye, Network, Terminal as TermIcon, Smartphone, Image, Puzzle, Trophy, Calendar, ArrowRight, Users, Flag, Star } from 'lucide-react';
import { challenges, categories } from '../data/challenges';
import { leaderboardUsers } from '../data/users';
import { events } from '../data/events';

const catIconMap = { Globe, Lock, Cpu, Search, Eye, Network, Terminal: TermIcon, Smartphone, Image, Puzzle };

function TypewriterText({ text, speed = 90, startDelay = 600 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let i = 0;
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, speed, startDelay]);
  return (
    <>
      {text.slice(0, count)}
      <span className="terminal-cursor" style={{ width: 6, height: 12, verticalAlign: 'middle', marginLeft: 3, position: 'relative', bottom: 1.5 }} />
    </>
  );
}

function AnimatedCounter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = target / 60;
    const t = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(Math.floor(v));
      if (v >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

export default function Landing() {
  const featured = challenges.filter(c => c.featured).slice(0, 3);
  const topUsers = leaderboardUsers.slice(0, 5);
  const upcomingEvent = events.find(e => e.status === 'upcoming');

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg" />
        {/* Animated particles */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${[200,300,150,250,180,220][i]}px`,
              height: `${[200,300,150,250,180,220][i]}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${['rgba(14,201,181,0.04)', 'rgba(14,201,181,0.03)', 'rgba(139,92,246,0.03)', 'rgba(14,201,181,0.03)', 'rgba(14,201,181,0.04)', 'rgba(14,201,181,0.03)'][i]} 0%, transparent 70%)`,
              left: `${[10,70,30,80,5,55][i]}%`,
              top: `${[20,60,80,10,50,40][i]}%`,
              animation: `float ${[6,8,7,9,6.5,7.5][i]}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }} />
          ))}
        </div>

        <div className="container pt-4 pb-5" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-6 animate-fade-in-up">
              <div className="d-flex align-items-center gap-2 mb-4">
                <span className="status-dot green" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-green)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <TypewriterText text="Platform Online" />
                </span>
              </div>
              <h1 className="hero-title mb-4">
                ENTER THE<br />CYBER ARENA
              </h1>
              <p className="hero-subtitle mb-5">
                Every flag has a story.<br />
                Test your cybersecurity skills through real-world inspired challenges — from web exploitation to kernel pwn.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/register" className="btn btn-primary d-flex align-items-center gap-2"
                  style={{ padding: '14px 28px', fontSize: '0.95rem', letterSpacing: '0.03em' }}>
                  Join the CTF <ChevronRight size={18} />
                </Link>
                <Link to="/challenges" className="btn btn-outline-primary d-flex align-items-center gap-2"
                  style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                  Explore Challenges
                </Link>
              </div>
              <div className="d-flex flex-wrap gap-4 mt-5">
                {[
                  { val: 4820, label: 'Hackers', suf: '+' },
                  { val: challenges.length, label: 'Challenges', suf: '' },
                  { val: 10, label: 'Categories', suf: '' },
                  { val: 3, label: 'Events', suf: '' },
                ].map(({ val, label, suf }) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                      <AnimatedCounter target={val} suffix={suf} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6 animate-fade-in delay-300">
              {/* Terminal widget */}
              <div className="terminal-box animate-glow" style={{ maxWidth: 480, marginLeft: 'auto' }}>
                <div className="terminal-titlebar">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                  <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    cyberforge@arena:~
                  </span>
                </div>
                <div className="terminal-body">
                  <TypedLines />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About CyberForge ── */}
      <section style={{ background: 'var(--bg-secondary)', padding: '80px 0', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-title mb-2">About Us</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Built by Hackers, for Hackers</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 620, margin: '12px auto 0', lineHeight: 1.7 }}>
              CyberForge CTF is a professional cybersecurity training and competition platform designed for learners
              at every level — from complete beginners to seasoned security researchers. Every flag you capture
              represents a real skill learned.
            </p>
          </div>

          <div className="row g-4">
            {[
              { icon: Flag,    color: 'var(--accent-green)',  title: 'Jeopardy-Style CTF',   desc: 'Our challenges follow the Jeopardy format — solve problems across categories to earn points. No attack/defense complexity.' },
              { icon: Globe,   color: 'var(--accent-cyan)',   title: 'Real-World Scenarios', desc: 'Challenges are modeled after real vulnerability classes seen in production environments and bug bounty programs.' },
              { icon: Trophy,  color: 'var(--accent-yellow)', title: 'Competitive Events',   desc: 'Participate in timed events to compete for prizes and recognition on the global stage.' },
              { icon: Users,   color: 'var(--accent-purple)', title: 'Community Driven',     desc: 'Challenges authored by security professionals and experienced CTF players from around the world.' },
            ].map(({ icon: Icon, color, title, desc }, i) => (
              <div key={title} className="col-md-6 col-lg-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="cf-card p-4 h-100">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 14 }}>
                    <Icon size={20} />
                  </div>
                  <h5 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How CTF Works ── */}
      <section style={{ background: 'var(--bg-secondary)', padding: '80px 0', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>What is a CTF?</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '12px auto 0' }}>
              Capture The Flag (CTF) competitions are cybersecurity contests where participants solve hacking challenges to find hidden "flags" and earn points.
            </p>
          </div>
          <div className="row g-4">
            {[
              { num: '01', icon: Flag, color: 'var(--accent-green)', title: 'Choose a Challenge', desc: 'Browse challenges across 10 categories — from beginner-friendly web exploitation to advanced kernel exploitation.' },
              { num: '02', icon: TermIcon, color: 'var(--accent-cyan)', title: 'Hack & Investigate', desc: 'Use your skills to find vulnerabilities, decode secrets, analyze traffic, or reverse-engineer binaries.' },
              { num: '03', icon: Shield, color: 'var(--accent-purple)', title: 'Submit the Flag', desc: 'Hidden flags follow the format CTF{...}. Find them and submit to earn points. Use hints if you\'re stuck.' },
              { num: '04', icon: Trophy, color: 'var(--accent-green)', title: 'Climb the Ranks', desc: 'Points accumulate on the global leaderboard. Compete in events for prizes and recognition.' },
            ].map(({ num, icon: Icon, color, title, desc }) => (
              <div key={num} className="col-md-6 col-lg-3 animate-fade-in-up">
                <div className="cf-card p-4 h-100 cf-card-glow">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                      <Icon size={22} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--border-bright)' }}>{num}</span>
                  </div>
                  <h5 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>{title}</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-5">
            <div>
              <div className="section-title mb-2">Categories</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Challenge Categories</h2>
            </div>
            <Link to="/challenges" className="view-all-btn btn btn-outline-primary btn-sm d-none d-md-flex align-items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="row g-3">
            {categories.map((cat, i) => {
              const IconName = cat.icon;
              return (
                <div key={cat.id} className="col-6 col-md-4 col-lg-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Link to="/challenges" className="d-block text-decoration-none">
                    <div className="cf-card p-3 h-100">
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, marginBottom: 10 }}>
                        <Flag size={18} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>{cat.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cat.count} challenges</div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Challenges ── */}
      <section style={{ background: 'var(--bg-secondary)', padding: '80px 0', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-5">
            <div>
              <div className="section-title mb-2">Featured</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Featured Challenges</h2>
            </div>
            <Link to="/challenges" className="btn btn-outline-primary btn-sm d-none d-md-flex align-items-center gap-1">
              All Challenges <ArrowRight size={14} />
            </Link>
          </div>
          <div className="row g-4">
            {featured.map(c => (
              <div key={c.id} className="col-md-4">
                <Link to={`/challenges/${c.id}`} className="text-decoration-none">
                  <div className="challenge-card cf-card-glow" style={{ height: '100%', cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className="cat-chip">{c.category}</span>
                      <span className={`diff-badge diff-${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
                    </div>
                    <div className="challenge-title mb-2">{c.title}</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                      {c.description.slice(0, 110)}...
                    </p>
                    <div className="challenge-meta mt-3">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Users size={12} style={{ marginRight: 4 }} />
                        {c.solves.toLocaleString()} solves
                      </span>
                      <span className="challenge-points">{c.points} pts</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leaderboard Preview ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="row g-5 align-items-stretch">
            <div className="col-lg-6 d-flex flex-column">
              <div className="section-title mb-2">Leaderboard</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Top Hackers</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
                Compete against hackers worldwide. Every solved challenge earns points and improves your global ranking.
              </p>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', flex: 1 }}>
                {topUsers.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', padding: '10px 16px',
                    borderBottom: i < topUsers.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className={`lb-rank ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}`} style={{ minWidth: 24 }}>
                      #{u.rank}
                    </span>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#071a1a', margin: '0 10px', flexShrink: 0 }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{u.username}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {u.solved} solved
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>
                      {u.points.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/leaderboard" className="btn btn-outline-primary mt-4 d-inline-flex align-items-center gap-2">
                Full Leaderboard <ArrowRight size={16} />
              </Link>
            </div>

            {/* Upcoming Event */}
            <div className="col-lg-6 d-flex flex-column">
              <div className="section-title mb-2">Events</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Upcoming Competition</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
                Participate in timed CTF events to compete for prizes and recognition.
              </p>
              {upcomingEvent && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 16, overflow: 'hidden',
                  position: 'relative',
                  flex: 1,
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(14,201,181,0.08) 0%, rgba(14,201,181,0.05) 100%)',
                    padding: '20px',
                    borderBottom: '1px solid var(--border-color)',
                  }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className="status-dot green" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Registration Open
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
                      {upcomingEvent.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                      {upcomingEvent.subtitle}
                    </p>
                  </div>
                  <div className="row g-0">
                    {[
                      { label: 'Format', val: upcomingEvent.format },
                      { label: 'Team Size', val: upcomingEvent.teamSize },
                      { label: 'Participants', val: upcomingEvent.participants.toLocaleString() },
                      { label: 'Prize Pool', val: '$10,000' },
                    ].map(({ label, val }) => (
                      <div key={label} className="col-6" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <Link to="/events" className="btn btn-primary w-100">
                      View Event Details
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(14,201,181,0.06) 0%, rgba(14,201,181,0.04) 50%, rgba(139,92,246,0.04) 100%)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '80px 0',
      }}>
        <div className="container text-center">
          <Shield size={48} color="var(--accent-green)" style={{ marginBottom: 20 }} />
          <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '2rem', fontWeight: 900, marginBottom: 16 }}>
            Ready to Prove Your Skills?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 480, margin: '0 auto 32px' }}>
            Join thousands of hackers. Solve real-world challenges. Capture flags. Climb the leaderboard.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/register" className="btn btn-primary d-flex align-items-center gap-2"
              style={{ padding: '14px 32px', fontSize: '0.95rem' }}>
              Start Hacking <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline-secondary"
              style={{ padding: '14px 32px', fontSize: '0.95rem' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function TypedLines() {
  const lines = [
    { type: 'cmd', text: './start_ctf.sh', delay: 200 },
    { type: 'out', text: 'Initializing CyberForge...', delay: 800 },
    { type: 'out', text: 'Loading 18 challenges...      [OK]', delay: 1400 },
    { type: 'out', text: 'Checking connection...         [OK]', delay: 2000 },
    { type: 'success', text: 'Access granted.', delay: 2700 },
    { type: 'cmd', text: 'whoami', delay: 3300 },
    { type: 'success', text: '> Welcome, hacker_', delay: 3800 },
  ];
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    const timers = lines.map((l, i) => setTimeout(() => setVisible(p => [...p, l]), l.delay));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <>
      {visible.map((l, i) => (
        <span key={i} className={`terminal-line ${l.type}`} style={{ display: 'block' }}>
          {l.type === 'cmd' && <span style={{ color: 'var(--accent-cyan)' }}>$ </span>}
          {l.text}
        </span>
      ))}
      {visible.length < lines.length && <span className="terminal-cursor" />}
    </>
  );
}
