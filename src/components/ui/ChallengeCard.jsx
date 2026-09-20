import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, Tag } from 'lucide-react';

export default function ChallengeCard({ challenge, index = 0 }) {
  const navigate = useNavigate();

  return (
    <div
      className={`challenge-card animate-fade-in-up delay-${Math.min(index * 100, 500)}`}
      onClick={() => navigate(`/challenges/${challenge.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/challenges/${challenge.id}`)}
    >
      {/* Header */}
      <div className="challenge-card-header">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-green)' }}>
              {challenge.category}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: challenge.difficulty === 'Easy' ? 'var(--diff-easy)' : `var(--diff-${challenge.difficulty.toLowerCase()})` }}>
              {challenge.difficulty}
            </span>
          </div>
          <div className="challenge-title">{challenge.title}</div>
        </div>
        <div className="text-end">
          <div className="challenge-points">{challenge.points}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>pts</div>
        </div>
      </div>

      {/* Description */}
      <p className="challenge-description">{challenge.description}</p>

      {/* Tags */}
      {challenge.tags?.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mt-2">
          {challenge.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
          {challenge.tags.length > 3 && (
            <span className="tag-chip">+{challenge.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer meta */}
      <div className="challenge-meta">
        <div className="d-flex align-items-center gap-3">
          <span className="challenge-solves d-flex align-items-center gap-1">
            <Users size={12} />
            {challenge.solves.toLocaleString()} solves
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            by {challenge.author}
          </span>
        </div>
        {challenge.solved ? (
          <span className="solved-tag">
            <CheckCircle size={11} />
            Solved
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Unsolved
          </span>
        )}
      </div>
    </div>
  );
}
