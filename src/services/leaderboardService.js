/**
 * leaderboardService.js
 * Handles leaderboard and ranking data.
 * Currently uses mock data from src/data/users.js.
 * TODO: Replace all methods with real API calls when backend is ready.
 */

import { leaderboardUsers, weeklyLeaderboard, monthlyLeaderboard } from '../data/users';

const delay = (ms = 500) => new Promise(res => setTimeout(res, ms));

export const leaderboardService = {
  /**
   * Get global leaderboard.
   * TODO: Replace with GET /api/leaderboard?type=global&page=1&limit=50
   */
  async getGlobalLeaderboard() {
    await delay();
    return [...leaderboardUsers].sort((a, b) => b.points - a.points);
  },

  /**
   * Get weekly leaderboard.
   * TODO: Replace with GET /api/leaderboard?type=weekly
   */
  async getWeeklyLeaderboard() {
    await delay();
    return [...weeklyLeaderboard].sort((a, b) => b.points - a.points);
  },

  /**
   * Get monthly leaderboard.
   * TODO: Replace with GET /api/leaderboard?type=monthly
   */
  async getMonthlyLeaderboard() {
    await delay();
    return [...monthlyLeaderboard].sort((a, b) => b.points - a.points);
  },

  /**
   * Get event-specific leaderboard.
   * TODO: Replace with GET /api/events/:eventId/leaderboard
   */
  async getEventLeaderboard(eventId) {
    await delay();
    // Mock event leaderboard — same structure as global
    return [...leaderboardUsers]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((u, i) => ({ ...u, rank: i + 1, points: Math.floor(u.points * 0.4) }));
  },

  /**
   * Get current user's rank and surrounding users.
   * TODO: Replace with GET /api/leaderboard/me
   */
  async getUserRank(userId) {
    await delay(300);
    const all = [...leaderboardUsers].sort((a, b) => b.points - a.points);
    const index = all.findIndex(u => u.id === userId);
    if (index === -1) return null;
    return {
      rank: index + 1,
      user: all[index],
      nearby: all.slice(Math.max(0, index - 2), index + 3),
    };
  },
};
