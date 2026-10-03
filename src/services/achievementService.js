/**
 * achievementService.js
 * Achievements authored from the admin panel. Uses the same localStorage mock
 * backend as the other services (TODO: swap for real API calls).
 *
 * A built-in achievement (data/achievements.js) unlocks through a `check(user,
 * solvedIds)` function. A function cannot be written to storage, typed into a
 * form or edited later, so a custom achievement stores a serialized rule instead
 * — `criteria = { metric, threshold, category?, difficulty? }` — and evaluate()
 * interprets it against a user at render time. Rule data survives a reload and
 * can be changed by an admin without touching code.
 */

import {
  Zap, KeyRound, Globe, Terminal, FileSearch, ShieldCheck, Search, Bug,
  Image as ImageIcon, Smartphone, Puzzle, Flame, Trophy, Target, Medal, Award,
  Star, Swords, Ghost, Lock, Radar, Rocket, Crown, Gem, Code, Network, Hexagon,
} from 'lucide-react';
import { challenges } from '../data/challenges';

const KEY = 'cyberforge_achievements';
const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

const read = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return fallback;
};

const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));

/* ── Icon options for the admin picker ───────────────────────────
   Stored by name so the record stays JSON-safe; ICONS resolves it back to a
   component. Anything unrecognised falls back to Trophy rather than crashing a
   whole grid over one bad record. */
export const ICONS = {
  Zap, KeyRound, Globe, Terminal, FileSearch, ShieldCheck, Search, Bug,
  Image: ImageIcon, Smartphone, Puzzle, Flame, Trophy, Target, Medal, Award,
  Star, Swords, Ghost, Lock, Radar, Rocket, Crown, Gem, Code, Network, Hexagon,
};

export const ICON_CHOICES = Object.keys(ICONS);

export function resolveIcon(name) {
  return ICONS[name] || Trophy;
}

/* ── Criteria vocabulary ────────────────────────────────────────
   `needs` drives which extra field the admin form shows, so the form can never
   collect a category for a metric that ignores it. */
export const CRITERIA_METRICS = [
  { value: 'solved_total',      label: 'Challenges solved',     unit: 'challenges' },
  { value: 'points',            label: 'Total points earned',   unit: 'points' },
  { value: 'streak',            label: 'Current streak',        unit: 'days' },
  { value: 'category_solved',   label: 'Solved in a category',  unit: 'challenges', needs: 'category' },
  { value: 'difficulty_solved', label: 'Solved at a difficulty', unit: 'challenges', needs: 'difficulty' },
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Insane'];

export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

/** Curated two-stop gradients offered as one-click presets in the admin form.
 *  Admin-authored colours are free-form, so these are only a starting point. */
export const GRADIENT_PRESETS = [
  ['#4F1F71', '#7764E0'],
  ['#22d3ee', '#a855f7'],
  ['#f6d365', '#fda085'],
  ['#4ade80', '#16a34a'],
  ['#38bdf8', '#22d3ee'],
  ['#fbbf24', '#f97316'],
  ['#34d399', '#06b6d4'],
  ['#a3e635', '#65a30d'],
  ['#fb7185', '#eab308'],
  ['#f87171', '#dc2626'],
  ['#f472b6', '#c084fc'],
  ['#61dafb', '#a78bfa'],
];

export const metricMeta = (value) =>
  CRITERIA_METRICS.find(m => m.value === value) || CRITERIA_METRICS[0];

/** Count solved challenges at one difficulty. `solvedIds` is the user's
 *  `solvedChallenges` array; anything not in the challenge list is ignored. */
function solvedAtDifficulty(user, solvedIds, difficulty) {
  const done = new Set((solvedIds || []).map(Number));
  return challenges.filter(c => c.difficulty === difficulty && done.has(Number(c.id))).length;
}

/**
 * Resolve a rule against a user.
 * Returns the numbers as well as the verdict so the UI can show "4 / 10" on a
 * locked achievement instead of a bare silhouette.
 */
export function evaluate(criteria, user) {
  const c = criteria || {};
  const threshold = Math.max(1, Number(c.threshold) || 1);
  if (!user) return { earned: false, gained: 0, target: threshold };

  const solvedIds = user.solvedChallenges || [];
  let gained = 0;

  switch (c.metric) {
    case 'points':
      gained = Number(user.points) || 0;
      break;
    case 'streak':
      gained = Number(user.streak) || 0;
      break;
    case 'category_solved':
      gained = Number(user.categoryStats?.[c.category]?.solved) || 0;
      break;
    case 'difficulty_solved':
      gained = solvedAtDifficulty(user, solvedIds, c.difficulty);
      break;
    case 'solved_total':
    default:
      gained = solvedIds.length;
      break;
  }

  return { earned: gained >= threshold, gained, target: threshold };
}

/** One-line human summary of a rule, for the admin table and the card footer. */
export function describeCriteria(criteria) {
  const c = criteria || {};
  const meta = metricMeta(c.metric);
  const threshold = Math.max(1, Number(c.threshold) || 1);
  const target = `${threshold.toLocaleString()} ${meta.unit}${threshold === 1 ? '' : 's'}`;
  if (c.metric === 'category_solved') return `${target} in ${c.category || 'any category'}`;
  if (c.metric === 'difficulty_solved') return `${target} at ${c.difficulty || 'any difficulty'}`;
  return target;
}

const sanitize = (data) => {
  const gradient = Array.isArray(data.gradient) && data.gradient.length === 2
    ? data.gradient
    : GRADIENT_PRESETS[0];
  return {
    name: String(data.name || 'Untitled Achievement').trim(),
    description: String(data.description || '').trim(),
    category: data.category || 'General',
    icon: ICONS[data.icon] ? data.icon : 'Trophy',
    gradient,
    rarity: RARITIES.includes(data.rarity) ? data.rarity : 'Common',
    reward: Math.max(0, Number(data.reward) || 0),
    active: data.active !== false,
    criteria: {
      metric: CRITERIA_METRICS.some(m => m.value === data.criteria?.metric)
        ? data.criteria.metric
        : 'solved_total',
      threshold: Math.max(1, Number(data.criteria?.threshold) || 1),
      category: data.criteria?.category || null,
      difficulty: DIFFICULTIES.includes(data.criteria?.difficulty) ? data.criteria.difficulty : null,
    },
  };
};

export const achievementService = {
  async getAchievements() {
    await delay();
    return read(KEY, []);
  },

  async getActiveAchievements() {
    await delay(150);
    return read(KEY, []).filter(a => a.active);
  },

  async createAchievement(data) {
    await delay();
    const items = read(KEY, []);
    const item = {
      id: `ach_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      ...sanitize(data),
    };
    write(KEY, [item, ...items]);
    return item;
  },

  async updateAchievement(id, data) {
    await delay();
    const items = read(KEY, []);
    const index = items.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Achievement not found.');
    items[index] = { ...items[index], ...sanitize({ ...items[index], ...data }) };
    write(KEY, items);
    return items[index];
  },

  async setActive(id, active) {
    return this.updateAchievement(id, { active });
  },

  async deleteAchievement(id) {
    await delay();
    write(KEY, read(KEY, []).filter(a => a.id !== id));
    return { success: true };
  },
};