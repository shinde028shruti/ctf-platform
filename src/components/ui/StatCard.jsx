import React, { useEffect, useState } from 'react';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export default function StatCard({ value, label, prefix = '', suffix = '', animate = true, trend }) {
  const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, '')) || 0;
  const displayNum = useCountUp(animate ? numericValue : 0);
  const displayValue = animate
    ? `${prefix}${displayNum.toLocaleString()}${suffix}`
    : `${prefix}${value}${suffix}`;

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        {trend !== undefined && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            color: trend >= 0 ? 'var(--diff-easy)' : 'var(--diff-hard)',
            background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            padding: '2px 8px', borderRadius: 20,
          }}>
            {trend >= 0 ? '+' : ''}{trend}
          </span>
        )}
      </div>
      <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{displayValue}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
