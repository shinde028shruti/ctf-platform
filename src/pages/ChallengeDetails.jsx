import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Flag, Users, CheckCircle, XCircle, Download,
  ExternalLink, Copy, ChevronRight, Tag, Clock, User, Globe,
  File, FileText, FileCode, FileImage, FileTerminal, Package, Smartphone, Activity,
  Power, Server, Loader, Square
} from 'lucide-react';
import HintCard from '../components/ui/HintCard';
import CheatsheetTab from '../components/ui/CheatsheetTab';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { challengeService } from '../services/challengeService';
import { useApp } from '../context/AppContext';

const diffClass = { Easy: 'diff-easy', Medium: 'diff-medium', Hard: 'diff-hard', Insane: 'diff-insane' };

const fileIcons = {
  zip: Package, txt: FileText, pdf: FileText, png: FileImage, jpg: FileImage, py: FileCode,
  c: FileCode, binary: FileTerminal, pcap: Activity, apk: Smartphone, default: File,
};

export default function ChallengeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addPoints } = useApp();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const [instance, setInstance] = useState(null);
  const [instanceState, setInstanceState] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [instCopied, setInstCopied] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    (async () => {
      const inst = await challengeService.getInstance(id);
      setInstance(inst);
      setInstanceState(inst ? 'active' : 'idle');
      if (inst) setTimeLeft(Math.max(0, Math.floor((inst.expiresAt - Date.now()) / 1000)));
    })();
  }, [id]);

  useEffect(() => {
    if (!instance) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setInstance(null);
          setInstanceState('idle');
          setTimeLeft(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [instance]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const c = await challengeService.getChallengeById(id);
        setChallenge(c);
      } catch { navigate('/challenges'); }
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await challengeService.submitFlag(id, flag.trim());
      setResult(res);
      if (res.correct && !res.alreadySolved) {
        addPoints(res.points);
        setChallenge(prev => ({ ...prev, solved: true }));
        setShowComplete(true);
      }
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const copyUrl = () => {
    if (challenge?.connectionInfo?.url) {
      navigator.clipboard.writeText(challenge.connectionInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartInstance = async () => {
    setInstanceState('starting');
    try {
      const inst = await challengeService.startInstance(id);
      setInstance(inst);
      setTimeLeft(Math.max(0, Math.floor((inst.expiresAt - Date.now()) / 1000)));
      setInstanceState('active');
    } catch {
      setInstanceState('idle');
    }
  };

  const handleStopInstance = async () => {
    await challengeService.stopInstance(id);
    setInstance(null);
    setInstanceState('idle');
    setTimeLeft(0);
  };

  const copyInstance = () => {
    if (instance?.command) {
      navigator.clipboard.writeText(instance.command);
      setInstCopied(true);
      setTimeout(() => setInstCopied(false), 2000);
    }
  };

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return <LoadingSpinner fullPage text="Loading challenge..." />;
  if (!challenge) return null;

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'objectives', label: 'Objectives' },
    { id: 'cheatsheet', label: 'Cheatsheet' },
    { id: 'hints', label: `Hints (${challenge.hints?.length || 0})` },
    ...(challenge.files?.length ? [{ id: 'files', label: `Files (${challenge.files.length})` }] : []),
    ...(challenge.connectionInfo ? [{ id: 'connect', label: 'Connect' }] : []),
  ];

  return (
    <div className="page-container">
      {/* Back */}
      <button
        onClick={() => navigate('/challenges')}
        className="d-flex align-items-center gap-2 mb-4"
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}
      >
        <ArrowLeft size={16} /> Back to Challenges
      </button>

      <div className="row g-4">
        {/* Main */}
        <div className="col-lg-8">
          {/* Challenge header */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '28px', marginBottom: 20, animation: 'fadeInUp 0.4s ease' }}>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
              <span className="cat-chip">{challenge.category}</span>
              <span className={`diff-badge ${diffClass[challenge.difficulty]}`}>{challenge.difficulty}</span>
              {challenge.trial && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(139,92,246,0.15)', color: 'var(--diff-insane)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                  Trial
                </span>
              )}
              {challenge.solved && (
                <span className="solved-tag">
                  <CheckCircle size={12} /> Solved
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, marginBottom: 16 }}>
              {challenge.title}
            </h1>

            <div className="d-flex flex-wrap gap-4 mb-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(116,100,220,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flag size={16} color="var(--accent-green)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1 }}>{challenge.points}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>points</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(116,100,220,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="var(--accent-cyan)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1 }}>{challenge.solves.toLocaleString()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>solves</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="var(--accent-green)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{challenge.author}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>author</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="d-flex flex-wrap gap-2">
              {challenge.tags?.map(t => <span key={t} className="tag-chip"><Tag size={10} style={{ marginRight: 3 }} />{t}</span>)}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', animation: 'fadeInUp 0.4s ease 0.1s both' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  background: 'none', border: 'none',
                  padding: '14px 20px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
                  color: activeTab === t.id ? 'var(--accent-green)' : 'var(--text-muted)',
                  borderBottom: activeTab === t.id ? '2px solid var(--accent-green)' : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {activeTab === 'description' && (
                <div className="animate-fade-in">
                  <div className="section-title mb-3">Scenario</div>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderLeft: '3px solid var(--accent-cyan)',
                    borderRadius: '0 8px 8px 0',
                    padding: '16px 20px',
                    marginBottom: 20,
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                  }}>
                    {challenge.scenario}
                  </div>
                  <div className="section-title mb-3">Description</div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20 }}>{challenge.description}</p>
                  {challenge.instructions && (
                    <>
                      <div className="section-title mb-3">Instructions</div>
                      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {challenge.instructions}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'objectives' && (
                <div className="animate-fade-in">
                  <div className="section-title mb-3">Objectives</div>
                  <div className="d-flex flex-column gap-2">
                    {challenge.objectives?.map((obj, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700, minWidth: 24 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'cheatsheet' && (
                <CheatsheetTab cheatsheet={challenge.cheatsheet} />
              )}

              {activeTab === 'hints' && (
                <div className="animate-fade-in">
                  <div className="section-title mb-3">Hints</div>
                  {challenge.hints?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      No hints available for this challenge.
                    </div>
                  ) : (
                    challenge.hints.map((h, i) => (
                      <HintCard key={h.id} hint={h} challengeId={challenge.id} index={i} />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="animate-fade-in">
                  <div className="section-title mb-3">Challenge Files</div>
                  <div className="d-flex flex-column gap-2">
                    {challenge.files?.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'inline-flex' }}>{(() => { const Icon = fileIcons[f.type] || fileIcons.default; return <Icon size={22} color="var(--text-muted)" />; })()}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.size}</div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                          onClick={() => alert(`In a real platform, "${f.name}" would download from the server.`)}
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'connect' && challenge.connectionInfo && (
                <div className="animate-fade-in">
                  <div className="section-title mb-3">Connection Info</div>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Globe size={16} color="var(--accent-cyan)" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        Challenge Instance
                      </span>
                      <span className="status-dot green" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--terminal-bg)', border: '1px solid rgba(116,100,220,0.2)', borderRadius: 8, padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-green)', flex: 1 }}>
                        {challenge.connectionInfo.url}
                        {challenge.connectionInfo.port && ` :${challenge.connectionInfo.port}`}
                      </span>
                      <button onClick={copyUrl} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Copy size={14} />
                      </button>
                    </div>
                    {copied && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-green)', marginTop: 8 }}>Copied!</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — flag submission */}
        <div className="col-lg-4">
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Challenge instance */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px', marginBottom: 16, animation: 'fadeInUp 0.4s ease 0.15s both' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="section-title">Challenge Instance</div>
                {instance && <span className="status-dot green" />}
              </div>

              {instanceState === 'starting' && (
                <div style={{ textAlign: 'center', padding: '22px 0', color: 'var(--text-secondary)' }}>
                  <Loader size={28} color="var(--accent-green)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-green)' }}>
                    Deploying instance...
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>This usually takes a few seconds</div>
                </div>
              )}

              {!instance && instanceState !== 'starting' && (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 16 }}>
                    This challenge runs on a live environment. Start your own private
                    instance and connect to it to capture the flag.
                  </p>
                  <button
                    onClick={handleStartInstance}
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ padding: '12px' }}
                  >
                    <Power size={15} /> Start Instance
                  </button>
                </>
              )}

              {instance && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Server size={15} color="var(--accent-green)" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.1em' }}>
                        RUNNING
                      </span>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-yellow)', fontWeight: 700 }}>
                      <Clock size={13} /> {fmtTime(timeLeft)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--terminal-bg)', border: '1px solid rgba(116,100,220,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-green)', flex: 1, wordBreak: 'break-all' }}>
                      {instance.command}
                    </span>
                    <button onClick={copyInstance} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
                      <Copy size={14} />
                    </button>
                  </div>
                  {instCopied && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-green)', marginBottom: 12 }}>Copied to clipboard!</div>}

                  <div className="d-flex gap-2">
                    {instance.command.startsWith('http') && (
                      <a
                        href={instance.command} target="_blank" rel="noreferrer"
                        className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 flex-fill"
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                    )}
                    <button
                      onClick={handleStopInstance}
                      className="btn btn-danger d-flex align-items-center justify-content-center gap-2 flex-fill"
                      style={{ padding: '10px' }}
                    >
                      <Square size={13} /> Stop
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Flag submission */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px', marginBottom: 16, animation: 'fadeInUp 0.4s ease 0.2s both' }}>
              <div className="section-title mb-3">Submit Flag</div>

              {challenge.solved ? (
                <div style={{ background: 'rgba(116,100,220,0.06)', border: '1px solid rgba(116,100,220,0.25)', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
                  <CheckCircle size={36} color="var(--accent-green)" style={{ marginBottom: 12 }} />
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-green)', marginBottom: 4 }}>Challenge Completed!</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>You already captured this flag.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      Enter Flag
                    </label>
                    <input
                        className="form-control flag-input"
                        placeholder="CTF{flag_here}"
                        value={flag}
                        onChange={e => setFlag(e.target.value)}
                        disabled={submitting}
                      />
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Format: CTF{`{flag_text}`}
                    </div>
                  </div>

                  {result && (
                    <div className={`flag-submit-result ${result.correct ? 'success' : 'error'} mb-3`}>
                      {result.correct ? (
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <CheckCircle size={16} />
                            <span style={{ fontWeight: 700 }}>Correct Flag!</span>
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>+{result.points} Points</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', opacity: 0.7, marginTop: 2 }}>Challenge Completed</div>
                        </div>
                      ) : (
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <XCircle size={16} />
                            <span style={{ fontWeight: 700 }}>Incorrect Flag</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Keep investigating.</div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit" className="btn btn-primary w-100" disabled={submitting || !flag.trim()}
                    style={{ padding: '12px' }}>
                    {submitting ? (
                      <span className="d-flex align-items-center justify-content-center gap-2">
                        <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                        Checking...
                      </span>
                    ) : (
                      <span className="d-flex align-items-center justify-content-center gap-2">
                        <Flag size={16} /> Submit Flag
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Challenge info summary */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px', animation: 'fadeInUp 0.4s ease 0.3s both' }}>
              <div className="section-title mb-3" style={{ fontSize: '0.65rem' }}>Challenge Info</div>
              {[
                { label: 'Category', value: challenge.category },
                { label: 'Difficulty', value: challenge.difficulty },
                { label: 'Points', value: `${challenge.points} pts` },
                { label: 'Solves', value: challenge.solves.toLocaleString() },
                { label: 'Author', value: challenge.author },
                { label: 'Added', value: challenge.createdAt },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showComplete && result && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(4, 12, 12, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', animation: 'fadeIn 0.25s ease',
        }} onClick={() => setShowComplete(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(116,100,220,0.35)',
              borderRadius: 18,
              padding: '36px 40px',
              maxWidth: 420,
              width: '100%',
              textAlign: 'center',
              boxShadow: 'var(--glow-green), var(--shadow-lg)',
              animation: 'fadeInUp 0.35s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: 84, height: 84, margin: '0 auto 18px',
              borderRadius: '50%',
              background: 'rgba(116,100,220,0.12)',
              border: '2px solid var(--accent-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--glow-green)',
            }}>
              <CheckCircle size={44} color="var(--accent-green)" style={{ animation: 'pop-in 0.4s ease' }} />
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-green)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
              Flag Accepted
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Challenge Completed!</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              You captured <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{challenge.title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px', marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reward</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-green)' }}>+{result.points}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>points</span>
            </div>

            <div className="d-flex flex-column gap-2">
              <button
                className="btn btn-primary"
                style={{ padding: '12px' }}
                onClick={() => { setShowComplete(false); navigate('/challenges'); }}
              >
                Back to Challenges
              </button>
              <button
                className="btn btn-outline-secondary"
                style={{ padding: '12px' }}
                onClick={() => setShowComplete(false)}
              >
                Stay on Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
