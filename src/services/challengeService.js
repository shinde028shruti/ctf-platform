/**
 * challengeService.js
 * Handles all challenge-related operations.
 * Currently uses mock data from src/data/challenges.js.
 * Replace individual methods with real API calls when backend is ready.
 */

import { challenges as mockChallenges, categories as mockCategories } from '../data/challenges';

const CHALLENGES_KEY = 'cyberforge_challenges';
const SOLVED_KEY = 'cyberforge_solved';

const delay = (ms = 500) => new Promise(res => setTimeout(res, ms));

// Get challenges from localStorage (admin edits) or fall back to mock data
const getStoredChallenges = () => {
  const raw = localStorage.getItem(CHALLENGES_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return mockChallenges;
};

const saveStoredChallenges = (challenges) => {
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
};

const getSolvedIds = () => {
  const raw = localStorage.getItem(SOLVED_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  // Pre-seed solved challenges for the mock user
  return [1, 3, 5, 7, 9, 11, 12, 13, 15, 16];
};

const saveSolvedIds = (ids) => {
  localStorage.setItem(SOLVED_KEY, JSON.stringify(ids));
};

export const challengeService = {
  /**
   * Get all published challenges.
   * TODO: Replace with GET /api/challenges
   */
  async getChallenges(filters = {}) {
    await delay();
    let list = getStoredChallenges().filter(c => c.status === 'published');
    const solved = getSolvedIds();

    list = list.map(c => ({ ...c, solved: solved.includes(c.id) }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.category && filters.category !== 'All') {
      list = list.filter(c => c.category === filters.category);
    }
    if (filters.difficulty && filters.difficulty !== 'All') {
      list = list.filter(c => c.difficulty === filters.difficulty);
    }
    if (filters.status === 'solved') {
      list = list.filter(c => c.solved);
    } else if (filters.status === 'unsolved') {
      list = list.filter(c => !c.solved);
    }
    if (filters.sort) {
      switch (filters.sort) {
        case 'points_asc': list.sort((a, b) => a.points - b.points); break;
        case 'points_desc': list.sort((a, b) => b.points - a.points); break;
        case 'solves_desc': list.sort((a, b) => b.solves - a.solves); break;
        case 'solves_asc': list.sort((a, b) => a.solves - b.solves); break;
        case 'newest': list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        default: break;
      }
    }
    return list;
  },

  /**
   * Get a single challenge by ID.
   * TODO: Replace with GET /api/challenges/:id
   */
  async getChallengeById(id) {
    await delay(300);
    const solved = getSolvedIds();
    const challenge = getStoredChallenges().find(c => c.id === Number(id));
    if (!challenge) throw new Error('Challenge not found.');
    return { ...challenge, solved: solved.includes(challenge.id) };
  },

  /**
   * Get all categories.
   * TODO: Replace with GET /api/categories
   */
  async getCategories() {
    await delay(200);
    return mockCategories;
  },

  /**
   * Submit a flag for a challenge.
   * TODO: Replace with POST /api/challenges/:id/submit
   */
  async submitFlag(challengeId, flag) {
    await delay(800);
    const challenges = getStoredChallenges();
    const challenge = challenges.find(c => c.id === Number(challengeId));
    if (!challenge) throw new Error('Challenge not found.');

    const solved = getSolvedIds();
    if (solved.includes(challenge.id)) {
      return { correct: true, alreadySolved: true, points: 0, message: 'Already solved!' };
    }

    const correct = flag.trim() === challenge.flag;
    if (correct) {
      solved.push(challenge.id);
      saveSolvedIds(solved);
      return { correct: true, alreadySolved: false, points: challenge.points, message: 'Correct flag!' };
    }
    return { correct: false, message: 'Incorrect flag. Keep investigating.' };
  },

  /**
   * Reveal a hint for a challenge (costs points).
   * TODO: Replace with POST /api/challenges/:id/hints/:hintId/reveal
   */
  async revealHint(challengeId, hintId) {
    await delay(400);
    const challenge = getStoredChallenges().find(c => c.id === Number(challengeId));
    if (!challenge) throw new Error('Challenge not found.');
    const hint = challenge.hints.find(h => h.id === Number(hintId));
    if (!hint) throw new Error('Hint not found.');
    return { hint, pointCost: hint.cost };
  },

  // ─── Admin Methods ─────────────────────────────────────────────────────────

  /**
   * Get ALL challenges (including drafts). Admin only.
   * TODO: Replace with GET /api/admin/challenges (requires admin JWT)
   */
  async getAllChallenges() {
    await delay(400);
    return getStoredChallenges();
  },

  /**
   * Create a new challenge. Admin only.
   * TODO: Replace with POST /api/admin/challenges
   */
  async createChallenge(data) {
    await delay(600);
    const challenges = getStoredChallenges();
    const newChallenge = {
      ...data,
      id: Date.now(),
      solves: 0,
      solved: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    challenges.push(newChallenge);
    saveStoredChallenges(challenges);
    return newChallenge;
  },

  /**
   * Update an existing challenge. Admin only.
   * TODO: Replace with PATCH /api/admin/challenges/:id
   */
  async updateChallenge(id, data) {
    await delay(500);
    const challenges = getStoredChallenges();
    const index = challenges.findIndex(c => c.id === Number(id));
    if (index === -1) throw new Error('Challenge not found.');
    challenges[index] = { ...challenges[index], ...data };
    saveStoredChallenges(challenges);
    return challenges[index];
  },

  /**
   * Delete a challenge. Admin only.
   * TODO: Replace with DELETE /api/admin/challenges/:id
   */
  async deleteChallenge(id) {
    await delay(400);
    const challenges = getStoredChallenges();
    const filtered = challenges.filter(c => c.id !== Number(id));
    saveStoredChallenges(filtered);
    return { success: true };
  },

  /**
   * Toggle challenge publish status. Admin only.
   * TODO: Replace with PATCH /api/admin/challenges/:id/status
   */
  async toggleChallengeStatus(id) {
    await delay(300);
    const challenges = getStoredChallenges();
    const index = challenges.findIndex(c => c.id === Number(id));
    if (index === -1) throw new Error('Challenge not found.');
    const newStatus = challenges[index].status === 'published' ? 'draft' : 'published';
    challenges[index].status = newStatus;
    saveStoredChallenges(challenges);
    return challenges[index];
  },
};
