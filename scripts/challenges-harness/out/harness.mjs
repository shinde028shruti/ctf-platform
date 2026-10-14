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

// src/services/challengeService.js
var challengeService_exports = {};
__export(challengeService_exports, {
  challengeService: () => challengeService,
  default: () => challengeService_default
});
var challengeService, challengeService_default;
var init_challengeService = __esm({
  "src/services/challengeService.js"() {
    init_api();
    challengeService = {
      /**
       * Get all published challenges, optionally filtered.
       * GET /api/v1/challenges/?category=...&difficulty=...&search=...
       */
      async getChallenges(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category && filters.category !== "All") {
          params.set("category", filters.category);
        }
        if (filters.difficulty && filters.difficulty !== "All") {
          params.set("difficulty", filters.difficulty);
        }
        if (filters.search) {
          params.set("search", filters.search);
        }
        const qs = params.toString();
        return api.get(`/challenges/${qs ? `?${qs}` : ""}`, { auth: false });
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
        return api.get("/categories/", { auth: false });
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
        const delay = (ms = 1200) => new Promise((res) => setTimeout(res, ms));
        await delay();
        return null;
      },
      /**
       * Stop / terminate a running instance.
       * TODO: Replace with DELETE /api/challenges/:id/instances/active
       */
      async stopInstance(challengeId) {
        const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));
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
        if (status && status !== "all") params.set("status", status);
        if (search) params.set("search", search);
        const qs = params.toString();
        return api.get(`/admin/challenges/${qs ? `?${qs}` : ""}`);
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
        return api.post("/admin/challenges/", data);
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
      async setChallengeStatus(id, status, publishAt = "") {
        return api.patch(`/admin/challenges/${id}/status/`, {
          status,
          publishAt: publishAt || ""
        });
      },
      /**
       * Upload an attachment to a challenge. Admin only.
       * POST /api/v1/admin/challenges/:id/attachments/
       */
      async uploadAttachment(id, file, name = "") {
        const formData = new FormData();
        formData.append("file", file);
        if (name) formData.append("name", name);
        return api.post(`/admin/challenges/${id}/attachments/`, formData);
      },
      /**
       * Delete an attachment from a challenge. Admin only.
       * DELETE /api/v1/admin/challenges/:id/attachments/:attachmentId/
       */
      async deleteAttachment(id, attachmentId) {
        return api.delete(`/admin/challenges/${id}/attachments/${attachmentId}/`);
      }
    };
    challengeService_default = challengeService;
  }
});

// src/services/leaderboardService.js
var leaderboardService_exports = {};
__export(leaderboardService_exports, {
  default: () => leaderboardService_default,
  leaderboardService: () => leaderboardService
});
function boardQuery({ period, category, page, limit } = {}) {
  const params = new URLSearchParams();
  if (period && period !== "all") params.set("period", period);
  if (category && category !== "All") params.set("category", category);
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
async function fetchBoard(params = {}) {
  const data = await api.get(`/leaderboard/${boardQuery(params)}`, { auth: false });
  return data.results ?? data;
}
var leaderboardService, leaderboardService_default;
var init_leaderboardService = __esm({
  "src/services/leaderboardService.js"() {
    init_api();
    leaderboardService = {
      /**
       * All-time global leaderboard.
       * GET /api/v1/leaderboard/?period=all
       */
      async getGlobalLeaderboard(params = {}) {
        return fetchBoard({ ...params, period: "all" });
      },
      /**
       * Trailing seven-day leaderboard.
       * GET /api/v1/leaderboard/?period=week
       */
      async getWeeklyLeaderboard(params = {}) {
        return fetchBoard({ ...params, period: "week" });
      },
      /**
       * Category-scoped leaderboard (points earned on one category's challenges).
       * GET /api/v1/leaderboard/?category=<id|name>
       */
      async getCategoryLeaderboard(params = {}) {
        return fetchBoard({ ...params, period: "all" });
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
        if (period && period !== "all") params.set("period", period);
        if (category && category !== "All") params.set("category", category);
        const qs = params.toString();
        return api.get(`/leaderboard/me/${qs ? `?${qs}` : ""}`);
      }
    };
    leaderboardService_default = leaderboardService;
  }
});

// scripts/challenges-harness/entry.mjs
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
  dispatchEvent: (evt) => {
    dispatchedEvents.push(evt);
    return true;
  },
  addEventListener: (name, cb) => {
    (listeners[name] ||= []).push(cb);
  },
  removeEventListener: () => {
  }
};
var calls = [];
var queue = [];
var jsonResponse = (res) => ({
  ok: res.status >= 200 && res.status < 300,
  status: res.status,
  text: async () => res.body == null ? "" : JSON.stringify(res.body),
  json: async () => res.body
});
var fetchStub = async (url, options = {}) => {
  calls.push({
    url,
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body === void 0 ? void 0 : JSON.parse(options.body)
  });
  const res = queue.shift() || { status: 200, body: {} };
  return jsonResponse(res);
};
globalThis.localStorage = localStorage2;
globalThis.window = window2;
globalThis.fetch = fetchStub;
var { challengeService: challengeService2 } = await Promise.resolve().then(() => (init_challengeService(), challengeService_exports));
var { leaderboardService: leaderboardService2 } = await Promise.resolve().then(() => (init_leaderboardService(), leaderboardService_exports));
var { api: api2, tokenStore: tokenStore2, ApiError: ApiError2 } = await Promise.resolve().then(() => (init_api(), api_exports));
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
var withToken = (t = "tok123") => tokenStore2.setTokens({ access: t });
function resetEnv() {
  calls = [];
  queue = [];
  store.clear();
  dispatchedEvents.length = 0;
}
test("getChallenges GETs the public list endpoint", async () => {
  queueResponses({ status: 200, body: [] });
  const data = await challengeService2.getChallenges();
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/challenges/`);
  assert(Array.isArray(data));
});
test("getChallenges forwards category filter", async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService2.getChallenges({ category: "Web Exploitation" });
  assertEqual(lastCall().url, `${BASE}/challenges/?category=Web+Exploitation`);
});
test("getChallenges forwards difficulty filter", async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService2.getChallenges({ difficulty: "Hard" });
  assertEqual(lastCall().url, `${BASE}/challenges/?difficulty=Hard`);
});
test("getChallenges forwards search", async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService2.getChallenges({ search: "sql injection" });
  assertEqual(lastCall().url, `${BASE}/challenges/?search=sql+injection`);
});
test("getChallenges omits All category", async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService2.getChallenges({ category: "All" });
  assertEqual(lastCall().url, `${BASE}/challenges/`);
});
test("getChallenges sends no Authorization header (public endpoint)", async () => {
  withToken("abc.def.ghi");
  queueResponses({ status: 200, body: [] });
  await challengeService2.getChallenges();
  assert(lastCall().headers.Authorization === void 0, "expected no auth header on public endpoint");
});
test("getChallengeById GETs the detail endpoint", async () => {
  queueResponses({ status: 200, body: { id: 42 } });
  const data = await challengeService2.getChallengeById(42);
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/challenges/42/`);
  assertEqual(data.id, 42);
});
test("getCategories GETs the categories endpoint", async () => {
  queueResponses({ status: 200, body: [] });
  const data = await challengeService2.getCategories();
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/categories/`);
  assert(Array.isArray(data));
});
test("getAllChallenges GETs the admin list endpoint", async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService2.getAllChallenges();
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/admin/challenges/`);
});
test("getAllChallenges forwards status filter", async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService2.getAllChallenges({ status: "draft" });
  assertEqual(lastCall().url, `${BASE}/admin/challenges/?status=draft`);
});
test('getAllChallenges omits "all" status', async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService2.getAllChallenges({ status: "all" });
  assertEqual(lastCall().url, `${BASE}/admin/challenges/`);
});
test("getAllChallenges forwards search", async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService2.getAllChallenges({ search: "sqli" });
  assertEqual(lastCall().url, `${BASE}/admin/challenges/?search=sqli`);
});
test("createChallenge POSTs a JSON body", async () => {
  withToken();
  queueResponses({ status: 201, body: { id: 99, title: "New One" } });
  const data = await challengeService2.createChallenge({
    title: "New One",
    category: "Web",
    difficulty: "Easy",
    points: 100,
    flag: "CTF{test_flag}"
  });
  assertEqual(lastCall().method, "POST");
  assertEqual(lastCall().url, `${BASE}/admin/challenges/`);
  assertEqual(lastCall().headers["Content-Type"], "application/json");
  assertEqual(lastCall().body.title, "New One");
  assertEqual(data.id, 99);
});
test("updateChallenge PATCHes fields to the detail URL", async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 7, points: 999 } });
  const data = await challengeService2.updateChallenge(7, { points: 999 });
  assertEqual(lastCall().method, "PATCH");
  assertEqual(lastCall().url, `${BASE}/admin/challenges/7/`);
  assertEqual(lastCall().body.points, 999);
  assertEqual(data.points, 999);
});
test("deleteChallenge sends DELETE", async () => {
  withToken();
  queueResponses({ status: 204, body: null });
  const data = await challengeService2.deleteChallenge(7);
  assertEqual(lastCall().method, "DELETE");
  assertEqual(lastCall().url, `${BASE}/admin/challenges/7/`);
  assertEqual(data, null);
});
test("setChallengeStatus PATCHes to the status endpoint", async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 7, status: "published" } });
  const data = await challengeService2.setChallengeStatus(7, "published");
  assertEqual(lastCall().method, "PATCH");
  assertEqual(lastCall().url, `${BASE}/admin/challenges/7/status/`);
  assertEqual(lastCall().body.status, "published");
  assertEqual(data.status, "published");
});
test("setChallengeStatus sends a publishAt when provided", async () => {
  withToken();
  queueResponses({ status: 200, body: {} });
  await challengeService2.setChallengeStatus(7, "scheduled", "2026-06-01T12:00");
  assertEqual(lastCall().body.publishAt, "2026-06-01T12:00");
});
test("setChallengeStatus defaults publishAt to empty string", async () => {
  withToken();
  queueResponses({ status: 200, body: {} });
  await challengeService2.setChallengeStatus(7, "draft");
  assertEqual(lastCall().body.publishAt, "");
});
test("the Bearer token is attached when present", async () => {
  withToken("admin.token.here");
  queueResponses({ status: 200, body: [] });
  await challengeService2.getAllChallenges();
  assertEqual(lastCall().headers.Authorization, "Bearer admin.token.here");
});
test("403 becomes an ApiError with a permission message", async () => {
  withToken();
  queueResponses({ status: 403, body: null });
  let err;
  try {
    await challengeService2.getAllChallenges();
  } catch (e) {
    err = e;
  }
  assert(err instanceof ApiError2, "expected an ApiError");
  assertEqual(err.status, 403);
  assert(/permission/i.test(err.message), `unexpected message: ${err.message}`);
});
test("400 surfaces the validation message", async () => {
  withToken();
  queueResponses({ status: 400, body: { flag: ["The flag must be of the form CTF{...}."] } });
  let err;
  try {
    await challengeService2.createChallenge({ flag: "not-a-flag" });
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 400);
  assert(/flag/i.test(err.message), `unexpected message: ${err.message}`);
});
test("404 becomes an ApiError without leaking internals", async () => {
  withToken();
  queueResponses({ status: 404, body: null });
  let err;
  try {
    await challengeService2.getChallengeByIdAdmin(999);
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 404);
  assert(/not found/i.test(err.message), `unexpected message: ${err.message}`);
});
test("401 with no refresh token clears the session and emits auth:expired", async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try {
    await challengeService2.getAllChallenges();
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 401);
  assertEqual(calls.length, 1, "should not retry without a refresh token");
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, "auth:expired");
});
test("submitFlag POSTs the flag to the submit endpoint", async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: true, alreadySolved: false, points: 150, message: "Correct flag!" } });
  const data = await challengeService2.submitFlag(7, "CTF{answer}");
  assertEqual(lastCall().method, "POST");
  assertEqual(lastCall().url, `${BASE}/challenges/7/submit/`);
  assertEqual(lastCall().headers["Content-Type"], "application/json");
  assertEqual(lastCall().body.flag, "CTF{answer}");
  assertEqual(data.correct, true);
  assertEqual(data.points, 150);
});
test("submitFlag attaches the Bearer token", async () => {
  withToken("player.token.here");
  queueResponses({ status: 200, body: { correct: false, alreadySolved: false, points: 0, message: "Incorrect flag." } });
  await challengeService2.submitFlag(7, "CTF{nope}");
  assertEqual(lastCall().headers.Authorization, "Bearer player.token.here");
});
test("submitFlag forwards an incorrect verdict unchanged", async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: false, alreadySolved: false, points: 0, message: "Incorrect flag. Keep investigating." } });
  const data = await challengeService2.submitFlag(7, "CTF{nope}");
  assertEqual(data.correct, false);
  assertEqual(data.alreadySolved, false);
  assertEqual(data.points, 0);
});
test("submitFlag forwards an already-solved verdict", async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: true, alreadySolved: true, points: 0, message: "You have already solved this challenge." } });
  const data = await challengeService2.submitFlag(7, "CTF{answer}");
  assertEqual(data.correct, true);
  assertEqual(data.alreadySolved, true);
  assertEqual(data.points, 0);
});
test("submitFlag forwards the net reward after hint spending", async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: true, alreadySolved: false, points: 150, hintCost: 30, netPoints: 120, message: "Correct flag! +120 points (150 minus 30 spent on hints)." } });
  const data = await challengeService2.submitFlag(7, "CTF{answer}");
  assertEqual(data.points, 150);
  assertEqual(data.hintCost, 30);
  assertEqual(data.netPoints, 120);
});
test("submitFlag surfaces a 400 validation error", async () => {
  withToken();
  queueResponses({ status: 400, body: { flag: ["A flag is required."] } });
  let err;
  try {
    await challengeService2.submitFlag(7, "");
  } catch (e) {
    err = e;
  }
  assert(err instanceof ApiError2, "expected an ApiError");
  assertEqual(err.status, 400);
  assert(/flag/i.test(err.message), `unexpected message: ${err.message}`);
});
test("submitFlag surfaces a 404 for a hidden or removed challenge", async () => {
  withToken();
  queueResponses({ status: 404, body: { detail: "No Challenge matches the given query." } });
  let err;
  try {
    await challengeService2.submitFlag(999, "CTF{x}");
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 404);
});
test("submitFlag surfaces a 429 throttle response", async () => {
  withToken();
  queueResponses({ status: 429, body: { detail: "Request was throttled. Expected available in 42 seconds." } });
  let err;
  try {
    await challengeService2.submitFlag(7, "CTF{x}");
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 429);
  assert(/throttled/i.test(err.message), `unexpected message: ${err.message}`);
});
test("submitFlag clears the session and emits auth:expired on a dead 401", async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try {
    await challengeService2.submitFlag(7, "CTF{x}");
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 401);
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, "auth:expired");
});
test("revealHint POSTs to the reveal endpoint with an empty body", async () => {
  withToken();
  queueResponses({ status: 200, body: { revealed: true, alreadyUnlocked: false, hint: { id: 3, order: 0, cost: 30, text: "The secret is 42" }, pointsSpent: 30, remainingPoints: 70, message: "Hint unlocked." } });
  const data = await challengeService2.revealHint(7, 3);
  assertEqual(lastCall().method, "POST");
  assertEqual(lastCall().url, `${BASE}/challenges/7/hints/3/reveal/`);
  assertEqual(lastCall().headers["Content-Type"], "application/json");
  assertEqual(lastCall().headers.Authorization, "Bearer tok123");
  assertEqual(typeof lastCall().body, "object");
  assertEqual(data.revealed, true);
  assertEqual(data.hint.text, "The secret is 42");
  assertEqual(data.remainingPoints, 70);
});
test("revealHint forwards the already-unlocked verdict unchanged", async () => {
  withToken();
  queueResponses({ status: 200, body: { revealed: true, alreadyUnlocked: true, hint: { id: 3, order: 0, cost: 30, text: "The secret is 42" }, pointsSpent: 0, remainingPoints: 70, message: "You have already unlocked this hint." } });
  const data = await challengeService2.revealHint(7, 3);
  assertEqual(data.alreadyUnlocked, true);
  assertEqual(data.pointsSpent, 0);
  assertEqual(data.remainingPoints, 70);
});
test("revealHint surfaces a 400 insufficient-points error", async () => {
  withToken();
  queueResponses({ status: 400, body: { detail: "Not enough points to unlock this hint. It costs 30 and you have 10.", required: 30, available: 10 } });
  let err;
  try {
    await challengeService2.revealHint(7, 3);
  } catch (e) {
    err = e;
  }
  assert(err instanceof ApiError2, "expected an ApiError");
  assertEqual(err.status, 400);
  assert(/not enough points/i.test(err.message), `unexpected message: ${err.message}`);
});
test("revealHint surfaces a 404 for an invalid or foreign hint", async () => {
  withToken();
  queueResponses({ status: 404, body: { detail: "No ChallengeHint matches the given query." } });
  let err;
  try {
    await challengeService2.revealHint(7, 999);
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 404);
});
test("revealHint surfaces a 429 throttle response", async () => {
  withToken();
  queueResponses({ status: 429, body: { detail: "Request was throttled. Expected available in 30 seconds." } });
  let err;
  try {
    await challengeService2.revealHint(7, 3);
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 429);
  assert(/throttled/i.test(err.message), `unexpected message: ${err.message}`);
});
test("revealHint clears the session and emits auth:expired on a dead 401", async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try {
    await challengeService2.revealHint(7, 3);
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 401);
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, "auth:expired");
});
var row = {
  id: 1,
  username: "neo",
  points: 320,
  solved: 4,
  accuracy: 80,
  meta: "",
  rank: 1
};
test("getGlobalLeaderboard GETs the public board and unwraps results", async () => {
  queueResponses({ status: 200, body: { count: 1, next: null, previous: null, results: [row] } });
  const data = await leaderboardService2.getGlobalLeaderboard({ limit: 5 });
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/leaderboard/?limit=5`);
  assert(Array.isArray(data), "expected an array of rows");
  assertEqual(data[0].username, "neo");
  assert(lastCall().headers.Authorization === void 0, "expected no auth header on the public board");
});
test("getWeeklyLeaderboard scopes the request to the trailing week", async () => {
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, results: [] } });
  const data = await leaderboardService2.getWeeklyLeaderboard();
  assertEqual(lastCall().url, `${BASE}/leaderboard/?period=week`);
  assertEqual(data.length, 0);
});
test("getCategoryLeaderboard passes the selected category", async () => {
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, results: [] } });
  await leaderboardService2.getCategoryLeaderboard({ category: 7 });
  assertEqual(lastCall().url, `${BASE}/leaderboard/?category=7`);
  resetEnv();
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, results: [] } });
  await leaderboardService2.getCategoryLeaderboard({ category: "All" });
  assertEqual(lastCall().url, `${BASE}/leaderboard/`);
});
test("getLeaderboardPage returns the raw paginated envelope", async () => {
  queueResponses({ status: 200, body: { count: 2, next: "http://x/?page=3", previous: null, results: [row] } });
  const page = await leaderboardService2.getLeaderboardPage({ page: 2, limit: 10 });
  assertEqual(lastCall().url, `${BASE}/leaderboard/?page=2&limit=10`);
  assertEqual(page.count, 2);
  assertEqual(page.next, "http://x/?page=3");
});
test("getMyRank calls the authenticated me endpoint with a Bearer token", async () => {
  withToken();
  queueResponses({ status: 200, body: { ...row, username: "me", rank: 3 } });
  const me = await leaderboardService2.getMyRank();
  assertEqual(lastCall().url, `${BASE}/leaderboard/me/`);
  assertEqual(lastCall().headers.Authorization, "Bearer tok123");
  assertEqual(me.rank, 3);
  assertEqual(me.username, "me");
});
test("getMyRank honours the active period and category filters", async () => {
  withToken();
  queueResponses({ status: 200, body: { ...row, rank: null } });
  await leaderboardService2.getMyRank({ period: "week", category: 4 });
  assertEqual(lastCall().url, `${BASE}/leaderboard/me/?period=week&category=4`);
});
test("getGlobalLeaderboard surfaces a server error", async () => {
  queueResponses({ status: 503, body: { detail: "Service unavailable." } });
  let err;
  try {
    await leaderboardService2.getGlobalLeaderboard();
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 503);
});
test("getMyRank clears the session and emits auth:expired on a dead 401", async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try {
    await leaderboardService2.getMyRank();
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 401);
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, "auth:expired");
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
