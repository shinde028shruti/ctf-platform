import React from 'react';
import { Lock } from 'lucide-react';

export default function AchievementBadge({ icon: Icon, gradient, glow, locked = false, size = 72 }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div
        style={{
          width: size,
          height: size,
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(50% 0%, 92% 26%, 92% 74%, 50% 100%, 8% 74%, 8% 26%)',
          background: locked
            ? 'linear-gradient(160deg, #1a2130 0%, #12182698 60%, #0c1118 100%)'
            : `linear-gradient(160deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
          boxShadow: locked ? 'none' : `0 0 ${size / 2}px ${glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: size * 0.62,
            height: size * 0.62,
            clipPath: 'polygon(50% 0%, 92% 26%, 92% 74%, 50% 100%, 8% 74%, 8% 26%)',
            background: locked
              ? 'rgba(20, 26, 38, 0.85)'
              : 'rgba(7, 14, 26, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 0,
          }}
        >
          <Icon
            size={size * 0.3}
            color={locked ? 'var(--text-muted)' : '#ffffff'}
            strokeWidth={2.2}
          />
        </div>
      </div>

      {locked && (
        <div
          style={{
            position: 'absolute',
            right: -2,
            bottom: 2,
            width: size * 0.3,
            height: size * 0.3,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Lock size={size * 0.17} color="var(--text-muted)" />
        </div>
      )}
    </div>
  );
}