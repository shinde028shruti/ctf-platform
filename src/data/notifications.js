// Static achievement-badge definitions only.
//
// There is deliberately no mock notification list here any more: notifications
// are fetched live from /api/v1/notifications/ by services/notificationService.
// `badges` is unrelated display data still consumed by the Profile page.

export const badges = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'First person to solve a challenge',
    icon: 'Trophy',
    color: '#ef4444',
    rarity: 'Legendary',
  },
  {
    id: 'week_streak',
    name: '7 Day Streak',
    description: 'Login and solve a challenge 7 days in a row',
    icon: 'Flame',
    color: '#f97316',
    rarity: 'Rare',
  },
  {
    id: 'web_hunter',
    name: 'Web Hunter',
    description: 'Solve 5 web exploitation challenges',
    icon: 'Code',
    color: '#3b82f6',
    rarity: 'Common',
  },
  {
    id: 'crypto_solver',
    name: 'Crypto Solver',
    description: 'Solve 3 cryptography challenges',
    icon: 'Lock',
    color: '#8b5cf6',
    rarity: 'Common',
  },
  {
    id: 'osint_investigator',
    name: 'OSINT Investigator',
    description: 'Solve 2 OSINT challenges',
    icon: 'Search',
    color: '#06b6d4',
    rarity: 'Common',
  },
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Solve a challenge within 5 minutes of it being released',
    icon: 'Zap',
    color: '#eab308',
    rarity: 'Rare',
  },
  {
    id: 'binary_breaker',
    name: 'Binary Breaker',
    description: 'Solve a binary exploitation challenge',
    icon: 'Binary',
    color: '#ef4444',
    rarity: 'Uncommon',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Earn 1000 points total',
    icon: 'Target',
    color: '#10b981',
    rarity: 'Uncommon',
  },
  {
    id: 'veteran',
    name: 'CTF Veteran',
    description: 'Participate in 5 CTF events',
    icon: 'Medal',
    color: '#6366f1',
    rarity: 'Rare',
  },
  {
    id: 'phantom',
    name: 'Ghost Protocol',
    description: 'Solve a challenge with no hints and no wrong submissions',
    icon: 'Ghost',
    color: '#94a3b8',
    rarity: 'Epic',
  },
];
