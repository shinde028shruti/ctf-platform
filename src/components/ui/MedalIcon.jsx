import React from 'react';

const tiers = {
  1: { ribbon: '#c96f0d', ribbonDark: '#8f4d08', ring: '#e8b64c', face: '#ffd700', core: '#f7c948', text: '#7c5a00' },
  2: { ribbon: '#5b6770', ribbonDark: '#3f4950', ring: '#9aa5b1', face: '#c0c0c0', core: '#d4dade', text: '#4b5257' },
  3: { ribbon: '#9a5b2b', ribbonDark: '#6f421f', ring: '#c98f5e', face: '#cd7f32', core: '#d89556', text: '#7a4a1d' },
};

export default function MedalIcon({ tier = 1, size = 24 }) {
  const c = tiers[tier] || tiers[3];

  return (
    <svg width={size} height={size} viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 1 L20 13 L30 1" stroke={c.ribbon} strokeWidth="5" strokeLinejoin="round" fill="none" />
      <path d="M6.5 6 L20 22 L33.5 6" stroke={c.ribbonDark} strokeWidth="7" strokeLinejoin="round" fill="none" />
      <circle cx="20" cy="29" r="15" fill={c.face} stroke={c.ribbonDark} strokeWidth="2" />
      <circle cx="20" cy="29" r="11" fill={c.core} stroke={c.ribbon} strokeWidth="1.5" />
      <circle cx="20" cy="29" r="8" fill={c.face} />
      <text x="20" y="34" textAnchor="middle" fontSize="11" fontWeight="900" fill={c.text} fontFamily="'JetBrains Mono', monospace">
        {tier}
      </text>
      <circle cx="20" cy="29" r="14.25" stroke={c.face} strokeWidth="1.5" fill="none" opacity="0.8" />
    </svg>
  );
}