/**
 * leaderboardService.js
 * Real leaderboard and ranking data from the Django REST API.
 *
 *   GET /api/v1/leaderboard/?period=all|week&category=<id>&page=&limit=
 *   GET /api/v1/leaderboard/me/?period=all|week&category=<id>
 *
 * The board is public and read-only; the server is authoritative about points
 * and ranks. Ranking rows expose only public profile fields
 * (id, username, points, solved, accuracy, meta, rank).
 *
 * The list endpoints resolve to an array of rows for convenience; the raw
 * paginated envelope is available via `getLeaderboardPage`.
 */

import { api } from './api';

function boardQuery({ period, category, page, limit } = {}) {
  const params = new URLSearchParams();
  if (period && period !== 'all') params.set('period', period);
  if (category && category !== 'All') params.set('category', category);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function fetchBoard(params = {}) {
  const data = await api.get(`/leaderboard/${boardQuery(params)}`, { auth: false });
  return data.results ?? data;
}

export const leaderboardService = {
  /**
   * All-time global leaderboard.
   * GET /api/v1/leaderboard/?period=all
   */
  async getGlobalLeaderboard(params = {}) {
    return fetchBoard({ ...params, period: 'all' });
  },

  /**
   * Trailing seven-day leaderboard.
   * GET /api/v1/leaderboard/?period=week
   */
  async getWeeklyLeaderboard(params = {}) {
    return fetchBoard({ ...params, period: 'week' });
  },

  /**
   * Category-scoped leaderboard (points earned on one category's challenges).
   * GET /api/v1/leaderboard/?category=<id|name>
   */
  async getCategoryLeaderboard(params = {}) {
    return fetchBoard({ ...params, period: 'all' });
  },

  /**
   * Raw paginated envelope: { count, next, previous, results }.
   */
  async getLeaderboardPage(params = {}) {
    return api.get(`/leaderboard/${boardQuery(params)}`, { auth: false });
  },

  /**
   * The signed-in user's own standing, even when off the current page.
   * GET /api/v1/leaderboard/me/
   *
   * Resolves with { id, username, points, solved, accuracy, meta, rank }
   * (`rank` is null when the user has not solved anything in scope yet).
   */
  async getMyRank({ period, category } = {}) {
    const params = new URLSearchParams();
    if (period && period !== 'all') params.set('period', period);
    if (category && category !== 'All') params.set('category', category);
    const qs = params.toString();
    return api.get(`/leaderboard/me/${qs ? `?${qs}` : ''}`);
  },
};

export default leaderboardService;
