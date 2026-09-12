import React, { useState, useEffect } from 'react';

const BG_LINES = [
  '> Initializing secure channel...',
  '> Establishing encrypted connection...',
  '> Verifying identity...',
  '> Access terminal ready.',
];

export default function AnimatedAuthBg() {
  const [lines, setLines] = useState([]);
  useEffect(() => {
    BG_LINES.forEach((l, i) => {
      setTimeout(() => setLines(prev => [...prev, l]), i * 900);
    });
  }, []);
  return (
    <div style={{
      position: 'absolute', bottom: 40, left: 40,
      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
      color: 'rgba(14,201,181,0.2)', lineHeight: 2,
      pointerEvents: 'none',
    }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}