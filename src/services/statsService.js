/**
 * statsService.js
 * The signed-in user's own dashboard/profile statistics.
 *
 *   GET /api/v1/stats/me/        Authorization: Bearer <access>
 *
 * The server is authoritative: it derives every value from the caller's stored
 * solves, hint unlocks and submissions (points balance and earned, unique
 * solves, global rank, per-category progress, recent solve/hint activity and
 * progress buckets). Nothing here is read from local storage.
 *
 * Throws an ApiError for an auth (401, which clears the session and emits
 * `auth:expired`) or a server (5xx) failure.
 */

import { api } from './api';

export const statsService = {
  /**
   * The current user's private statistics.
   * Resolves with:
   *   {
   *     points, earnedPoints, spentOnHints, solved, accuracy,
   *     submissions: { total, correct },
   *     rank,                    // int, or null when unranked
   *     joinDate,                // ISO string, or null
   *     solvedChallengeIds: [int],
   *     categoryProgress: [{ id, name, color, solved, total, points }],
   *     recentActivity:   [{ type, challengeId, challengeName, points, cost, timestamp }],
   *     progress: { weekly: [{ label, points }], monthly: [{ label, points }] },
   *     progression: {
   *       level, tier, points, levelMin, nextLevelMin, toNext,
   *       progressPct, elitePct, isMax,
   *     },                       // derived from earnedPoints, never the balance
   *   }
   */
  async getMyStats() {
    return api.get('/stats/me/');
  },
};

export default statsService;
