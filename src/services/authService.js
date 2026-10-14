/**
 * authService.js
 * Authentication against the Django REST API.
 *
 * Endpoints (relative to VITE_API_BASE_URL):
 *   POST /auth/register/   { username, email, password, password2 }
 *   POST /auth/login/      { username, password }        -> { access, refresh }
 *   POST /auth/refresh/    { refresh }                   -> { access }
 *   GET  /auth/me/         Authorization: Bearer <access>
 *
 * The exported surface is unchanged from the previous mocked version so that
 * AppContext and the Login/Register pages needed no restructuring.
 *
 * There is no backend logout endpoint (no token blacklisting yet), so logout()
 * simply clears client-side state.
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

    // Frontend-only fields, defaulted but never overwritten.
    displayName: raw.displayName ?? raw.username,
    streak: raw.streak ?? 0,
    rank: raw.rank ?? null,
    solvedChallenges: raw.solvedChallenges ?? [],
    badges: raw.badges ?? [],
    website: raw.website ?? '',
    twitter: raw.twitter ?? '',
    userType: raw.userType ?? raw.onboarding?.userType ?? null,
    categoryStats: raw.categoryStats ?? {},
    profileVisibility: raw.profileVisibility ?? 'public',
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
   * Clear all client-side auth state.
   * No server call: there is no blacklist endpoint yet.
   */
  async logout() {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Update the editable profile fields used by the Settings page.
   *
   * NOTE: the API exposes no profile-write endpoint (only register / login /
   * refresh / me), so this writes to the local user cache, matching the
   * previous mocked behaviour. `bio` is the only field the backend User model
   * will eventually own; displayName / website / twitter have no column yet.
   * Because GET /auth/me/ is the source of truth on session restore, these
   * edits do not survive a reload until a PATCH /auth/me/ endpoint exists.
   */
  async updateProfile({ displayName, bio, website, twitter } = {}) {
    const cached = readStoredUser();
    const updated = normaliseUser({
      ...(cached || {}),
      bio: bio ?? cached?.bio ?? '',
      displayName: displayName ?? cached?.displayName ?? cached?.username ?? '',
      website: website ?? cached?.website ?? '',
      twitter: twitter ?? cached?.twitter ?? '',
    });

    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
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