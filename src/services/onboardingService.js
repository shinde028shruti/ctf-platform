/**
 * onboardingService.js
 *
 * Persists the new-user questionnaire.
 *
 * The answers are stored server-side on `User.onboarding` and completion is
 * recorded by flipping `User.onboardingCompleted`. Both matter: `/me/` is the
 * source of truth on session restore, so a purely local save would leave the
 * flag false and the user would be sent back to /onboarding on every reload.
 */

import { api, ApiError } from './api';

export const onboardingService = {
  /**
   * Submit the questionnaire answers and mark onboarding complete.
   *
   * @param {object} data
   * @param {string} [data.skillLevel]
   * @param {string} [data.teamInterest]
   * @param {string[]} [data.focusAreas]
   * @param {string} [data.purpose]
   * @param {string} [data.experienceType]
   * @param {string} [data.userType]
   * @returns {Promise<object>} the raw updated user from the API
   */
  async saveOnboarding(data) {
    return api.post('/auth/onboarding/', {
      skillLevel: data?.skillLevel ?? '',
      teamInterest: data?.teamInterest ?? '',
      focusAreas: data?.focusAreas ?? [],
      purpose: data?.purpose ?? '',
      experienceType: data?.experienceType ?? '',
      userType: data?.userType ?? '',
    });
  },

  /**
   * Answers previously submitted by this user, or null if none.
   * Sourced from the user object already in context/localStorage.
   */
  getOnboarding() {
    try {
      const raw = localStorage.getItem('cyberforge_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user.onboarding && Object.keys(user.onboarding).length
        ? user.onboarding
        : null;
    } catch {
      return null;
    }
  },

  isOnboardingCompleted() {
    try {
      const raw = localStorage.getItem('cyberforge_user');
      if (!raw) return false;
      return JSON.parse(raw).onboardingCompleted === true;
    } catch {
      return false;
    }
  },
};

export { ApiError };
export default onboardingService;