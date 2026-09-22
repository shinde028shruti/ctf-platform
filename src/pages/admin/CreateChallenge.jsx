import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Upload, CheckCircle, Globe, Server, File, Clock } from 'lucide-react';
import { challengeService } from '../../services/challengeService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CATEGORIES = ['Web Exploitation','Cryptography','Reverse Engineering','Digital Forensics','OSINT','Networking','Binary Exploitation','Mobile Security','Steganography','Miscellaneous'];
const DIFFICULTIES = ['Easy','Medium','Hard','Insane'];
const POINT_PRESETS = [50,75,100,125,150,200,250,300,350,400,450,500,750];

const EMPTY = {
  title: '', category: 'Web Exploitation', difficulty: 'Easy', points: 100,
  description: '', scenario: '', objectives: [''], instructions: '',
  author: '', tags: '',
  flag: '', flag_note: '',
  hints: [{ text: '', cost: 20 }],
  files: [],
  status: 'draft',
  publishAt: '',
  connectionInfo: null,
  instanceEnabled: false,
  targetType: 'Web Application',
  targetUrl: '', targetPort: '',
};

function Field({ label, required, children, hint }) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}{required && <span style={{ color: 'var(--accent-red)', marginLeft: 4 }}>*</span>}</label>
      {children}
      {hint && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function CreateChallenge() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [mockFiles, setMockFiles] = useState([]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const c = await challengeService.getChallengeById(id);
        setForm({
          ...EMPTY, ...c,
          tags: c.tags?.join(', ') || '',
          objectives: c.objectives?.length ? c.objectives : [''],
          hints: c.hints?.length ? c.hints.map(h => ({ text: h.text, cost: h.cost })) : [{ text: '', cost: 20 }],
          instanceEnabled: !!c.connectionInfo,
          targetUrl: c.connectionInfo?.url || '',
          targetPort: c.connectionInfo?.port || '',
          targetType: 'Web Application',
        });
      } catch { navigate('/admin/challenges'); }
      setLoading(false);
    })();
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setObj = (i, v) => setForm(f => { const a = [...f.objectives]; a[i] = v; return { ...f, objectives: a }; });
  const addObj = () => setForm(f => ({ ...f, objectives: [...f.objectives, ''] }));
  const delObj = (i) => setForm(f => ({ ...f, objectives: f.objectives.filter((_, j) => j !== i) }));

  const setHint = (i, k, v) => setForm(f => { const h = [...f.hints]; h[i] = { ...h[i], [k]: v }; return { ...f, hints: h }; });
  const addHint = () => setForm(f => ({ ...f, hints: [...f.hints, { text: '', cost: 20 }] }));
  const delHint = (i) => setForm(f => ({ ...f, hints: f.hints.filter((_, j) => j !== i) }));

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    setMockFiles(prev => [...prev, ...files.map(f => ({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB`, type: f.name.split('.').pop() }))]);
  };

  const buildPayload = () => ({
    ...form,
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    objectives: form.objectives.filter(Boolean),
    hints: form.hints.filter(h => h.text).map((h, i) => ({ id: i + 1, ...h })),
    connectionInfo: form.instanceEnabled && form.targetUrl ? { url: form.targetUrl, port: form.targetPort ? Number(form.targetPort) : undefined } : null,
    files: mockFiles,
  });

  const save = async (status) => {
    setError('');
    if (!form.title.trim()) { setError('Challenge title is required.'); setActiveTab('basic'); return; }
    if (!form.flag.trim()) { setError('Flag is required.'); setActiveTab('flag'); return; }
    if (!form.flag.startsWith('CTF{')) { setError('Flag must start with CTF{'); setActiveTab('flag'); return; }
    setSaving(true);
    try {
      const payload = { ...buildPayload(), status };
      if (isEdit) {
        await challengeService.updateChallenge(id, payload);
      } else {
        await challengeService.createChallenge(payload);
      }
      setSaved(true);
      setTimeout(() => navigate('/admin/challenges'), 1200);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const tabs = [
    { id: 'basic',    label: 'Basic Info' },
    { id: 'content',  label: 'Content' },
    { id: 'flag',     label: 'Flag & Hints' },
    { id: 'files',    label: 'Files' },
    { id: 'deploy',   label: 'Deployment' },
  ];

  if (loading) return <LoadingSpinner fullPage text="Loading challenge..." />;

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-1">Admin</div>
          <h1 style={{ margin: 0 }}>{isEdit ? 'Edit Challenge' : 'Create Challenge'}</h1>
        </div>
        {saved && (
          <div className="d-flex align-items-center gap-2" style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            <CheckCircle size={16} /> Saved — redirecting...
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--accent-red)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', animation: 'fadeInUp 0.2s ease' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: 'none', border: 'none',
              padding: '14px 20px',
              fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
              color: activeTab === t.id ? 'var(--accent-green)' : 'var(--text-muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--accent-green)' : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '28px' }}>
          {/* ── BASIC INFO ── */}
          {activeTab === 'basic' && (
            <div className="animate-fade-in">
              <div className="row g-3">
                <div className="col-12">
                  <Field label="Challenge Name" required>
                    <input className="form-control" placeholder="e.g. SQL Injection 101" value={form.title} onChange={e => set('title', e.target.value)} />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Category" required>
                    <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Difficulty" required>
                    <select className="form-select" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                      {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Points" required>
                    <select className="form-select" value={form.points} onChange={e => set('points', Number(e.target.value))}>
                      {POINT_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Author" required>
                    <input className="form-control" placeholder="Your handle" value={form.author} onChange={e => set('author', e.target.value)} />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Tags" hint="Comma-separated. e.g. sql, injection, web">
                    <input className="form-control" placeholder="web, sql, authentication" value={form.tags} onChange={e => set('tags', e.target.value)} />
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Short Description" required hint="Shown on the challenge card (max 200 chars).">
                    <textarea className="form-control" rows={3} placeholder="A concise description of what this challenge is about." value={form.description} onChange={e => set('description', e.target.value)} maxLength={300} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{form.description.length}/300</div>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENT ── */}
          {activeTab === 'content' && (
            <div className="animate-fade-in">
              <Field label="Scenario" hint="Set the story/context for the challenge.">
                <textarea className="form-control" rows={4} placeholder="Describe the fictional scenario..." value={form.scenario} onChange={e => set('scenario', e.target.value)} />
              </Field>
              <Field label="Instructions" hint="What the player needs to do.">
                <textarea className="form-control" rows={4} placeholder="Detailed instructions for the player." value={form.instructions} onChange={e => set('instructions', e.target.value)} />
              </Field>

              <div className="section-title mb-3">Objectives</div>
              <div className="d-flex flex-column gap-2 mb-3">
                {form.objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-green)', minWidth: 24, paddingTop: 10 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <input className="form-control" placeholder={`Objective ${i + 1}`} value={obj} onChange={e => setObj(i, e.target.value)} />
                    {form.objectives.length > 1 && (
                      <button type="button" onClick={() => delObj(i)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--accent-red)', cursor: 'pointer', padding: '0 10px', flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={addObj}>
                <Plus size={13} /> Add Objective
              </button>
            </div>
          )}

          {/* ── FLAG & HINTS ── */}
          {activeTab === 'flag' && (
            <div className="animate-fade-in">
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
                <Field label="Flag" required hint="Must follow the format CTF{...}">
                  <div style={{ display: 'flex' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>
                      CTF{'{'}
                    </span>
                    <input
                      className="form-control"
                      style={{ borderRadius: '0 8px 8px 0', fontFamily: 'var(--font-mono)' }}
                      placeholder="flag_value_here"
                      value={form.flag.replace(/^CTF\{/, '').replace(/\}$/, '')}
                      onChange={e => set('flag', `CTF{${e.target.value}}`)}
                    />
                  </div>
                </Field>
                <Field label="Flag Notes" hint="Internal notes (not shown to players).">
                  <input className="form-control" placeholder="e.g. Flag is in /root/flag.txt after escalation" value={form.flag_note} onChange={e => set('flag_note', e.target.value)} />
                </Field>
              </div>

              <div className="section-title mb-3">Hints</div>
              <div className="d-flex flex-column gap-3 mb-3">
                {form.hints.map((h, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-yellow)', fontWeight: 700 }}>Hint #{i + 1}</span>
                      {form.hints.length > 1 && (
                        <button type="button" onClick={() => delHint(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="row g-2">
                      <div className="col-md-9">
                        <input className="form-control" placeholder="Hint text visible to players" value={h.text} onChange={e => setHint(i, 'text', e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: 38 }}>-pts</span>
                          <input className="form-control" type="number" min={0} max={200} style={{ borderRadius: '0 8px 8px 0' }} value={h.cost} onChange={e => setHint(i, 'cost', Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={addHint}>
                <Plus size={13} /> Add Hint
              </button>
            </div>
          )}

          {/* ── FILES ── */}
          {activeTab === 'files' && (
            <div className="animate-fade-in">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                style={{
                  border: '2px dashed var(--border-bright)',
                  borderRadius: 12, padding: '40px',
                  textAlign: 'center', marginBottom: 20,
                  transition: 'all 0.2s',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('file-input').click()}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-green)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
              >
                <input id="file-input" type="file" multiple onChange={handleFileDrop} style={{ display: 'none' }} />
                <Upload size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop files here or click to upload</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Supported: ZIP, TXT, PDF, PNG, JPG, PCAP, PY, C, EXE, APK
                </div>
              </div>

              {mockFiles.length > 0 && (
                <div className="d-flex flex-column gap-2">
                  {mockFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <File size={18} color="var(--text-muted)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>{f.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.size}</div>
                      </div>
                      <button type="button" onClick={() => setMockFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DEPLOYMENT ── */}
          {activeTab === 'deploy' && (
            <div className="animate-fade-in">
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '24px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h5 style={{ fontWeight: 700, marginBottom: 4 }}>Challenge Instance</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Enable a live challenge instance with connection details.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.instanceEnabled} onChange={e => set('instanceEnabled', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', inset: 0, borderRadius: 26, background: form.instanceEnabled ? 'var(--accent-green)' : 'var(--bg-elevated)', border: `1px solid ${form.instanceEnabled ? 'var(--accent-green)' : 'var(--border-bright)'}`, transition: 'all 0.25s' }}>
                      <span style={{ position: 'absolute', top: 3, left: form.instanceEnabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: form.instanceEnabled ? '#0A0917' : 'var(--text-muted)', transition: 'left 0.25s' }} />
                    </span>
                  </label>
                </div>

                {form.instanceEnabled && (
                  <div className="row g-3 animate-fade-in">
                    <div className="col-md-4">
                      <Field label="Target Type">
                        <select className="form-select" value={form.targetType} onChange={e => set('targetType', e.target.value)}>
                          {['Web Application', 'Netcat / TCP', 'SSH', 'Docker Container', 'VPN Instance'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-5">
                      <Field label="Target URL / Host">
                        <input className="form-control" placeholder="http://challenge.local or nc server.local" value={form.targetUrl} onChange={e => set('targetUrl', e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                      </Field>
                    </div>
                    <div className="col-md-3">
                      <Field label="Port">
                        <input className="form-control" type="number" placeholder="8080" value={form.targetPort} onChange={e => set('targetPort', e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                      </Field>
                    </div>
                    <div className="col-12">
                      <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(116,100,220,0.2)', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <Server size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                          <strong style={{ color: 'var(--accent-cyan)' }}>Note:</strong> Instance management (Docker deployment, health checks, auto-restart) will be handled by the backend infrastructure. This form captures the connection details shown to players.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Scheduled Publishing ── */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '24px' }}>
                <div className="row g-3">
                  <div className="col-12">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Clock size={15} color="var(--accent-orange)" />
                      <h5 style={{ fontWeight: 700, margin: 0 }}>Schedule Publish</h5>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 14px' }}>
                      Auto-publish this challenge at a set date & time. Clearing the field returns the challenge to draft.
                    </p>
                  </div>
                  <div className="col-md-5">
                    <Field label="Publish At">
                      <input
                        className="form-control"
                        type="datetime-local"
                        value={form.publishAt}
                        onChange={e => set('publishAt', e.target.value)}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </Field>
                  </div>
                  <div className="col-md-7 d-flex align-items-end">
                    {form.publishAt ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                        color: 'var(--accent-orange)', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.28)',
                        borderRadius: 8, padding: '10px 14px', width: '100%', margin: '0 0 3px',
                      }}>
                        <Clock size={14} /> Scheduled for {new Date(form.publishAt).toLocaleString()}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 3px', padding: '10px 0' }}>
                        No schedule set — use <strong>Schedule</strong> below to arm auto-publish.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        position: 'sticky', bottom: 0, background: 'rgba(10,9,23,0.96)',
        backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border-color)',
        padding: '16px 0', marginTop: 24, zIndex: 50,
      }}>
        <div className="d-flex gap-3 flex-wrap">
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => save('draft')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => save('scheduled')}
            disabled={saving || !form.publishAt}
            title={form.publishAt ? `Auto-publish at ${form.publishAt.replace('T', ' ')}` : 'Set a publish date first'}
          >
            <Clock size={15} /> {isEdit ? 'Update Schedule' : 'Save & Schedule'}
          </button>
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => { const payload = buildPayload(); console.log('Preview payload:', payload); alert(`Preview: ${form.title || 'Untitled'}\nCategory: ${form.category}\nPoints: ${form.points}`); }}
            disabled={saving}
          >
            Preview
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => save('published')} disabled={saving}>
            {saving ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Publishing...</>
            ) : (
              <><CheckCircle size={16} /> {isEdit ? 'Update & Publish' : 'Publish Challenge'}</>
            )}
          </button>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => navigate('/admin/challenges')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
