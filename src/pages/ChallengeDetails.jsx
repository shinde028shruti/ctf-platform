import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Flag, Users, CheckCircle, XCircle, Download,
  ExternalLink, Copy, ChevronRight, Tag, Clock, User, Globe
} from 'lucide-react';
import HintCard from '../components/ui/HintCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { challengeService } from '../services/challengeService';
import { useApp } from '../context/AppContext';

const diffClass = { Easy: 'diff-easy', Medium: 'diff-medium', Hard: 'diff-hard', Insane: 'diff-insane' };

const fileIcons = {
  zip: '📦', txt: '📄', pdf: '📑', png: '🖼', jpg: '🖼', py: '🐍',
  c: '⚙', binary: '⚙', pcap: '📡', apk: '📱', default: '📄',
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

  if (loading) return <LoadingSpinner fullPage text="Loading challenge..." />;
  if (!challenge) return null;

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'objectives', label: 'Objectives' },
    { id: 'hints', label: `Hints (${challenge.hints?.length || 0})` },
    ...(challenge.files?.length ? [{ id: 'files', label: `Files (${challenge.files.length})` }] : []),
    ...(challenge.connectionInfo ? [{ id: 'connect', label: 'Connect' }] : []),
  ];

  return (
    <div className="page-container">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
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
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(14,201,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flag size={16} color="var(--accent-green)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1 }}>{challenge.points}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>points</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(14,201,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="var(--accent-cyan)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1 }}>{challenge.solves.toLocaleString()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>solves</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="var(--accent-purple)" />
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
                        <span style={{ fontSize: '1.4rem' }}>{fileIcons[f.type] || fileIcons.default}</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#041212', border: '1px solid rgba(14,201,181,0.2)', borderRadius: 8, padding: '12px 16px' }}>
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
            {/* Flag submission */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px', marginBottom: 16, animation: 'fadeInUp 0.4s ease 0.2s both' }}>
              <div className="section-title mb-3">Submit Flag</div>

              {challenge.solved ? (
                <div style={{ background: 'rgba(14,201,181,0.06)', border: '1px solid rgba(14,201,181,0.25)', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
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
                    <div className="flag-input-wrapper">
                      <span className="flag-prefix">CTF{`{`}</span>
                      <input
                        className="form-control flag-input"
                        placeholder="flag_here"
                        value={flag.replace(/^CTF\{/, '').replace(/\}$/, '')}
                        onChange={e => setFlag(`CTF{${e.target.value}}`)}
                        disabled={submitting}
                      />
                    </div>
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
    </div>
  );
}
