import React from 'react';
import {
  Globe, KeyRound, Cpu, ScanSearch, Eye, Network,
  Bug, Smartphone, Image as ImageIcon, Puzzle,
} from 'lucide-react';

/**
 * CategoryGlyph
 * One icon per challenge category, so a category reads as itself at a glance
 * instead of ten copies of the same shield. Keys are the exact `name` values in
 * data/challenges.js — that is what challenges, user categoryStats and the admin
 * tables all join on, so the map is keyed by name rather than by id.
 */
const GLYPHS = {
  'Web Exploitation': Globe,
  'Cryptography': KeyRound,
  'Reverse Engineering': Cpu,
  'Digital Forensics': ScanSearch,
  'OSINT': Eye,
  'Networking': Network,
  'Binary Exploitation': Bug,
  'Mobile Security': Smartphone,
  'Steganography': ImageIcon,
  'Miscellaneous': Puzzle,
};

/** Resolve a category name to its icon component. Unknown names fall back to the
 *  Miscellaneous glyph rather than rendering nothing. */
export function categoryGlyph(name) {
  return GLYPHS[name] || Puzzle;
}

export default function CategoryGlyph({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  style,
  className,
}) {
  const Glyph = categoryGlyph(name);
  return (
    <Glyph
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  );
}