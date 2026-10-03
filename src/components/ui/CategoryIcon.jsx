import React from 'react';

/**
 * CategoryIcon
 * Shield outline whose right flank is deliberately left open, with a small
 * clock nested in the gap — "your move, on the clock" for a timed capture.
 * Inherits the category colour from the surrounding themed tile.
 */
export default function CategoryIcon({ size = 18, color = 'currentColor', strokeWidth = 1.8, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 32"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* Shield — top, left flank and base. Stops short of closing the right side. */}
      <path d="M25 6.5 L14 2.5 L3 6.5 L3 16 C3 22.5 7.6 26.5 14 29.5 C17.6 27.9 20.4 25.8 22.2 23.2" />
      {/* Short stub off the top-right corner — the gap below it stays open. */}
      <path d="M25 6.5 L25 10" />
      {/* Clock seated in the open flank */}
      <circle cx="29.8" cy="16.5" r="5.2" />
      <path d="M29.8 13.4 L29.8 16.5 L32 18.1" />
    </svg>
  );
}