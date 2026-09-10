import React from 'react';

export default function LoadingSpinner({ size = 32, text = null, fullPage = false }) {
  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: size, height: size,
          border: `3px solid rgba(0,255,136,0.1)`,
          borderTopColor: 'var(--accent-green)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: 16,
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
