var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/services/api.js
var api_exports = {};
__export(api_exports, {
  ApiError: () => ApiError,
  api: () => api,
  default: () => api_default,
  humanizeError: () => humanizeError,
  refreshAccessToken: () => refreshAccessToken,
  request: () => request,
  tokenStore: () => tokenStore
});
function humanizeError(data, fallback = "Something went wrong. Please try again.") {
  if (data == null) return fallback;
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed || trimmed.startsWith("<")) return fallback;
    return trimmed.length > 300 ? fallback : trimmed;
  }
  if (Array.isArray(data)) {
    return data.filter(Boolean).join(" ") || fallback;
  }
  if (typeof data === "object") {
    if (data.detail != null) {
      const detail = Array.isArray(data.detail) ? data.detail.filter(Boolean).join(" ") : data.detail;
      if (typeof detail === "string" && detail) return detail;
    }
    const parts = [];
    const internalKeys = /* @__PURE__ */ new Set([
      "trace",
      "traceback",
      "stack",
      "stacktrace",
      "debug",
      "exception",
      "exc",
      "internal",
      "django",
      "request",
      "settings"
    ]);
    for (const [field, value] of Object.entries(data)) {
      if (internalKeys.has(field.toLowerCase())) continue;
      const messages = Array.isArray(value) ? value : [value];
      const text = messages.filter((m) => typeof m === "string").join(" ");
      if (!text) continue;
      const label = {
        username: "Username",
        email: "Email",
        password: "Password",
        password2: "Password confirmation",
        refresh: "Session",
        non_field_errors: ""
      }[field];
      if (label === "") parts.push(text);
      else if (label) parts.push(`${label}: ${text}`);
      else parts.push(text);
    }
    if (parts.length) return parts.join(" ");
  }
  return fallback;
}
async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    retry = true,
    signal
  } = options;
  const headers = { Accept: "application/json" };
  if (body !== void 0 && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (auth && tokenStore.getAccess()) {
    headers.Authorization = `Bearer ${tokenStore.getAccess()}`;
  }
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === void 0 ? void 0 : body instanceof FormData ? body : JSON.stringify(body)
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", { status: 0 });
  }
  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, { ...options, retry: false });
    }
    tokenStore.clear();
    window.dispatchEvent(new CustomEvent("auth:expired"));
    throw new ApiError("Your session has expired. Please log in again.", { status: 401 });
  }
  const data = await readBody(response);
  if (!response.ok) {
    const message = humanizeError(
      data,
      response.status === 403 ? "You do not have permission to do that." : response.status === 404 ? "That resource was not found." : response.status >= 500 ? "The server had a problem. Please try again later." : "Request failed. Please try again."
    );
    throw new ApiError(message, { status: response.status, data });
  }
  return data;
}
async function performRefresh() {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh })
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data || !data.access) return false;
    tokenStore.setAccess(data.access);
    if (data.refresh) tokenStore.setRefresh(data.refresh);
    return true;
  } catch {
    return false;
  }
}
function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
var BASE_URL, ACCESS_KEY, REFRESH_KEY, tokenStore, ApiError, api, api_default, refreshInFlight;
var init_api = __esm({
  "src/services/api.js"() {
    BASE_URL = "https://api.example.test/api/v1".replace(/\/+$/, "");
    ACCESS_KEY = "cyberforge_access";
    REFRESH_KEY = "cyberforge_refresh";
    tokenStore = {
      getAccess: () => localStorage.getItem(ACCESS_KEY),
      getRefresh: () => localStorage.getItem(REFRESH_KEY),
      setTokens({ access, refresh }) {
        if (access) localStorage.setItem(ACCESS_KEY, access);
        if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
      },
      setAccess(access) {
        if (access) localStorage.setItem(ACCESS_KEY, access);
      },
      clear() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
    };
    ApiError = class extends Error {
      constructor(message, { status = 0, data = null } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
      }
    };
    api = {
      get: (path, options) => request(path, { ...options, method: "GET" }),
      post: (path, body, options) => request(path, { ...options, method: "POST", body }),
      patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
      put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
      delete: (path, options) => request(path, { ...options, method: "DELETE" })
    };
    api_default = api;
    refreshInFlight = null;
  }
});

// src/services/authService.js
var authService_exports = {};
__export(authService_exports, {
  authService: () => authService,
  default: () => authService_default
});
function normaliseUser(raw) {
  if (!raw) return null;
  return {
    ...raw,
    // Backend-provided
    id: raw.id,
    username: raw.username,
    email: raw.email ?? "",
    first_name: raw.first_name ?? "",
    last_name: raw.last_name ?? "",
    points: raw.points ?? 0,
    bio: raw.bio ?? "",
    avatar: raw.avatar ?? null,
    role: raw.role ?? "user",
    onboardingCompleted: raw.onboardingCompleted ?? false,
    // The questionnaire answers live in User.onboarding; Settings.jsx reads
    // userType from the top level, so surface it from the stored payload.
    onboarding: raw.onboarding && Object.keys(raw.onboarding).length ? raw.onboarding : null,
    // Backend-provided editable profile. The API speaks snake_case; the UI
    // reads camelCase. `displayName` falls back to the immutable username when
    // the user has not set one.
    displayName: raw.displayName || raw.display_name || raw.username || "",
    website: raw.website ?? "",
    twitter: raw.twitter ?? "",
    github: raw.github ?? "",
    // Server-persisted account preferences. The API returns a complete
    // notification set (defaults merged server-side), but the client still
    // defaults to `{}` so a missing field can never crash the panel.
    notifPrefs: raw.notifPrefs ?? raw.notification_prefs ?? {},
    profileVisibility: raw.profileVisibility ?? raw.profile_visibility ?? "public",
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
    joinDate: raw.joinDate ?? raw.date_joined ?? null
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
function applyServerUser(data) {
  const cached = readStoredUser() || {};
  delete cached.displayName;
  const updated = normaliseUser({ ...cached, ...data });
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}
var USER_KEY, authService, authService_default;
var init_authService = __esm({
  "src/services/authService.js"() {
    init_api();
    USER_KEY = "cyberforge_user";
    authService = {
      /**
       * Create an account. The backend requires `password2` and echoes back the
       * public user representation.
       */
      async register(username, email, password, password2) {
        const data = await api.post(
          "/auth/register/",
          { username, email, password, password2: password2 ?? password },
          { auth: false }
        );
        const tokens = await api.post(
          "/auth/login/",
          { username, password },
          { auth: false }
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
          "/auth/login/",
          { username: identifier, password },
          { auth: false }
        );
        tokenStore.setTokens(tokens);
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
          const data = await api.get("/auth/me/");
          const user = normaliseUser(data);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          return user;
        } catch (err) {
          if (refresh && err instanceof ApiError && err.status === 401) {
            const ok = await refreshAccessToken();
            if (ok) {
              const data = await api.get("/auth/me/");
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
              "/auth/logout/",
              { refresh },
              { auth: false, retry: false }
            );
          } catch {
          }
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
        return api.post("/auth/password/", {
          current_password: currentPassword,
          new_password: newPassword,
          new_password2: confirmPassword ?? newPassword
        });
      },
      /**
       * Persist account preferences (notification flags and/or profile
       * visibility) via PATCH /auth/me/preferences/. Only the fields provided are
       * sent; the API echoes the canonical user, which is merged into the cache.
       */
      async updatePreferences({ notificationPrefs, profileVisibility } = {}) {
        const payload = {};
        if (notificationPrefs !== void 0) payload.notification_prefs = notificationPrefs;
        if (profileVisibility !== void 0) payload.profile_visibility = profileVisibility;
        const data = await api.patch("/auth/me/preferences/", payload);
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
        if (displayName !== void 0) payload.display_name = displayName;
        if (bio !== void 0) payload.bio = bio;
        if (website !== void 0) payload.website = website;
        if (twitter !== void 0) payload.twitter = twitter;
        if (github !== void 0) payload.github = github;
        const data = await api.patch("/auth/me/", payload);
        return applyServerUser(data);
      },
      /**
       * Upload (or replace) the avatar via a multipart PATCH /auth/me/.
       * The server validates the image and removes the superseded file.
       */
      async uploadAvatar(file) {
        if (!file) {
          throw new ApiError("Choose an image to upload.", { status: 0 });
        }
        const form = new FormData();
        form.append("avatar", file);
        const data = await api.patch("/auth/me/", form);
        return applyServerUser(data);
      },
      /** Remove the current avatar (DELETE /auth/me/avatar/). */
      async removeAvatar() {
        const data = await api.delete("/auth/me/avatar/");
        return applyServerUser(data);
      },
      /** Synchronous check used by route guards before hydration finishes. */
      isAuthenticated() {
        return Boolean(tokenStore.getAccess());
      },
      /** Cached user, if any. Not a substitute for getCurrentUser(). */
      getCachedUser() {
        return readStoredUser();
      }
    };
    authService_default = authService;
  }
});

// scripts/settings-harness/entry.mjs
var store = /* @__PURE__ */ new Map();
var localStorage2 = {
  getItem: (k) => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => {
    store.set(k, String(v));
  },
  removeItem: (k) => {
    store.delete(k);
  },
  clear: () => {
    store.clear();
  }
};
var dispatchedEvents = [];
var listeners = {};
var window2 = {
  localStorage: localStorage2,
  dispatchEvent: (e) => {
    dispatchedEvents.push(e);
    return true;
  },
  addEventListener: (type, fn) => {
    (listeners[type] ||= []).push(fn);
  },
  removeEventListener: () => {
  }
};
var calls = [];
var queue = [];
var networkFailure = false;
var jsonResponse = (res) => ({
  ok: res.status >= 200 && res.status < 300,
  status: res.status,
  text: async () => res.body == null ? "" : JSON.stringify(res.body),
  json: async () => res.body
});
var fetchStub = async (url, options = {}) => {
  if (networkFailure) throw new TypeError("Failed to fetch");
  let body;
  if (options.body !== void 0) body = JSON.parse(options.body);
  calls.push({
    url,
    method: options.method || "GET",
    headers: options.headers || {},
    body
  });
  const res = queue.shift() || { status: 200, body: {} };
  return jsonResponse(res);
};
globalThis.localStorage = localStorage2;
globalThis.window = window2;
globalThis.fetch = fetchStub;
var { authService: authService2 } = await Promise.resolve().then(() => (init_authService(), authService_exports));
var { tokenStore: tokenStore2, ApiError: ApiError2 } = await Promise.resolve().then(() => (init_api(), api_exports));
var BASE = "https://api.example.test/api/v1";
var tests = [];
var test = (name, fn) => tests.push([name, fn]);
var assert = (cond, msg) => {
  if (!cond) throw new Error(msg || "assertion failed");
};
var assertEqual = (actual, expected, msg) => {
  if (actual !== expected) {
    throw new Error(`${msg || "expected equal"}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  }
};
var lastCall = () => calls[calls.length - 1];
var queueResponses = (...responses) => {
  queue = responses;
};
var withTokens = (access = "tok123", refresh = "ref123") => tokenStore2.setTokens({ access, refresh });
function resetEnv() {
  calls = [];
  queue = [];
  networkFailure = false;
  store.clear();
  dispatchedEvents.length = 0;
}
var USER_PAYLOAD = {
  id: 1,
  username: "om",
  email: "om@example.com",
  points: 320,
  profile_visibility: "private",
  notification_prefs: {
    solves: true,
    achievements: false,
    new_challenges: true,
    events: true,
    rank_changes: true
  }
};
test("getCurrentUser translates snake_case preferences to camelCase", async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  const u = await authService2.getCurrentUser();
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/auth/me/`);
  assertEqual(lastCall().headers.Authorization, "Bearer tok123");
  assertEqual(u.profileVisibility, "private");
  assertEqual(u.notifPrefs.rank_changes, true);
  assertEqual(u.notifPrefs.achievements, false);
});
test("getCurrentUser caches the server preferences, so a reload keeps them", async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  await authService2.getCurrentUser();
  const cached = JSON.parse(localStorage2.getItem("cyberforge_user"));
  assertEqual(cached.profileVisibility, "private");
  assertEqual(cached.notifPrefs.events, true);
});
test("a payload without preferences still yields safe defaults", async () => {
  withTokens();
  queueResponses({ status: 200, body: { id: 2, username: "fresh" } });
  const u = await authService2.getCurrentUser();
  assertEqual(u.profileVisibility, "public");
  assertEqual(typeof u.notifPrefs, "object");
  assertEqual(u.notifPrefs, u.notifPrefs);
});
test("changePassword POSTs the three password fields", async () => {
  withTokens();
  queueResponses({ status: 200, body: { detail: "Password updated." } });
  await authService2.changePassword("OldPass123!", "NewPass456!", "NewPass456!");
  assertEqual(lastCall().method, "POST");
  assertEqual(lastCall().url, `${BASE}/auth/password/`);
  assertEqual(lastCall().headers.Authorization, "Bearer tok123");
  assertEqual(lastCall().headers["Content-Type"], "application/json");
  assertEqual(JSON.stringify(lastCall().body), JSON.stringify({
    current_password: "OldPass123!",
    new_password: "NewPass456!",
    new_password2: "NewPass456!"
  }));
});
test("changePassword defaults the confirmation to the new password", async () => {
  withTokens();
  queueResponses({ status: 200, body: {} });
  await authService2.changePassword("OldPass123!", "NewPass456!");
  assertEqual(lastCall().body.new_password2, "NewPass456!");
});
test("changePassword stores no password client-side", async () => {
  withTokens();
  queueResponses({ status: 200, body: {} });
  await authService2.changePassword("OldPass123!", "NewPass456!", "NewPass456!");
  const dump = JSON.stringify([...store.entries()]);
  assert(!dump.includes("NewPass456!"), "the new password must not be persisted");
  assert(!dump.includes("OldPass123!"), "the current password must not be persisted");
});
test("changePassword surfaces a weak-password rejection", async () => {
  withTokens();
  queueResponses({ status: 400, body: { new_password: ["This password is too common."] } });
  let err;
  try {
    await authService2.changePassword("OldPass123!", "password", "password");
  } catch (e) {
    err = e;
  }
  assert(err instanceof ApiError2, "expected an ApiError");
  assertEqual(err.status, 400);
  assert(/too common/i.test(err.message), `unexpected message: ${err.message}`);
});
test("changePassword surfaces a wrong-current-password rejection", async () => {
  withTokens();
  queueResponses({ status: 400, body: { current_password: ["That is not your current password."] } });
  let err;
  try {
    await authService2.changePassword("nope", "NewPass456!", "NewPass456!");
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 400);
  assert(/current password/i.test(err.message), `unexpected message: ${err.message}`);
});
test("changePassword surfaces a mismatch rejection", async () => {
  withTokens();
  queueResponses({ status: 400, body: { new_password2: ["The two password fields did not match."] } });
  let err;
  try {
    await authService2.changePassword("OldPass123!", "NewPass456!", "Different!9");
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 400);
  assert(/did not match/i.test(err.message), `unexpected message: ${err.message}`);
});
test("updatePreferences PATCHes notification_prefs and returns the canonical user", async () => {
  withTokens();
  queueResponses({ status: 200, body: { ...USER_PAYLOAD, notification_prefs: { ...USER_PAYLOAD.notification_prefs, rank_changes: false } } });
  const u = await authService2.updatePreferences({ notificationPrefs: { rank_changes: false } });
  assertEqual(lastCall().method, "PATCH");
  assertEqual(lastCall().url, `${BASE}/auth/me/preferences/`);
  assertEqual(lastCall().headers["Content-Type"], "application/json");
  assertEqual(lastCall().headers.Authorization, "Bearer tok123");
  assertEqual(lastCall().body.profile_visibility, void 0, "only the provided field is sent");
  assertEqual(lastCall().body.notification_prefs.rank_changes, false);
  assertEqual(u.notifPrefs.rank_changes, false);
});
test("updatePreferences PATCHes profile_visibility on its own", async () => {
  withTokens();
  queueResponses({ status: 200, body: { ...USER_PAYLOAD, profile_visibility: "public" } });
  const u = await authService2.updatePreferences({ profileVisibility: "public" });
  assertEqual(lastCall().body.profile_visibility, "public");
  assertEqual(lastCall().body.notification_prefs, void 0, "notifications are untouched");
  assertEqual(u.profileVisibility, "public");
});
test("updatePreferences sends both fields together", async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  await authService2.updatePreferences({
    notificationPrefs: { solves: false },
    profileVisibility: "private"
  });
  assertEqual(lastCall().body.profile_visibility, "private");
  assertEqual(lastCall().body.notification_prefs.solves, false);
});
test("updatePreferences merges the response into the cache, keeping stats fields", async () => {
  withTokens();
  localStorage2.setItem("cyberforge_user", JSON.stringify({ id: 1, username: "om", rank: 4, streak: 2 }));
  queueResponses({ status: 200, body: { ...USER_PAYLOAD } });
  const u = await authService2.updatePreferences({ profileVisibility: "private" });
  const cached = JSON.parse(localStorage2.getItem("cyberforge_user"));
  assertEqual(cached.profileVisibility, "private");
  assertEqual(cached.notifPrefs.rank_changes, true);
  assertEqual(cached.rank, 4);
  assertEqual(u.rank, 4);
});
test("updatePreferences rejects on failure instead of faking success", async () => {
  withTokens();
  localStorage2.setItem("cyberforge_user", JSON.stringify({ id: 1, profileVisibility: "public" }));
  const before = localStorage2.getItem("cyberforge_user");
  queueResponses({ status: 400, body: { profile_visibility: ['"nope" is not a valid choice.'] } });
  let err;
  try {
    await authService2.updatePreferences({ profileVisibility: "nope" });
  } catch (e) {
    err = e;
  }
  assert(err instanceof ApiError2, "expected an ApiError");
  assertEqual(err.status, 400);
  assertEqual(localStorage2.getItem("cyberforge_user"), before, "the cache must not be updated optimistically");
});
test("updatePreferences never writes preferences to a separate localStorage key", async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  await authService2.updatePreferences({ profileVisibility: "private" });
  const keys = [...store.keys()];
  assert(
    !keys.some((k) => /pref|visibility|notif/i.test(k)),
    `server-owned values must not have a localStorage home: ${keys.join(", ")}`
  );
});
test("logout POSTs the refresh token to /auth/logout/ without an access header", async () => {
  withTokens("acc", "refresh-abc");
  queueResponses({ status: 200, body: { detail: "Signed out." } });
  await authService2.logout();
  assertEqual(lastCall().method, "POST");
  assertEqual(lastCall().url, `${BASE}/auth/logout/`);
  assertEqual(lastCall().body.refresh, "refresh-abc");
  assertEqual(lastCall().headers.Authorization, void 0);
});
test("logout clears every piece of local state", async () => {
  withTokens("acc", "refresh-abc");
  localStorage2.setItem("cyberforge_user", JSON.stringify({ id: 1 }));
  queueResponses({ status: 200, body: {} });
  await authService2.logout();
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(localStorage2.getItem("cyberforge_refresh"), null);
  assertEqual(localStorage2.getItem("cyberforge_user"), null);
});
test("logout still clears local state when the server errors (best effort)", async () => {
  withTokens("acc", "refresh-abc");
  localStorage2.setItem("cyberforge_user", JSON.stringify({ id: 1 }));
  queueResponses({ status: 500, body: null });
  await authService2.logout();
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(localStorage2.getItem("cyberforge_refresh"), null);
  assertEqual(localStorage2.getItem("cyberforge_user"), null);
});
test("logout clears local state on a network failure", async () => {
  withTokens("acc", "refresh-abc");
  localStorage2.setItem("cyberforge_user", JSON.stringify({ id: 1 }));
  networkFailure = true;
  await authService2.logout();
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(localStorage2.getItem("cyberforge_user"), null);
});
test("logout treats an already-invalid token as signed out", async () => {
  withTokens("acc", "stale");
  queueResponses({ status: 401, body: { detail: "Token is invalid or expired" } });
  await authService2.logout();
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(localStorage2.getItem("cyberforge_refresh"), null);
});
test("logout with no stored refresh token never touches the network", async () => {
  tokenStore2.setTokens({ access: "acc-only" });
  await authService2.logout();
  assertEqual(calls.length, 0);
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
});
test("logout clears the session exactly once (no retry)", async () => {
  withTokens("acc", "ref");
  queueResponses({ status: 401, body: null });
  await authService2.logout();
  assertEqual(calls.length, 1, "logout must not attempt a token refresh");
  assertEqual(calls[0].url, `${BASE}/auth/logout/`);
});
var passed = 0;
var failures = [];
for (const [name, fn] of tests) {
  resetEnv();
  try {
    await fn();
    passed += 1;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failures.push({ name, e });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
  }
}
console.log(`
${passed}/${tests.length} passed`);
if (failures.length) {
  console.error(`
${failures.length} failing test(s).`);
  process.exitCode = 1;
}
