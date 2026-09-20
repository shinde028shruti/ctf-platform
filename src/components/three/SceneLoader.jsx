import React from 'react';

export default function SceneLoader({ height = '100%', label = '' }) {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: 'absolute', inset: 0, height, pointerEvents: 'none' }}
    >
      <div style={{ position: 'relative', width: 360, height: 360 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(116,100,220,0.22) 0%, rgba(79,31,113,0.12) 45%, transparent 70%)',
            animation: 'glowPulse 5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '18%',
            borderRadius: '50%',
            border: '1px solid rgba(119,100,224,0.4)',
            boxShadow: '0 0 40px rgba(116,100,220,0.3), inset 0 0 30px rgba(116,100,220,0.18)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '34%',
            borderRadius: '50%',
            border: '1px dashed rgba(119,100,224,0.5)',
            animation: 'spin 14s linear infinite',
          }}
        />
      </div>
      {label && (
        <div
          className="mono"
          style={{
            position: 'absolute',
            bottom: -6,
            color: 'var(--text-muted)',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}