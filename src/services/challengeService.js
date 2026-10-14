/**
 * challengeService.js
 * Handles all challenge-related operations.
 *
 * Public methods call the real Django REST API at /api/v1/.
 * Admin methods call /api/v1/admin/challenges/ and require a JWT with
 * the appropriate Django model permissions.
 *
 * Flag submission and hint reveal call the real Django REST API. Instance
 * management remains mock — that is a separate backend stage.
 */

import { api } from './api';

// ─── Public API ──────────────────────────────────────────────────────────────

export const challengeService = {
  /**
   * Get all published challenges, optionally filtered.
   * GET /api/v1/challenges/?category=...&difficulty=...&search=...
   */
  async getChallenges(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') {
      params.set('category', filters.category);
    }
    if (filters.difficulty && filters.difficulty !== 'All') {
      params.set('difficulty', filters.difficulty);
    }
    if (filters.search) {
      params.set('search', filters.search);
    }
    const qs = params.toString();
    return api.get(`/challenges/${qs ? `?${qs}` : ''}`, { auth: false });
  },

  /**
   * Get a single published challenge by ID.
   * GET /api/v1/challenges/:id/
   */
  async getChallengeById(id) {
    return api.get(`/challenges/${id}/`, { auth: false });
  },

  /**
   * Get all categories with published challenge counts.
   * GET /api/v1/categories/
   */
  async getCategories() {
    return api.get('/categories/', { auth: false });
  },

  // ─── Flag Submission ─────────────────────────────────────────────────────

  /**
   * Submit a flag for a challenge.
   * POST /api/v1/challenges/:id/submit/
   *
   * Requires an authenticated session (Bearer token attached by api.js).
   * Resolves with the server's verdict:
   *   { correct, alreadySolved, points, message }
   * Throws an ApiError for validation (400), auth (401), missing/unpublished
   * (404) and throttling (429) responses.
   */
  async submitFlag(challengeId, flag) {
    return api.post(`/challenges/${challengeId}/submit/`, { flag });
  },

  // ─── Hints ───────────────────────────────────────────────────────────────

  /**
   * Reveal a hint for a challenge. Costs the hint's points, once.
   * POST /api/v1/challenges/:id/hints/:hintId/reveal/
   *
   * Requires an authenticated session (Bearer token attached by api.js; the
   * body is empty because the server is authoritative about the cost and the
   * acting user). Resolves with:
   *   { revealed, alreadyUnlocked, hint: { id, order, cost, text },
   *     pointsSpent, remainingPoints, message }
   * Throws an ApiError for insufficient points (400), auth (401),
   * a missing/hidden/foreign hint (404) and throttling (429).
   */
  async revealHint(challengeId, hintId) {
    return api.post(`/challenges/${challengeId}/hints/${hintId}/reveal/`, {});
  },

  // ─── Challenge Instances (mock — Docker stage) ────────────────────────────

  /**
   * Start a fresh instance for a challenge.
   * TODO: Replace with POST /api/challenges/:id/instances
   */
  async startInstance(challengeId) {
    const delay = (ms = 1200) => new Promise(res => setTimeout(res, ms));
    await delay();
    return null;
  },

  /**
   * Stop / terminate a running instance.
   * TODO: Replace with DELETE /api/challenges/:id/instances/active
   */
  async stopInstance(challengeId) {
    const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));
    await delay();
    return { success: true };
  },

  /**
   * Get the currently active instance for a challenge (if any).
   * TODO: Replace with GET /api/challenges/:id/instances/active
   */
  async getInstance(challengeId) {
    return null;
  },

  // ─── Admin API ────────────────────────────────────────────────────────────

  /**
   * Get ALL challenges (including drafts). Admin only.
   * GET /api/v1/admin/challenges/
   */
  async getAllChallenges({ status, search } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    return api.get(`/admin/challenges/${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get a single challenge by ID (any status). Admin only.
   * GET /api/v1/admin/challenges/:id/
   */
  async getChallengeByIdAdmin(id) {
    return api.get(`/admin/challenges/${id}/`);
  },

  /**
   * Create a new challenge. Admin only.
   * POST /api/v1/admin/challenges/
   */
  async createChallenge(data) {
    return api.post('/admin/challenges/', data);
  },

  /**
   * Update an existing challenge. Admin only.
   * PATCH /api/v1/admin/challenges/:id/
   */
  async updateChallenge(id, data) {
    return api.patch(`/admin/challenges/${id}/`, data);
  },

  /**
   * Delete a challenge. Admin only. Only draft challenges can be deleted.
   * DELETE /api/v1/admin/challenges/:id/
   */
  async deleteChallenge(id) {
    return api.delete(`/admin/challenges/${id}/`);
  },

  /**
   * Set challenge status (publish / unpublish / schedule). Admin only.
   * PATCH /api/v1/admin/challenges/:id/status/
   */
  async setChallengeStatus(id, status, publishAt = '') {
    return api.patch(`/admin/challenges/${id}/status/`, {
      status,
      publishAt: publishAt || '',
    });
  },

  /**
   * Upload an attachment to a challenge. Admin only.
   * POST /api/v1/admin/challenges/:id/attachments/
   */
  async uploadAttachment(id, file, name = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    return api.post(`/admin/challenges/${id}/attachments/`, formData);
  },

  /**
   * Delete an attachment from a challenge. Admin only.
   * DELETE /api/v1/admin/challenges/:id/attachments/:attachmentId/
   */
  async deleteAttachment(id, attachmentId) {
    return api.delete(`/admin/challenges/${id}/attachments/${attachmentId}/`);
  },
};

export default challengeService;
