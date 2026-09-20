import React, { useState } from 'react';
import { Copy, CheckCircle, Terminal, Tag } from 'lucide-react';

export default function CheatsheetTab({ cheatsheet }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [filterCat, setFilterCat] = useState('All');

  if (!cheatsheet || cheatsheet.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        No cheatsheet available for this challenge.
      </div>
    );
  }

  const categories = ['All', ...new Set(cheatsheet.map(c => c.category))];
  const filtered = filterCat === 'All' ? cheatsheet : cheatsheet.filter(c => c.category === filterCat);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div className="section-title">Cheatsheet</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '5px 12px', borderRadius: 16,
                border: filterCat === cat ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
                background: filterCat === cat ? 'rgba(116,100,220,0.1)' : 'transparent',
                color: filterCat === cat ? 'var(--accent-green)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s ease',
                letterSpacing: '0.05em',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((entry, idx) => (
          <div key={idx} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            overflow: 'hidden',
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <Terminal size={14} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                <code style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                  color: 'var(--accent-green)', fontWeight: 600,
                  wordBreak: 'break-all', lineHeight: 1.5,
                }}>
                  {entry.command}
                </code>
              </div>
              <button
                onClick={() => handleCopy(entry.command, idx)}
                style={{
                  background: 'none', border: 'none',
                  color: copiedIdx === idx ? 'var(--accent-green)' : 'var(--text-muted)',
                  cursor: 'pointer', padding: 4, flexShrink: 0,
                  transition: 'color 0.15s ease',
                }}
                title="Copy to clipboard"
              >
                {copiedIdx === idx ? <CheckCircle size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                color: 'var(--accent-cyan)', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                flexShrink: 0,
              }}>
                <Tag size={9} /> {entry.category}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {entry.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
