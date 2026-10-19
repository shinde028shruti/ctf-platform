/**
 * authService.js
 * Authentication against the Django REST API.
 *
 * Endpoints (relative to VITE_API_BASE_URL):
 *   POST   /auth/register/    { username, email, password, password2 }
 *   POST   /auth/login/       { username, password }   -> { access, refresh }
 *   POST   /auth/refresh/     { refresh }              -> { access }
 *   POST   /auth/logout/      { refresh }              (blacklists the token)
 *   POST   /auth/password/    { current_password, new_password, new_password2 }
 *   GET    /auth/me/          Authorization: Bearer <access>
 *   PATCH  /auth/me/          partial profile update (JSON or multipart avatar)
 *   PATCH  /auth/me/preferences/  { notification_prefs, profile_visibility }
 *   DELETE /auth/me/avatar/   remove the current avatar
 *   POST   /auth/onboarding/  persist the questionnaire (see onboardingService)
 *
 * The exported surface is unchanged from the previous mocked version so that
 * AppContext and the Login/Register pages needed no restructuring.
 *
 * Logout attempts to blacklist the refresh token server-side, but always clears
 * local state even if that call fails (offline, already expired, ...).
 */

import { api, tokenStore, refreshAccessToken, ApiError } from './api';

const USER_KEY = 'cyberforge_user';

/**
 * Merge an API / cached user with the defaults the UI expects.
 *
 * The backend only persists id / username / email / names / points / bio /
 * avatar / role / onboardingCompleted. Everything else the UI reads (streak,
 * rank, badges, solvedChallenges, progress arrays, ...) is not yet modelled
 * server-side and gets a neutral default.
 *
 * Every default is applied with `??` rather than assigned unconditionally:
 * this function also runs over the locally cached user, so a hardcoded value
 * would silently overwrite fields the user just edited.
 */
function normaliseUser(raw) {
  if (!raw) return null;

  return {
    ...raw,

    // Backend-provided
    id: raw.id,
    username: raw.username,
    email: raw.email ?? '',
    first_name: raw.first_name ?? '',
    last_name: raw.last_name ?? '',
    points: raw.points ?? 0,
    bio: raw.bio ?? '',
    avatar: raw.avatar ?? null,
    role: raw.role ?? 'user',
    onboardingCompleted: raw.onboardingCompleted ?? false,

    // The questionnaire answers live in User.onboarding; Settings.jsx reads
    // userType from the top level, so surface it from the stored payload.
    onboarding: (raw.onboarding && Object.keys(raw.onboarding).length)
      ? raw.onboarding
      : null,

    // Backend-provided editable profile. The API speaks snake_case; the UI
    // reads camelCase. `displayName` falls back to the immutable username when
    // the user has not set one.
    displayName: raw.displayName || raw.display_name || raw.username || '',
    website: raw.website ?? '',
    twitter: raw.twitter ?? '',
    github: raw.github ?? '',

    // Server-persisted account preferences. The API returns a complete
    // notification set (defaults merged server-side), but the client still
    // defaults to `{}` so a missing field can never crash the panel.
    notifPrefs: raw.notifPrefs ?? raw.notification_prefs ?? {},
    profileVisibility: raw.profileVisibility ?? raw.profile_visibility ?? 'public',

    // Frontend-only fields, defaulted but never overwritten.
    streak: raw.streak ?? 0,
    rank: raw.rank ?? null,
    solvedChallenges: raw.solvedChallenges ?? [],
    badges: raw.badges ?? [],
    userType: raw.userType ?? raw.onboarding?.userType ?? null,
    categoryStats: raw.categoryStats ?? {},
    weeklyProgress: raw.weeklyProgress ?? [],
    monthlyProgress: raw.monthlyProgress ?? [],
    recentActivity: raw.recentActivity ?? [],
    // `date_joined` is a real Django column; prefer it for the "member since" date.
    joinDate: raw.joinDate ?? raw.date_joined ?? null,
  };
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fold a server user payload into the cached user and persist it.
 *
 * The profile endpoints return only the fields they own; the cached object may
 * additionally hold stats-derived values (rank, streaks, progress, ...). Those
 * are merged back in so saving the profile never wipes data that came from the
 * stats endpoint.
 */
function applyServerUser(data) {
  const cached = readStoredUser() || {};
  // `normaliseUser` derives `displayName` from `display_name`, but the cached
  // object also carries the previous derived alias. Drop it before merging so
  // the stale copy cannot shadow the value the API just returned.
  delete cached.displayName;
  const updated = normaliseUser({ ...cached, ...data });
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

export const authService = {
  /**
   * Create an account. The backend requires `password2` and echoes back the
   * public user representation.
   */
  async register(username, email, password, password2) {
    const data = await api.post(
      '/auth/register/',
      { username, email, password, password2: password2 ?? password },
      { auth: false },
    );

    // Registration does not return tokens, so sign the new account in.
    const tokens = await api.post(
      '/auth/login/',
      { username, password },
      { auth: false },
    );
    tokenStore.setTokens(tokens);

    const user = normaliseUser(data);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Exchange credentials for a token pair, then load the current user.
   *
   * `identifier` may be either the username or the email address: the value is
   * sent in the `username` field, and UsernameOrEmailBackend resolves it against
   * both columns. The response does not include the identifier, so /me/ is
   * fetched to obtain the canonical user.
   */
  async login(identifier, password) {
    const tokens = await api.post(
      '/auth/login/',
      { username: identifier, password },
      { auth: false },
    );

    tokenStore.setTokens(tokens);

    // A freshly issued access token is always valid, so a failure here means
    // the credentials were accepted but /me/ is unreachable.
    const user = normaliseUser(await authService.getCurrentUser({ refresh: true }));
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  /** Exchange the stored refresh token for a new access token. */
  async refreshToken() {
    return refreshAccessToken();
  },

  /**
   * GET /auth/me/ using the stored access token.
   * Never falls back to a cached user: a 401 must surface so the caller can
   * decide whether to refresh or log out.
   */
  async getCurrentUser({ refresh = false } = {}) {
    try {
      const data = await api.get('/auth/me/');
      const user = normaliseUser(data);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      if (refresh && err instanceof ApiError && err.status === 401) {
        const ok = await refreshAccessToken();
        if (ok) {
          const data = await api.get('/auth/me/');
          const user = normaliseUser(data);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          return user;
        }
      }
      throw err;
    }
  },

  /**
   * Clear all client-side auth state, revoking the refresh token server-side
   * first. The server call is best-effort: a network failure must never stop
   * the user from signing out locally, and an already-expired/blacklisted
   * token is treated as successfully revoked.
   */
  async logout() {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await api.post(
          '/auth/logout/',
          { refresh },
          { auth: false, retry: false },
        );
      } catch { /* offline or token already invalid: still sign out locally */ }
    }
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Change the caller's password.
   *
   * The server requires the current password, validates the new one with
   * Django's configured validators, and (on success) blacklists every refresh
   * token for the account - so the caller must sign in again. Errors surface
   * as an ApiError whose message is safe to show.
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    return api.post('/auth/password/', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password2: confirmPassword ?? newPassword,
    });
  },

  /**
   * Persist account preferences (notification flags and/or profile
   * visibility) via PATCH /auth/me/preferences/. Only the fields provided are
   * sent; the API echoes the canonical user, which is merged into the cache.
   */
  async updatePreferences({ notificationPrefs, profileVisibility } = {}) {
    const payload = {};
    if (notificationPrefs !== undefined) payload.notification_prefs = notificationPrefs;
    if (profileVisibility !== undefined) payload.profile_visibility = profileVisibility;

    const data = await api.patch('/auth/me/preferences/', payload);
    return applyServerUser(data);
  },

  /**
   * Update the editable profile fields shown on the Settings page.
   *
   * Persists via PATCH /auth/me/ (partial update) and only sends the fields
   * the caller provided, so a given field can never be cleared by editing
   * another. The API responds with the canonical user, which is merged into
   * the cache and returned for `AppContext.updateUser`.
   *
   * `displayName` maps to the backend's `display_name` column.
   */
  async updateProfile({ displayName, bio, website, twitter, github } = {}) {
    const payload = {};
    if (displayName !== undefined) payload.display_name = displayName;
    if (bio !== undefined) payload.bio = bio;
    if (website !== undefined) payload.website = website;
    if (twitter !== undefined) payload.twitter = twitter;
    if (github !== undefined) payload.github = github;

    const data = await api.patch('/auth/me/', payload);
    return applyServerUser(data);
  },

  /**
   * Upload (or replace) the avatar via a multipart PATCH /auth/me/.
   * The server validates the image and removes the superseded file.
   */
  async uploadAvatar(file) {
    if (!file) {
      throw new ApiError('Choose an image to upload.', { status: 0 });
    }
    const form = new FormData();
    form.append('avatar', file);

    const data = await api.patch('/auth/me/', form);
    return applyServerUser(data);
  },

  /** Remove the current avatar (DELETE /auth/me/avatar/). */
  async removeAvatar() {
    const data = await api.delete('/auth/me/avatar/');
    return applyServerUser(data);
  },

  /** Synchronous check used by route guards before hydration finishes. */
  isAuthenticated() {
    return Boolean(tokenStore.getAccess());
  },

  /** Cached user, if any. Not a substitute for getCurrentUser(). */
  getCachedUser() {
    return readStoredUser();
  },
};

export default authService;