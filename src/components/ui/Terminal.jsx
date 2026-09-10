import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_LINES = [
  { type: 'cmd', text: './initialize_cyberforge.sh', delay: 0 },
  { type: 'out', text: 'Initializing CyberForge CTF Platform...', delay: 600 },
  { type: 'out', text: 'Loading challenge database...           [OK]', delay: 1100 },
  { type: 'out', text: 'Verifying cryptographic modules...     [OK]', delay: 1600 },
  { type: 'out', text: 'Starting challenge instances...        [OK]', delay: 2100 },
  { type: 'out', text: 'Connecting to scoreboard API...        [OK]', delay: 2600 },
  { type: 'success', text: 'Access granted. Welcome, operator.', delay: 3200 },
  { type: 'cmd', text: 'echo $STATUS', delay: 3900 },
  { type: 'success', text: '> System operational. Ready to capture flags.', delay: 4400 },
];

export default function Terminal({ lines = DEFAULT_LINES, className = '' }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
        if (i === lines.length - 1) setDone(true);
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }, line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`terminal-box ${className}`}>
      <div className="terminal-titlebar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          cyberforge — bash
        </span>
      </div>
      <div className="terminal-body" ref={bodyRef} style={{ minHeight: 180 }}>
        {visibleLines.map((line, i) => (
          <span key={i} className={`terminal-line ${line.type} animate-fade-in`} style={{ display: 'block' }}>
            {line.type === 'cmd' && <span style={{ color: 'var(--accent-cyan)' }}>$ </span>}
            {line.text}
          </span>
        ))}
        {!done && <span className="terminal-cursor" />}
      </div>
    </div>
  );
}
