import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ChevronDown, ChevronUp, Lightbulb, XCircle } from 'lucide-react';
import { challengeService } from '../../services/challengeService';
import { useApp } from '../../context/AppContext';

export default function HintCard({ hint, challengeId, index, onUnlocked }) {
  const { user, isAuthenticated, updateUser } = useApp();
  // Seed from the server payload so previously-unlocked hints survive a reload;
  // the server only ever sends text for hints this user has unlocked.
  const [revealed, setRevealed] = useState(Boolean(hint.revealed));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(hint.revealed ? hint.text : null);
  const [error, setError] = useState('');

  // Keep in sync if the parent re-fetches the challenge.
  useEffect(() => {
    if (hint.revealed) {
      setRevealed(true);
      setContent(hint.text);
    }
  }, [hint.revealed, hint.text]);

  const handleReveal = async (e) => {
    e.stopPropagation();
    if (loading || revealed) return;
    setLoading(true);
    setError('');
    try {
      const res = await challengeService.revealHint(challengeId, hint.id);
      setContent(res.hint?.text ?? '');
      setRevealed(true);
      setOpen(true);
      // The server is the source of truth for the new balance; never derive it
      // client-side (a repeated unlock returns the unchanged remainder).
      if (typeof res.remainingPoints === 'number') {
        updateUser({ points: res.remainingPoints });
      }
      onUnlocked?.(hint.id, res);
    } catch (err) {
      setError(err?.message || 'Could not unlock this hint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hint-card">
      <div className="hint-header" onClick={() => revealed && setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {revealed
            ? <Lightbulb size={16} color="var(--accent-green)" />
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
            isAuthenticated ? (
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Log in to unlock
              </span>
            )
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderTop: '1px solid var(--border-color)',
            color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
          }}
        >
          <XCircle size={13} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {revealed && open && (
        <div className="hint-content">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Unlock size={14} color="var(--accent-yellow)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{content}</span>
          </div>
          {typeof user?.points === 'number' && (
            <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Remaining points: {user.points}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
