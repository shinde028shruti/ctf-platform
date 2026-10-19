/**
 * achievementService.js
 *
 * The achievement board and its administration, backed by the Django REST API.
 * There is deliberately NO mock / localStorage fallback: if a request fails the
 * caller shows an error rather than inventing an award. Award state is owned by
 * the server and is never written from the browser.
 *
 * Two read surfaces:
 *   - `getActiveAchievements()` -> GET /achievements/  (the caller's own board:
 *     active definitions plus anything they have already earned, each with a
 *     server-computed `earned` flag and `progress`).
 *   - `getAchievements()`       -> GET /admin/achievements/  (every definition,
 *     drafts included, for the admin table).
 *
 * The backend speaks snake_case and the four supported criteria types
 * (`first_solve`, `total_solves`, `category_solves`, `challenge_solved`); the
 * existing UI speaks camelCase. The `to*` mappers below are the only place that
 * translation happens, so the pages stay presentation-only.
 */

import {
  Zap, KeyRound, Globe, Terminal, FileSearch, ShieldCheck, Search, Bug,
  Image as ImageIcon, Smartphone, Puzzle, Flame, Trophy, Target, Medal, Award,
  Star, Swords, Ghost, Lock, Radar, Rocket, Crown, Gem, Code, Network, Hexagon,
} from 'lucide-react';

import { api } from './api';

/* ------------------------------------------------------------------ */
/* Icon options for the admin picker                                   */
/* ------------------------------------------------------------------ */

/* Stored by name so the record stays JSON-safe; ICONS resolves it back to a
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

/* ------------------------------------------------------------------ */
/* Presentation vocabulary                                             */
/* ------------------------------------------------------------------ */

export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

/** Curated two-stop gradients offered as one-click presets in the admin form. */
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

/* ------------------------------------------------------------------ */
/* Criteria vocabulary — exactly the four server-supported types       */
/* ------------------------------------------------------------------ */

/* `needs` drives which extra field the admin form shows, so the form can never
   collect data a rule ignores. The values match `achievements.criteria` on the
   backend and nothing else is offered. */
export const CRITERIA_TYPES = [
  { value: 'first_solve',      label: 'Solve the first challenge',      needs: null },
  { value: 'total_solves',     label: 'Solve a number of challenges',   needs: 'target' },
  { value: 'category_solves',  label: 'Solve challenges in a category', needs: 'category' },
  { value: 'challenge_solved', label: 'Solve a specific challenge',     needs: 'challenge' },
];

export const criteriaMeta = (value) =>
  CRITERIA_TYPES.find((c) => c.value === value) || CRITERIA_TYPES[0];

/**
 * Client-side summary of a rule for the admin form's live preview. The server
 * also returns a `criteria_label`; this exists so the text updates while the
 * admin is still typing, before anything is saved.
 *
 * `lookups` supplies `{ categoryNames, challengeTitles }` (id -> name) loaded
 * from the real category/challenge APIs.
 */
export function describeRule(criteriaType, config = {}, lookups = {}) {
  const categoryNames = lookups.categoryNames || {};
  const challengeTitles = lookups.challengeTitles || {};
  const target = Math.max(1, Number(config.target) || 1);

  switch (criteriaType) {
    case 'total_solves':
      return `Solve ${target} challenge${target === 1 ? '' : 's'}`;
    case 'category_solves':
      return `Solve ${target} in ${categoryNames[config.category] || 'a category'}`;
    case 'challenge_solved':
      return challengeTitles[config.challenge]
        ? `Solve "${challengeTitles[config.challenge]}"`
        : 'Solve a specific challenge';
    case 'first_solve':
    default:
      return 'Solve your first challenge';
  }
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

const asArray = (data) => (Array.isArray(data) ? data : (data?.results ?? []));

const safeGradient = (value) =>
  Array.isArray(value) && value.length === 2 ? value : GRADIENT_PRESETS[0];

/** Wire shape (admin) -> the admin table/form model. */
const toAdmin = (a) => ({
  id: a.id,
  slug: a.slug,
  name: a.name,
  description: a.description || '',
  category: a.category || 'General',
  icon: ICONS[a.icon] ? a.icon : 'Trophy',
  gradient: safeGradient(a.gradient),
  image: a.badge_image || '',
  rarity: RARITIES.includes(a.rarity) ? a.rarity : 'Common',
  reward: Number(a.reward) || 0,
  active: a.is_active !== false,
  sortOrder: Number(a.sort_order) || 0,
  criteriaType: a.criteria_type,
  criteriaConfig: a.criteria_config || {},
  criteriaLabel: a.criteria_label || '',
  earnedCount: Number(a.earned_count) || 0,
  createdAt: a.created_at || null,
  updatedAt: a.updated_at || null,
});

/** Wire shape (player board) -> the card model. Award state is server-owned. */
const toUser = (a) => ({
  id: a.id,
  slug: a.slug,
  name: a.name,
  description: a.description || '',
  category: a.category || 'General',
  icon: ICONS[a.icon] ? a.icon : 'Trophy',
  gradient: safeGradient(a.gradient),
  image: a.badge_image || '',
  rarity: RARITIES.includes(a.rarity) ? a.rarity : 'Common',
  reward: Number(a.reward) || 0,
  criteriaType: a.criteria_type,
  criteriaLabel: a.criteria_label || '',
  earned: Boolean(a.earned),
  unlockedAt: a.unlocked_at || null,
  progress: {
    gained: Number(a.progress?.gained) || 0,
    target: Math.max(1, Number(a.progress?.target) || 1),
  },
});

/** UI draft -> the writable wire fields. Only provided keys are sent, so a
 *  PATCH never clobbers an omitted field. `slug` is never sent: the server
 *  derives it. */
const toPayload = (data = {}) => {
  const payload = {};
  if ('name' in data) payload.name = data.name;
  if ('description' in data) payload.description = data.description;
  if ('category' in data) payload.category = data.category;
  if ('icon' in data) payload.icon = data.icon;
  if ('gradient' in data) payload.gradient = data.gradient;
  if ('image' in data) payload.badge_image = data.image;
  if ('rarity' in data) payload.rarity = data.rarity;
  if ('reward' in data) payload.reward = Math.max(0, Number(data.reward) || 0);
  if ('active' in data) payload.is_active = Boolean(data.active);
  if ('sortOrder' in data) payload.sort_order = Math.max(0, Number(data.sortOrder) || 0);
  if ('criteriaType' in data) payload.criteria_type = data.criteriaType;
  if ('criteriaConfig' in data) payload.criteria_config = data.criteriaConfig;
  return payload;
};

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export const achievementService = {
  /**
   * The caller's achievement board.
   * GET /achievements/ — authenticated; `earned`, `unlocked_at` and `progress`
   * are computed by the server from the caller's own solve history.
   */
  async getActiveAchievements() {
    const data = await api.get('/achievements/');
    return asArray(data).map(toUser);
  },

  /**
   * Every definition (drafts included), for the admin table.
   * GET /admin/achievements/ — requires the achievement model permissions.
   */
  async getAchievements() {
    const data = await api.get('/admin/achievements/');
    return asArray(data).map(toAdmin);
  },

  /** POST /admin/achievements/ — create. Rejects on validation errors. */
  async createAchievement(data) {
    const created = await api.post('/admin/achievements/', toPayload(data));
    return toAdmin(created);
  },

  /** PATCH /admin/achievements/{id}/ — partial update. */
  async updateAchievement(id, data) {
    const updated = await api.patch(`/admin/achievements/${id}/`, toPayload(data));
    return toAdmin(updated);
  },

  /** Toggle the visibility flag through the same validated PATCH. */
  async setActive(id, active) {
    return this.updateAchievement(id, { active });
  },

  /** DELETE /admin/achievements/{id}/ — a soft delete server-side. */
  async deleteAchievement(id) {
    await api.delete(`/admin/achievements/${id}/`);
    return { success: true };
  },
};

export default achievementService;
