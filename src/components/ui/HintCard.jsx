import React, { useState } from 'react';
import { Lock, Unlock, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { challengeService } from '../../services/challengeService';
import { useApp } from '../../context/AppContext';

export default function HintCard({ hint, challengeId, index }) {
  const { addPoints } = useApp();
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);

  const handleReveal = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const { hint: h, pointCost } = await challengeService.revealHint(challengeId, hint.id);
      setContent(h.text);
      setRevealed(true);
      setOpen(true);
      addPoints(-pointCost);
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <div className="hint-card">
      <div className="hint-header" onClick={() => revealed && setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {revealed
            ? <Lightbulb size={16} color="var(--accent-yellow)" />
            : <Lock size={16} color="var(--text-muted)" />
          }
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: revealed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            Hint #{index + 1}
          </span>
          {!revealed && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              — {hint.cost} points penalty
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!revealed ? (
            <button
              className="btn btn-sm"
              style={{
                background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
                color: 'var(--accent-yellow)', fontSize: '0.75rem', padding: '3px 12px',
                borderRadius: 6,
              }}
              onClick={handleReveal}
              disabled={loading}
            >
              {loading ? 'Revealing...' : `Reveal (-${hint.cost} pts)`}
            </button>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>
      </div>

      {revealed && open && (
        <div className="hint-content">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Unlock size={14} color="var(--accent-yellow)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{content}</span>
          </div>
        </div>
      )}
    </div>
  );
}
