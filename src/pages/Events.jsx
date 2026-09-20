import React, { useState, useEffect } from 'react';
import { Calendar, Users, Trophy, Clock, ChevronDown, ChevronUp, CheckCircle, ExternalLink } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MedalIcon from '../components/ui/MedalIcon';
import { eventService } from '../services/eventService';

function Countdown({ targetDate }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) return setTime({ d: 0, h: 0, m: 0, s: 0 });
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  const pads = (n) => String(n).padStart(2, '0');
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {[['d', 'Days'], ['h', 'Hours'], ['m', 'Minutes'], ['s', 'Seconds']].map(([k, label]) => (
        <div key={k} style={{
          textAlign: 'center',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: 10, padding: '14px 18px',
          minWidth: 70,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-green)', lineHeight: 1 }}>
            {pads(time[k])}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ event, onJoin }) {
  const [expanded, setExpanded] = useState(false);
  const [joining, setJoining] = useState(false);

  const statusColor = { upcoming: 'var(--diff-easy)', ended: 'var(--text-muted)', active: 'var(--accent-cyan)' };
  const statusLabel = { upcoming: 'Registration Open', ended: 'Ended', active: 'Live Now' };

  const handleJoin = async () => {
    setJoining(true);
    await onJoin(event.id);
    setJoining(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 16, overflow: 'hidden',
      marginBottom: 20,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
    >
      {/* Header */}
      <div style={{
        background: event.featured
          ? 'linear-gradient(135deg, rgba(116,100,220,0.06) 0%, rgba(116,100,220,0.04) 100%)'
          : 'transparent',
        padding: '28px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div style={{ flex: 1 }}>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              {event.featured && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
                  background: 'rgba(116,100,220,0.12)', border: '1px solid rgba(116,100,220,0.3)',
                  color: 'var(--accent-green)', padding: '2px 10px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>Featured</span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: statusColor[event.status] }}>
                <span className="status-dot" style={{ background: statusColor[event.status], marginRight: 5 }} />
                {statusLabel[event.status]}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 4,
                textTransform: 'uppercase',
              }}>{event.type}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 900, marginBottom: 6 }}>
              {event.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{event.subtitle}</p>
          </div>

          {/* Action */}
          {event.status === 'upcoming' && (
            <div>
              {event.joined ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(116,100,220,0.08)', border: '1px solid rgba(116,100,220,0.25)',
                  borderRadius: 10, padding: '10px 18px',
                  color: 'var(--accent-green)', fontSize: '0.875rem', fontWeight: 600,
                }}>
                  <CheckCircle size={16} /> Registered
                </div>
              ) : (
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={handleJoin} disabled={joining}
                  style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
                >
                  {joining ? 'Joining...' : 'Join CTF'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Countdown */}
        {event.status === 'upcoming' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Starts In
            </div>
            <Countdown targetDate={event.startDate} />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="row g-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {[
          { icon: Calendar, label: 'Start Date', value: new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { icon: Calendar, label: 'End Date',   value: new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { icon: Users,    label: 'Participants', value: event.participants.toLocaleString() },
          { icon: Trophy,   color: 'var(--accent-green)', label: 'Top Prize',  value: event.prizes?.[0]?.reward?.split('+')[0]?.trim() || 'TBA' },
        ].map(({ icon: Icon, color, label, value }, i) => (
          <div key={label} className="col-6 col-md-3" style={{
            padding: '16px 20px',
            borderRight: i < 3 ? '1px solid var(--border-color)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Icon size={13} color={color || 'var(--text-muted)'} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Description + expand */}
      <div style={{ padding: '20px 28px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 16 }}>
          {event.description}
        </p>

        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '8px 16px',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.85rem', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--accent-green)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {expanded ? <><ChevronUp size={14} /> Hide Details</> : <><ChevronDown size={14} /> Show Details</>}
        </button>

        {expanded && (
          <div style={{ marginTop: 20, animation: 'fadeInUp 0.25s ease' }}>
            <div className="row g-4">
              {/* Categories */}
              <div className="col-md-6">
                <div className="section-title mb-3">Categories</div>
                <div className="d-flex flex-wrap gap-2">
                  {event.categories.map(c => (
                    <span key={c} className="cat-chip">{c}</span>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="col-md-6">
                <div className="section-title mb-3">Format</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div className="mb-1"><strong style={{ color: 'var(--text-primary)' }}>Format:</strong> {event.format}</div>
                  <div className="mb-1"><strong style={{ color: 'var(--text-primary)' }}>Team Size:</strong> {event.teamSize}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Difficulty:</strong> {event.difficulty}</div>
                </div>
              </div>

              {/* Prizes */}
              {event.prizes?.length > 0 && (
                <div className="col-12">
                  <div className="section-title mb-3">Prizes</div>
                  <div className="row g-2">
                    {event.prizes.map((p, i) => (
                      <div key={i} className="col-md-4">
                        <div style={{
                          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                          borderRadius: 10, padding: '14px 16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.875rem', marginBottom: 4, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-primary)' }}>
                            <MedalIcon tier={i + 1} size={18} />
                            {p.place}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.reward}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {event.rules?.length > 0 && (
                <div className="col-md-6">
                  <div className="section-title mb-3">Rules</div>
                  <ol style={{ paddingLeft: 20, margin: 0 }}>
                    {event.rules.map((r, i) => (
                      <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 6 }}>{r}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Schedule */}
              {event.schedule?.length > 0 && (
                <div className="col-md-6">
                  <div className="section-title mb-3">Schedule</div>
                  <div className="d-flex flex-column gap-2">
                    {event.schedule.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 12, padding: '10px 14px',
                        background: 'var(--bg-secondary)', borderRadius: 8,
                        borderLeft: '2px solid var(--accent-green)',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{s.event}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{s.time}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await eventService.getEvents();
      setEvents(list);
      setLoading(false);
    })();
  }, []);

  const handleJoin = async (id) => {
    const updated = await eventService.joinEvent(id);
    setEvents(prev => prev.map(e => e.id === id ? updated : e));
  };

  if (loading) return <LoadingSpinner fullPage text="Loading events..." />;

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="section-title mb-2">Competitions</div>
        <h1 style={{ margin: 0 }}>CTF Events</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>
          Compete in time-limited events for prizes and glory.
        </p>
      </div>

      {events.map(e => (
        <div key={e.id} className="animate-fade-in-up">
          <EventCard event={e} onJoin={handleJoin} />
        </div>
      ))}
    </div>
  );
}
