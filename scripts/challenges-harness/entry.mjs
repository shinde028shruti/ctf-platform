/**
 * Service-level harness for the Challenges feature.
 *
 * Runs the REAL src/services/challengeService.js and src/services/api.js in
 * Node against a stubbed fetch + localStorage, so URL construction, HTTP
 * methods, payloads, auth headers, query params and the 200/400/401/403/404
 * branches are all exercised without a backend or a browser.
 *
 * Bundled by run.mjs with esbuild, which also defines import.meta.env so
 * api.js resolves its base URL exactly as Vite would.
 */

/* ------------------------------------------------------------------ */
/* Fake browser environment                                            */
/* ------------------------------------------------------------------ */

const store = new Map();

const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => { store.clear(); },
};

const dispatchedEvents = [];
const listeners = {};

const window = {
  localStorage,
  dispatchEvent: (evt) => { dispatchedEvents.push(evt); return true; },
  addEventListener: (name, cb) => { (listeners[name] ||= []).push(cb); },
  removeEventListener: () => {},
};

let calls = [];
let queue = [];

const jsonResponse = (res) => ({
  ok: res.status >= 200 && res.status < 300,
  status: res.status,
  text: async () => (res.body == null ? '' : JSON.stringify(res.body)),
  json: async () => res.body,
});

const fetchStub = async (url, options = {}) => {
  const rawBody = options.body;
  let body;
  if (rawBody === undefined) {
    body = undefined;
  } else if (typeof FormData !== 'undefined' && rawBody instanceof FormData) {
    // Multipart uploads have no JSON body; record the field names instead. The
    // browser would set the Content-Type boundary itself.
    body = { __formData: true, fields: [...rawBody.keys()] };
  } else {
    body = JSON.parse(rawBody);
  }
  calls.push({
    url,
    method: options.method || 'GET',
    headers: options.headers || {},
    body,
  });
  const res = queue.shift() || { status: 200, body: {} };
  return jsonResponse(res);
};

globalThis.localStorage = localStorage;
globalThis.window = window;
globalThis.fetch = fetchStub;

/* ------------------------------------------------------------------ */
/* Import the real modules (after globals exist)                       */
/* ------------------------------------------------------------------ */

const { challengeService } = await import('../../src/services/challengeService.js');
const { leaderboardService } = await import('../../src/services/leaderboardService.js');
const { statsService } = await import('../../src/services/statsService.js');
const { authService } = await import('../../src/services/authService.js');
const { notificationService } = await import('../../src/services/notificationService.js');
const { announcementService } = await import('../../src/services/announcementService.js');
const {
  achievementService, describeRule, criteriaMeta, CRITERIA_TYPES,
} = await import('../../src/services/achievementService.js');
const { api, tokenStore, ApiError } = await import('../../src/services/api.js');
const { resolveFocusAreas, EMPTY_FOCUS_AREAS } = await import('../../src/utils/focusAreas.js');
const { activityKey } = await import('../../src/utils/activity.js');

const BASE = 'https://api.example.test/api/v1';

/* ------------------------------------------------------------------ */
/* Tiny test runner                                                    */
/* ------------------------------------------------------------------ */

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
const assertEqual = (actual, expected, msg) => {
  if (actual !== expected) {
    throw new Error(`${msg || 'expected equal'}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  }
};

const lastCall = () => calls[calls.length - 1];

const queueResponses = (...responses) => { queue = responses; };

const withToken = (t = 'tok123') => tokenStore.setTokens({ access: t });

function resetEnv() {
  calls = [];
  queue = [];
  store.clear();
  dispatchedEvents.length = 0;
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

test('getChallenges GETs the public list endpoint', async () => {
  queueResponses({ status: 200, body: [] });
  const data = await challengeService.getChallenges();
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/challenges/`);
  assert(Array.isArray(data));
});

test('getChallenges forwards category filter', async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService.getChallenges({ category: 'Web Exploitation' });
  assertEqual(lastCall().url, `${BASE}/challenges/?category=Web+Exploitation`);
});

test('getChallenges forwards difficulty filter', async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService.getChallenges({ difficulty: 'Hard' });
  assertEqual(lastCall().url, `${BASE}/challenges/?difficulty=Hard`);
});

test('getChallenges forwards search', async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService.getChallenges({ search: 'sql injection' });
  assertEqual(lastCall().url, `${BASE}/challenges/?search=sql+injection`);
});

test('getChallenges omits All category', async () => {
  queueResponses({ status: 200, body: [] });
  await challengeService.getChallenges({ category: 'All' });
  assertEqual(lastCall().url, `${BASE}/challenges/`);
});

test('getChallenges sends no Authorization header (public endpoint)', async () => {
  withToken('abc.def.ghi');
  queueResponses({ status: 200, body: [] });
  await challengeService.getChallenges();
  assert(lastCall().headers.Authorization === undefined, 'expected no auth header on public endpoint');
});

test('getChallengeById GETs the detail endpoint', async () => {
  queueResponses({ status: 200, body: { id: 42 } });
  const data = await challengeService.getChallengeById(42);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/challenges/42/`);
  assertEqual(data.id, 42);
});

test('getCategories GETs the categories endpoint', async () => {
  queueResponses({ status: 200, body: [] });
  const data = await challengeService.getCategories();
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/categories/`);
  assert(Array.isArray(data));
});

test('getAllChallenges GETs the admin list endpoint', async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService.getAllChallenges();
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/admin/challenges/`);
});

test('getAllChallenges forwards status filter', async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService.getAllChallenges({ status: 'draft' });
  assertEqual(lastCall().url, `${BASE}/admin/challenges/?status=draft`);
});

test('getAllChallenges omits "all" status', async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService.getAllChallenges({ status: 'all' });
  assertEqual(lastCall().url, `${BASE}/admin/challenges/`);
});

test('getAllChallenges forwards search', async () => {
  withToken();
  queueResponses({ status: 200, body: [] });
  await challengeService.getAllChallenges({ search: 'sqli' });
  assertEqual(lastCall().url, `${BASE}/admin/challenges/?search=sqli`);
});

test('createChallenge POSTs a JSON body', async () => {
  withToken();
  queueResponses({ status: 201, body: { id: 99, title: 'New One' } });
  const data = await challengeService.createChallenge({
    title: 'New One',
    category: 'Web',
    difficulty: 'Easy',
    points: 100,
    flag: 'CTF{test_flag}',
  });
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/admin/challenges/`);
  assertEqual(lastCall().headers['Content-Type'], 'application/json');
  assertEqual(lastCall().body.title, 'New One');
  assertEqual(data.id, 99);
});

test('updateChallenge PATCHes fields to the detail URL', async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 7, points: 999 } });
  const data = await challengeService.updateChallenge(7, { points: 999 });
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/admin/challenges/7/`);
  assertEqual(lastCall().body.points, 999);
  assertEqual(data.points, 999);
});

test('deleteChallenge sends DELETE', async () => {
  withToken();
  queueResponses({ status: 204, body: null });
  const data = await challengeService.deleteChallenge(7);
  assertEqual(lastCall().method, 'DELETE');
  assertEqual(lastCall().url, `${BASE}/admin/challenges/7/`);
  assertEqual(data, null);
});

test('setChallengeStatus PATCHes to the status endpoint', async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 7, status: 'published' } });
  const data = await challengeService.setChallengeStatus(7, 'published');
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/admin/challenges/7/status/`);
  assertEqual(lastCall().body.status, 'published');
  assertEqual(data.status, 'published');
});

test('setChallengeStatus sends a publishAt when provided', async () => {
  withToken();
  queueResponses({ status: 200, body: {} });
  await challengeService.setChallengeStatus(7, 'scheduled', '2026-06-01T12:00');
  assertEqual(lastCall().body.publishAt, '2026-06-01T12:00');
});

test('setChallengeStatus defaults publishAt to empty string', async () => {
  withToken();
  queueResponses({ status: 200, body: {} });
  await challengeService.setChallengeStatus(7, 'draft');
  assertEqual(lastCall().body.publishAt, '');
});

test('the Bearer token is attached when present', async () => {
  withToken('admin.token.here');
  queueResponses({ status: 200, body: [] });
  await challengeService.getAllChallenges();
  assertEqual(lastCall().headers.Authorization, 'Bearer admin.token.here');
});

test('403 becomes an ApiError with a permission message', async () => {
  withToken();
  queueResponses({ status: 403, body: null });
  let err;
  try { await challengeService.getAllChallenges(); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(err.status, 403);
  assert(/permission/i.test(err.message), `unexpected message: ${err.message}`);
});

test('400 surfaces the validation message', async () => {
  withToken();
  queueResponses({ status: 400, body: { flag: ['The flag must be of the form CTF{...}.'] } });
  let err;
  try { await challengeService.createChallenge({ flag: 'not-a-flag' }); } catch (e) { err = e; }
  assertEqual(err.status, 400);
  assert(/flag/i.test(err.message), `unexpected message: ${err.message}`);
});

test('404 becomes an ApiError without leaking internals', async () => {
  withToken();
  queueResponses({ status: 404, body: null });
  let err;
  try { await challengeService.getChallengeByIdAdmin(999); } catch (e) { err = e; }
  assertEqual(err.status, 404);
  assert(/not found/i.test(err.message), `unexpected message: ${err.message}`);
});

test('401 with no refresh token clears the session and emits auth:expired', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await challengeService.getAllChallenges(); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(calls.length, 1, 'should not retry without a refresh token');
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

/* ------------------------------------------------------------------ */
/* Flag submission                                                     */
/* ------------------------------------------------------------------ */

test('submitFlag POSTs the flag to the submit endpoint', async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: true, alreadySolved: false, points: 150, message: 'Correct flag!' } });
  const data = await challengeService.submitFlag(7, 'CTF{answer}');
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/challenges/7/submit/`);
  assertEqual(lastCall().headers['Content-Type'], 'application/json');
  assertEqual(lastCall().body.flag, 'CTF{answer}');
  assertEqual(data.correct, true);
  assertEqual(data.points, 150);
});

test('submitFlag attaches the Bearer token', async () => {
  withToken('player.token.here');
  queueResponses({ status: 200, body: { correct: false, alreadySolved: false, points: 0, message: 'Incorrect flag.' } });
  await challengeService.submitFlag(7, 'CTF{nope}');
  assertEqual(lastCall().headers.Authorization, 'Bearer player.token.here');
});

test('submitFlag forwards an incorrect verdict unchanged', async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: false, alreadySolved: false, points: 0, message: 'Incorrect flag. Keep investigating.' } });
  const data = await challengeService.submitFlag(7, 'CTF{nope}');
  assertEqual(data.correct, false);
  assertEqual(data.alreadySolved, false);
  assertEqual(data.points, 0);
});

test('submitFlag forwards an already-solved verdict', async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: true, alreadySolved: true, points: 0, message: 'You have already solved this challenge.' } });
  const data = await challengeService.submitFlag(7, 'CTF{answer}');
  assertEqual(data.correct, true);
  assertEqual(data.alreadySolved, true);
  assertEqual(data.points, 0);
});

test('submitFlag forwards the net reward after hint spending', async () => {
  withToken();
  queueResponses({ status: 200, body: { correct: true, alreadySolved: false, points: 150, hintCost: 30, netPoints: 120, message: 'Correct flag! +120 points (150 minus 30 spent on hints).' } });
  const data = await challengeService.submitFlag(7, 'CTF{answer}');
  assertEqual(data.points, 150);
  assertEqual(data.hintCost, 30);
  assertEqual(data.netPoints, 120);
});

test('submitFlag surfaces a 400 validation error', async () => {
  withToken();
  queueResponses({ status: 400, body: { flag: ['A flag is required.'] } });
  let err;
  try { await challengeService.submitFlag(7, ''); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(err.status, 400);
  assert(/flag/i.test(err.message), `unexpected message: ${err.message}`);
});

test('submitFlag surfaces a 404 for a hidden or removed challenge', async () => {
  withToken();
  queueResponses({ status: 404, body: { detail: 'No Challenge matches the given query.' } });
  let err;
  try { await challengeService.submitFlag(999, 'CTF{x}'); } catch (e) { err = e; }
  assertEqual(err.status, 404);
});

test('submitFlag surfaces a 429 throttle response', async () => {
  withToken();
  queueResponses({ status: 429, body: { detail: 'Request was throttled. Expected available in 42 seconds.' } });
  let err;
  try { await challengeService.submitFlag(7, 'CTF{x}'); } catch (e) { err = e; }
  assertEqual(err.status, 429);
  assert(/throttled/i.test(err.message), `unexpected message: ${err.message}`);
});

test('submitFlag clears the session and emits auth:expired on a dead 401', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await challengeService.submitFlag(7, 'CTF{x}'); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

/* ------------------------------------------------------------------ */
/* Hint reveal                                                         */
/* ------------------------------------------------------------------ */

test('revealHint POSTs to the reveal endpoint with an empty body', async () => {
  withToken();
  queueResponses({ status: 200, body: { revealed: true, alreadyUnlocked: false, hint: { id: 3, order: 0, cost: 30, text: 'The secret is 42' }, pointsSpent: 30, remainingPoints: 70, message: 'Hint unlocked.' } });
  const data = await challengeService.revealHint(7, 3);
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/challenges/7/hints/3/reveal/`);
  assertEqual(lastCall().headers['Content-Type'], 'application/json');
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  assertEqual(typeof lastCall().body, 'object');
  assertEqual(data.revealed, true);
  assertEqual(data.hint.text, 'The secret is 42');
  assertEqual(data.remainingPoints, 70);
});

test('revealHint forwards the already-unlocked verdict unchanged', async () => {
  withToken();
  queueResponses({ status: 200, body: { revealed: true, alreadyUnlocked: true, hint: { id: 3, order: 0, cost: 30, text: 'The secret is 42' }, pointsSpent: 0, remainingPoints: 70, message: 'You have already unlocked this hint.' } });
  const data = await challengeService.revealHint(7, 3);
  assertEqual(data.alreadyUnlocked, true);
  assertEqual(data.pointsSpent, 0);
  assertEqual(data.remainingPoints, 70);
});

test('revealHint surfaces a 400 insufficient-points error', async () => {
  withToken();
  queueResponses({ status: 400, body: { detail: 'Not enough points to unlock this hint. It costs 30 and you have 10.', required: 30, available: 10 } });
  let err;
  try { await challengeService.revealHint(7, 3); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(err.status, 400);
  assert(/not enough points/i.test(err.message), `unexpected message: ${err.message}`);
});

test('revealHint surfaces a 404 for an invalid or foreign hint', async () => {
  withToken();
  queueResponses({ status: 404, body: { detail: 'No ChallengeHint matches the given query.' } });
  let err;
  try { await challengeService.revealHint(7, 999); } catch (e) { err = e; }
  assertEqual(err.status, 404);
});

test('revealHint surfaces a 429 throttle response', async () => {
  withToken();
  queueResponses({ status: 429, body: { detail: 'Request was throttled. Expected available in 30 seconds.' } });
  let err;
  try { await challengeService.revealHint(7, 3); } catch (e) { err = e; }
  assertEqual(err.status, 429);
  assert(/throttled/i.test(err.message), `unexpected message: ${err.message}`);
});

test('revealHint clears the session and emits auth:expired on a dead 401', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await challengeService.revealHint(7, 3); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

/* ------------------------------------------------------------------ */
/* Leaderboard                                                         */
/* ------------------------------------------------------------------ */

const row = {
  id: 1, username: 'neo', points: 320, solved: 4, accuracy: 80, meta: '', rank: 1,
};

test('getGlobalLeaderboard GETs the public board and unwraps results', async () => {
  queueResponses({ status: 200, body: { count: 1, next: null, previous: null, results: [row] } });
  const data = await leaderboardService.getGlobalLeaderboard({ limit: 5 });
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/leaderboard/?limit=5`);
  assert(Array.isArray(data), 'expected an array of rows');
  assertEqual(data[0].username, 'neo');
  // The board is public: no score is ever sent, and no auth header is attached.
  assert(lastCall().headers.Authorization === undefined, 'expected no auth header on the public board');
});

test('getWeeklyLeaderboard scopes the request to the trailing week', async () => {
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, results: [] } });
  const data = await leaderboardService.getWeeklyLeaderboard();
  assertEqual(lastCall().url, `${BASE}/leaderboard/?period=week`);
  assertEqual(data.length, 0);
});

test('getCategoryLeaderboard passes the selected category', async () => {
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, results: [] } });
  await leaderboardService.getCategoryLeaderboard({ category: 7 });
  assertEqual(lastCall().url, `${BASE}/leaderboard/?category=7`);

  resetEnv();
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, results: [] } });
  await leaderboardService.getCategoryLeaderboard({ category: 'All' });
  assertEqual(lastCall().url, `${BASE}/leaderboard/`);
});

test('getLeaderboardPage returns the raw paginated envelope', async () => {
  queueResponses({ status: 200, body: { count: 2, next: 'http://x/?page=3', previous: null, results: [row] } });
  const page = await leaderboardService.getLeaderboardPage({ page: 2, limit: 10 });
  assertEqual(lastCall().url, `${BASE}/leaderboard/?page=2&limit=10`);
  assertEqual(page.count, 2);
  assertEqual(page.next, 'http://x/?page=3');
});

test('getMyRank calls the authenticated me endpoint with a Bearer token', async () => {
  withToken();
  queueResponses({ status: 200, body: { ...row, username: 'me', rank: 3 } });
  const me = await leaderboardService.getMyRank();
  assertEqual(lastCall().url, `${BASE}/leaderboard/me/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  assertEqual(me.rank, 3);
  assertEqual(me.username, 'me');
});

test('getMyRank honours the active period and category filters', async () => {
  withToken();
  queueResponses({ status: 200, body: { ...row, rank: null } });
  await leaderboardService.getMyRank({ period: 'week', category: 4 });
  assertEqual(lastCall().url, `${BASE}/leaderboard/me/?period=week&category=4`);
});

test('getGlobalLeaderboard surfaces a server error', async () => {
  queueResponses({ status: 503, body: { detail: 'Service unavailable.' } });
  let err;
  try { await leaderboardService.getGlobalLeaderboard(); } catch (e) { err = e; }
  assertEqual(err.status, 503);
});

test('getMyRank clears the session and emits auth:expired on a dead 401', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await leaderboardService.getMyRank(); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

/* ------------------------------------------------------------------ */
/* Per-user statistics                                                 */
/* ------------------------------------------------------------------ */

const statsPayload = {
  points: 70,
  earnedPoints: 100,
  spentOnHints: 30,
  solved: 1,
  accuracy: 75,
  submissions: { total: 4, correct: 3 },
  rank: 12,
  joinDate: '2026-01-04T10:00:00Z',
  solvedChallengeIds: [1],
  categoryProgress: [
    { id: 1, name: 'Web Exploitation', color: '#3b82f6', solved: 1, total: 2, points: 100 },
  ],
  recentActivity: [
    { type: 'hint', challengeId: 2, challengeName: 'Web Two', points: 0, cost: 30, timestamp: '2026-02-01T09:00:00Z' },
    { type: 'solve', challengeId: 1, challengeName: 'Web One', points: 100, cost: 0, timestamp: '2026-02-01T08:00:00Z' },
  ],
  progress: {
    weekly: [{ label: 'Mon', points: 70 }],
    monthly: [{ label: 'Jan 3', points: 70 }],
  },
};

test('getMyStats calls the authenticated stats/me endpoint with a Bearer token', async () => {
  withToken();
  queueResponses({ status: 200, body: statsPayload });
  const data = await statsService.getMyStats();
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/stats/me/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  // The two point figures stay distinct: balance is net of hint spending.
  assertEqual(data.points, 70);
  assertEqual(data.earnedPoints, 100);
  assertEqual(data.spentOnHints, 30);
  assertEqual(data.rank, 12);
  assertEqual(data.categoryProgress[0].name, 'Web Exploitation');
  assertEqual(data.recentActivity[0].type, 'hint');
});

test('getMyStats surfaces a server error', async () => {
  withToken();
  queueResponses({ status: 503, body: { detail: 'Service unavailable.' } });
  let err;
  try { await statsService.getMyStats(); } catch (e) { err = e; }
  assertEqual(err.status, 503);
});

test('getMyStats clears the session and emits auth:expired on a dead 401', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await statsService.getMyStats(); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

/* ------------------------------------------------------------------ */
/* Editable profile (authService)                                      */
/* ------------------------------------------------------------------ */

test('updateProfile PATCHes /auth/me/ with snake_case fields', async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 1, username: 'om', display_name: 'Om', bio: 'b', website: 'https://om.example.com', twitter: '@om', github: 'om' } });
  const u = await authService.updateProfile({
    displayName: 'Om',
    bio: 'b',
    website: 'https://om.example.com',
    twitter: '@om',
    github: 'om',
  });
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/auth/me/`);
  assertEqual(lastCall().headers['Content-Type'], 'application/json');
  // camelCase in the UI becomes snake_case on the wire.
  assertEqual(lastCall().body.display_name, 'Om');
  assertEqual(lastCall().body.github, 'om');
  assertEqual(u.displayName, 'Om');
  assertEqual(u.website, 'https://om.example.com');
});

test('updateProfile sends only the provided fields (partial update)', async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 1, username: 'om' } });
  await authService.updateProfile({ bio: 'only the bio' });
  assertEqual(Object.keys(lastCall().body).length, 1);
  assertEqual(lastCall().body.bio, 'only the bio');
});

test('updateProfile preserves cached stats-derived fields', async () => {
  withToken();
  localStorage.setItem('cyberforge_user', JSON.stringify({
    id: 1, username: 'om', rank: 7, streak: 3,
    categoryStats: { Web: { solved: 1, total: 2, points: 10 } },
  }));
  queueResponses({ status: 200, body: { id: 1, username: 'om', display_name: 'Om' } });
  const u = await authService.updateProfile({ displayName: 'Om' });
  assertEqual(u.rank, 7);
  assertEqual(u.streak, 3);
  assertEqual(u.displayName, 'Om');
});

test('updateProfile does not let the cached displayName shadow the new display_name', async () => {
  withToken();
  // What the app caches right after registration: normaliseUser falls back to
  // the username, so the camelCase alias differs from the server's display_name.
  localStorage.setItem('cyberforge_user', JSON.stringify({
    id: 1, username: 'om', display_name: null, displayName: 'om', rank: 4,
  }));
  queueResponses({ status: 200, body: { id: 1, username: 'om', display_name: 'Om the Great' } });
  const u = await authService.updateProfile({ displayName: 'Om the Great' });
  // The fresh server value must win over the stale cached alias...
  assertEqual(u.displayName, 'Om the Great');
  assertEqual(JSON.parse(localStorage.getItem('cyberforge_user')).displayName, 'Om the Great');
  // ...without dropping stats-derived fields.
  assertEqual(u.rank, 4);
});

test('updateProfile surfaces a validation error', async () => {
  withToken();
  queueResponses({ status: 400, body: { website: ['Enter a valid URL.'] } });
  let err;
  try { await authService.updateProfile({ website: 'nope' }); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(err.status, 400);
  assert(/url/i.test(err.message), `unexpected message: ${err.message}`);
});

test('uploadAvatar PATCHes multipart FormData to /auth/me/', async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 1, username: 'om', avatar: 'http://x/media/avatars/a.png' } });
  const file = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });
  const u = await authService.uploadAvatar(file);
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/auth/me/`);
  assert(lastCall().body.__formData === true, 'expected a FormData body');
  assert(lastCall().body.fields.includes('avatar'), 'expected an avatar field');
  // No explicit Content-Type: the browser sets the multipart boundary.
  assertEqual(lastCall().headers['Content-Type'], undefined);
  assertEqual(u.avatar, 'http://x/media/avatars/a.png');
});

test('uploadAvatar without a file fails before hitting the network', async () => {
  withToken();
  let err;
  try { await authService.uploadAvatar(null); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(calls.length, 0, 'no request should be sent');
});

test('removeAvatar DELETEs /auth/me/avatar/', async () => {
  withToken();
  queueResponses({ status: 200, body: { id: 1, username: 'om', avatar: null } });
  const u = await authService.removeAvatar();
  assertEqual(lastCall().method, 'DELETE');
  assertEqual(lastCall().url, `${BASE}/auth/me/avatar/`);
  assertEqual(u.avatar, null);
});

test('removeAvatar clears the session and emits auth:expired on a dead 401', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await authService.removeAvatar(); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const NOTIF_PAGE = {
  status: 200,
  body: {
    count: 2,
    next: null,
    previous: null,
    results: [
      {
        id: 7, type: 'challenge', title: 'Challenge solved',
        message: 'You solved "X".', destination_url: '/challenges/3',
        is_read: false, created_at: '2026-10-10T10:00:00Z', read_at: null,
      },
      {
        id: 6, type: 'system', title: 'Welcome', message: 'Hi there',
        destination_url: '', is_read: true,
        created_at: '2026-10-09T10:00:00Z', read_at: '2026-10-09T11:00:00Z',
      },
    ],
  },
};

test('getNotifications GETs the paginated list endpoint with the bearer token', async () => {
  withToken();
  queueResponses(NOTIF_PAGE);
  const list = await notificationService.getNotifications();
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/notifications/?limit=50`);
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  assertEqual(list.length, 2);
});

test('getNotifications unwraps the envelope and normalises server fields', async () => {
  withToken();
  queueResponses(NOTIF_PAGE);
  const [first, second] = await notificationService.getNotifications();
  assertEqual(first.id, 7);
  assertEqual(first.read, false);
  assertEqual(first.timestamp, '2026-10-10T10:00:00Z');
  assertEqual(first.destination, '/challenges/3');
  assertEqual(first.icon, 'CheckCircle');
  assertEqual(second.read, true);
  assertEqual(second.icon, 'Bell');
  assertEqual(second.destination, '');
});

test('getNotifications tolerates a bare array body', async () => {
  withToken();
  queueResponses({
    status: 200,
    body: [{
      id: 1, type: 'announcement', title: 't', message: 'm',
      is_read: false, created_at: '2026-01-01T00:00:00Z',
    }],
  });
  const list = await notificationService.getNotifications();
  assertEqual(list.length, 1);
  assertEqual(list[0].destination, '');
  assertEqual(list[0].icon, 'Calendar');
});

test('getUnreadCount GETs the unread-count endpoint', async () => {
  withToken();
  queueResponses({ status: 200, body: { unread_count: 3 } });
  assertEqual(await notificationService.getUnreadCount(), 3);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/notifications/unread-count/`);
});

test('getUnreadCount clamps a missing or negative count to zero', async () => {
  withToken();
  queueResponses({ status: 200, body: {} });
  assertEqual(await notificationService.getUnreadCount(), 0);
  queueResponses({ status: 200, body: { unread_count: -4 } });
  assertEqual(await notificationService.getUnreadCount(), 0);
});

test('markRead PATCHes the read endpoint and returns the updated row', async () => {
  withToken();
  queueResponses({
    status: 200,
    body: {
      id: 7, type: 'challenge', title: 'T', message: 'M',
      destination_url: '/challenges/3', is_read: true,
      created_at: '2026-10-10T10:00:00Z', read_at: '2026-10-11T10:00:00Z',
    },
  });
  const n = await notificationService.markRead(7);
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/notifications/7/read/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  assertEqual(n.id, 7);
  assertEqual(n.read, true);
});

test('markAllRead POSTs the mark-all-read endpoint and returns the number updated', async () => {
  withToken();
  queueResponses({ status: 200, body: { updated: 4, unread_count: 0 } });
  const updated = await notificationService.markAllRead();
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/notifications/mark-all-read/`);
  assertEqual(updated, 4);
});

test('deleteNotification DELETEs the item endpoint', async () => {
  withToken();
  queueResponses({ status: 204, body: null });
  await notificationService.deleteNotification(9);
  assertEqual(lastCall().method, 'DELETE');
  assertEqual(lastCall().url, `${BASE}/notifications/9/`);
});

test('a failed notification load rejects instead of returning mock data', async () => {
  withToken();
  queueResponses({ status: 500, body: null });
  let err;
  try { await notificationService.getNotifications(); } catch (e) { err = e; }
  assert(err, 'expected a rejection, not fabricated data');
  assertEqual(err.status, 500);
});

test('a failed unread-count request rejects rather than inventing a count', async () => {
  withToken();
  queueResponses({ status: 500, body: null });
  let err;
  try { await notificationService.getUnreadCount(); } catch (e) { err = e; }
  assert(err, 'expected a rejection');
});

test('a failed mutation does not resolve (so no false success)', async () => {
  withToken();
  queueResponses({ status: 404, body: null });
  let err;
  try { await notificationService.markRead(1); } catch (e) { err = e; }
  assertEqual(err.status, 404);

  queueResponses({ status: 500, body: null });
  let delErr;
  try { await notificationService.deleteNotification(1); } catch (e) { delErr = e; }
  assertEqual(delErr.status, 500);
});

test('notification calls use the current token (no cross-account caching)', async () => {
  withToken('alice-token');
  queueResponses(NOTIF_PAGE);
  await notificationService.getNotifications();
  assertEqual(calls[0].headers.Authorization, 'Bearer alice-token');

  // A new session token: the service must hold no per-user cache from before.
  withToken('bob-token');
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  const list = await notificationService.getNotifications();
  assertEqual(calls[1].headers.Authorization, 'Bearer bob-token');
  assertEqual(list.length, 0, 'the second account must see only its own list');
});

test('a 401 on a notification call clears the session and emits auth:expired', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await notificationService.getNotifications(); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

test('an expired token is refreshed once and the notification call retried', async () => {
  tokenStore.setTokens({ access: 'old', refresh: 'ref' });
  queueResponses(
    { status: 401, body: null },
    { status: 200, body: { access: 'new' } },
    NOTIF_PAGE,
  );
  const list = await notificationService.getNotifications();
  assertEqual(list.length, 2);
  assertEqual(calls.length, 3, 'expected GET(401) -> refresh -> GET(retry)');
  assertEqual(calls[1].url, `${BASE}/auth/refresh/`);
  assertEqual(calls[2].headers.Authorization, 'Bearer new');
});

test('the notification data module no longer ships mock notifications', async () => {
  const mod = await import('../../src/data/notifications.js');
  assertEqual(mod.notifications, undefined);
  assert(Array.isArray(mod.badges), 'badges must stay for the Profile page');
});

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

const ANN_PUBLIC_ROW = {
  id: 11,
  title: 'Scheduled maintenance',
  body: 'We will be brief.',
  priority: 'maintenance',
  starts_at: '2026-10-17T12:00:00Z',
  ends_at: null,
  published_at: '2026-10-16T09:00:00Z',
};

const ANN_ADMIN_ROW = {
  id: 12,
  title: 'Draft note',
  body: '',
  priority: 'urgent',
  status: 'draft',
  created_by: 3,
  created_by_username: 'admin',
  created_at: '2026-10-16T09:00:00Z',
  updated_at: '2026-10-16T09:00:00Z',
  published_at: null,
  starts_at: null,
  ends_at: null,
};

const LOCAL_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const LOCAL_STAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

test('getActiveAnnouncements GETs the public endpoint without a token', async () => {
  withToken('should-not-be-sent');
  queueResponses({ status: 200, body: [ANN_PUBLIC_ROW] });
  const list = await announcementService.getActiveAnnouncements();
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/announcements/`);
  assertEqual(lastCall().headers.Authorization, undefined);
  assertEqual(list.length, 1);
});

test('public announcements are normalised to the banner shape', async () => {
  queueResponses({ status: 200, body: [ANN_PUBLIC_ROW] });
  const [a] = await announcementService.getActiveAnnouncements();
  assertEqual(a.id, 11);
  assertEqual(a.title, 'Scheduled maintenance');
  assertEqual(a.body, 'We will be brief.');
  assertEqual(a.priority, 'maintenance');
  assertEqual(a.active, true);
  assert(LOCAL_INPUT.test(a.showFrom), `showFrom: ${a.showFrom}`);
  assertEqual(a.showUntil, '');
  assert(LOCAL_STAMP.test(a.createdAt), `createdAt: ${a.createdAt}`);
});

test('an empty public list is returned as an empty array', async () => {
  queueResponses({ status: 200, body: [] });
  const list = await announcementService.getActiveAnnouncements();
  assert(Array.isArray(list));
  assertEqual(list.length, 0);
});

test('a failed public fetch rejects instead of returning seed data', async () => {
  queueResponses({ status: 500, body: null });
  let err;
  try { await announcementService.getActiveAnnouncements(); } catch (e) { err = e; }
  assert(err, 'expected a rejection, not fabricated announcements');
  assertEqual(err.status, 500);
});

test('getAnnouncements loads the admin list with the bearer token', async () => {
  withToken('admin-token');
  queueResponses({ status: 200, body: [ANN_ADMIN_ROW] });
  const list = await announcementService.getAnnouncements();
  assertEqual(lastCall().url, `${BASE}/admin/announcements/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer admin-token');
  assertEqual(list[0].status, 'draft');
  assertEqual(list[0].active, false);
  assertEqual(list[0].createdBy, 'admin');
});

test('createAnnouncement POSTs, translating active/showFrom to the wire fields', async () => {
  withToken();
  queueResponses({ status: 201, body: { ...ANN_ADMIN_ROW, id: 99, status: 'published' } });
  const created = await announcementService.createAnnouncement({
    title: 'New',
    body: 'Body',
    priority: 'info',
    active: true,
    showFrom: '2026-10-17T14:30',
    showUntil: '',
  });
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/admin/announcements/`);
  assertEqual(lastCall().body.status, 'published');
  assertEqual(lastCall().body.starts_at, new Date('2026-10-17T14:30').toISOString());
  assertEqual(lastCall().body.ends_at, null);
  assertEqual(lastCall().body.created_by, undefined);
  assertEqual(created.id, 99);
});

test('updateAnnouncement PATCHes only the provided fields', async () => {
  withToken();
  queueResponses({ status: 200, body: { ...ANN_ADMIN_ROW } });
  await announcementService.updateAnnouncement(12, { active: false });
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/admin/announcements/12/`);
  assertEqual(lastCall().body.status, 'draft');
  assertEqual(Object.keys(lastCall().body).length, 1, 'omitted fields must not be sent');
});

test('deleteAnnouncement DELETEs and resolves', async () => {
  withToken();
  queueResponses({ status: 204, body: null });
  const result = await announcementService.deleteAnnouncement(12);
  assertEqual(lastCall().method, 'DELETE');
  assertEqual(lastCall().url, `${BASE}/admin/announcements/12/`);
  assertEqual(result.success, true);
});

test('a failed admin mutation rejects (so no false success)', async () => {
  withToken();
  queueResponses({ status: 403, body: { detail: 'nope' } });
  let err;
  try { await announcementService.createAnnouncement({ title: 'x' }); } catch (e) { err = e; }
  assertEqual(err.status, 403);
});

test('an ordinary user is rejected from the admin list (403)', async () => {
  withToken();
  queueResponses({ status: 403, body: null });
  let err;
  try { await announcementService.getAnnouncements(); } catch (e) { err = e; }
  assertEqual(err.status, 403);
});

test('dismissals are client-side, per account, and clearable', () => {
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 7 }));
  announcementService.dismiss(5);
  assert(announcementService.getDismissed().has('5'));
  // Persisted for this account only: a reload must not resurrect the banner.
  const stored = JSON.parse(localStorage.getItem('cyberforge_announcements_dismissed:u:7') || '[]');
  assert(stored.indexOf('5') >= 0, 'dismissal should persist for this account');

  // A different account in the same browser never inherits it.
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 8 }));
  assert(
    !announcementService.getDismissed().has('5'),
    'another account must not inherit this account dismissal',
  );

  // Resetting clears it for the account it was dismissed on.
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 7 }));
  announcementService.resetDismissals();
  assert(!announcementService.getDismissed().has('5'), 'reset clears this account');
  assertEqual(localStorage.getItem('cyberforge_announcements_dismissed:u:7'), null);
});

/* ------------------------------------------------------------------ */
/* Render-stability helpers                                            */
/* (the Challenges render loop + the activity list React keys)         */
/* ------------------------------------------------------------------ */

test('resolveFocusAreas returns the shared empty array for a missing user', () => {
  assertEqual(resolveFocusAreas(undefined), EMPTY_FOCUS_AREAS);
  assertEqual(resolveFocusAreas(null), EMPTY_FOCUS_AREAS);
});

test('resolveFocusAreas returns the shared empty array when onboarding is missing', () => {
  assertEqual(resolveFocusAreas({ username: 'h4ck3r_x' }), EMPTY_FOCUS_AREAS);
});

test('resolveFocusAreas returns the shared empty array for an empty onboarding object', () => {
  assertEqual(resolveFocusAreas({ onboarding: {} }), EMPTY_FOCUS_AREAS);
});

test('resolveFocusAreas returns the shared empty array when focusAreas is missing', () => {
  assertEqual(resolveFocusAreas({ onboarding: { userType: 'student' } }), EMPTY_FOCUS_AREAS);
});

test('resolveFocusAreas preserves a provided focusAreas array (including an empty one)', () => {
  const populated = ['Web Exploitation', 'Cryptography'];
  assertEqual(resolveFocusAreas({ onboarding: { focusAreas: populated } }), populated);
  const empty = [];
  assertEqual(resolveFocusAreas({ onboarding: { focusAreas: empty } }), empty);
});

test('resolveFocusAreas ignores a non-array focusAreas value', () => {
  assertEqual(resolveFocusAreas({ onboarding: { focusAreas: 'Web' } }), EMPTY_FOCUS_AREAS);
});

test('resolveFocusAreas keeps a stable reference across renders (loop regression)', () => {
  // Root cause of the Challenges loop: `|| []` returned a brand new array every
  // render, so the effect dependency changed on every pass. Repeated calls for
  // an account without preferences must return the *same* reference.
  assert(
    resolveFocusAreas({ onboarding: {} }) === resolveFocusAreas({ onboarding: {} }),
    'missing focusAreas must resolve to one stable reference',
  );
  assert(
    resolveFocusAreas(undefined) === resolveFocusAreas({ onboarding: { focusAreas: undefined } }),
    'every missing-data shape must resolve to the same reference',
  );
  assertEqual(EMPTY_FOCUS_AREAS.length, 0);
  assert(Object.isFrozen(EMPTY_FOCUS_AREAS), 'the fallback must be frozen');
});

// Realistic entries copied from the backend activity shape (no `id` field).
const SOLVE = { type: 'solve', challengeId: 9, challengeName: 'Target', points: 50, cost: 0, timestamp: '2026-10-16T10:00:00Z' };
const HINT = { type: 'hint', challengeId: 9, challengeName: 'Target', points: 0, cost: 10, timestamp: '2026-10-16T10:05:00Z' };

test('activityKey always returns a non-empty string', () => {
  for (const entry of [SOLVE, HINT, {}, null, undefined, 'nope', 42]) {
    const key = activityKey(entry);
    assert(typeof key === 'string' && key.length > 0, `key for ${JSON.stringify(entry)} must be a non-empty string`);
  }
});

test('activityKey is stable for the same entry', () => {
  assertEqual(activityKey(SOLVE), activityKey({ ...SOLVE }));
});

test('activityKey separates a solve from a hint on the same challenge', () => {
  assert(activityKey(SOLVE) !== activityKey(HINT), 'solve and hint must not share a key');
});

test('activityKey separates two different hints on the same challenge', () => {
  const a = { type: 'hint', challengeId: 9, points: 0, cost: 10, timestamp: '2026-10-16T10:05:00Z' };
  const b = { type: 'hint', challengeId: 9, points: 0, cost: 25, timestamp: '2026-10-16T10:06:00Z' };
  assert(activityKey(a) !== activityKey(b), 'distinct hints must not share a key');
});

test('activityKey stays unique when the challengeId is absent', () => {
  const a = { type: 'badge', badge: 'first_blood', points: 100, timestamp: '2026-10-16T09:00:00Z' };
  const b = { type: 'badge', badge: 'week_streak', points: 100, timestamp: '2026-10-16T09:01:00Z' };
  assert(activityKey(a) !== activityKey(b), 'two badges without a challengeId must not collide');
});

test('activityKey yields a distinct key for every row of a realistic list', () => {
  const list = [
    SOLVE,
    HINT,
    { type: 'solve', challengeId: 4, challengeName: 'SQLi', points: 30, cost: 0, timestamp: '2026-10-15T08:00:00Z' },
    { type: 'hint', challengeId: 4, challengeName: 'SQLi', points: 0, cost: 5, timestamp: '2026-10-15T08:02:00Z' },
  ];
  const keys = list.map(activityKey);
  assertEqual(new Set(keys).size, list.length, 'activity keys must be unique per row');
});

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

const ACH_USER_ROW = {
  id: 1, slug: 'first-blood', name: 'First Blood', description: 'First solve',
  icon: 'Zap', gradient: ['#111111', '#222222'], rarity: 'Legendary',
  category: 'General', badge_image: '', reward: 100, criteria_type: 'first_solve',
  criteria_label: 'Solve your first challenge', sort_order: 0,
  earned: true, unlocked_at: '2026-10-17T10:00:00Z', progress: { gained: 1, target: 1 },
};

const ACH_ADMIN_ROW = {
  id: 2, slug: 'web-hunter', name: 'Web Hunter', description: '',
  icon: 'Globe', gradient: ['#61dafb', '#a78bfa'], rarity: 'Common',
  category: 'Web Exploitation', badge_image: '/x.png', reward: 150,
  criteria_type: 'category_solves', criteria_config: { category: 1, target: 5 },
  criteria_label: 'Solve 5 in Web Exploitation', is_active: true, sort_order: 3,
  earned_count: 2, created_at: '2026-10-17T09:00:00Z', updated_at: '2026-10-17T09:00:00Z',
};

test('getActiveAchievements GETs the player board with the bearer token', async () => {
  withToken('player-token');
  queueResponses({ status: 200, body: [ACH_USER_ROW] });
  const list = await achievementService.getActiveAchievements();
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/achievements/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer player-token');
});

test('getActiveAchievements normalises the wire shape and keeps server award state', async () => {
  withToken();
  queueResponses({ status: 200, body: [ACH_USER_ROW] });
  const [a] = await achievementService.getActiveAchievements();
  assertEqual(a.earned, true);
  assertEqual(a.criteriaLabel, 'Solve your first challenge');
  assertEqual(a.unlockedAt, '2026-10-17T10:00:00Z');
  assertEqual(a.progress.gained, 1);
  assertEqual(a.progress.target, 1);
  // snake_case is translated for the view; the raw wire keys are not leaked.
  assertEqual(a.criteriaType, 'first_solve');
  assertEqual(a.badge_image, undefined);
});

test('the player board never writes award state to localStorage', async () => {
  withToken();
  queueResponses({ status: 200, body: [ACH_USER_ROW] });
  await achievementService.getActiveAchievements();
  const keys = [...store.keys()];
  assert(!keys.some(k => /achiev/i.test(k)), 'award state must be server-owned, not localStorage');
});

test('a malformed definition is sanitised rather than crashing the grid', async () => {
  withToken();
  queueResponses({ status: 200, body: [{ ...ACH_USER_ROW, icon: 'NotAnIcon', gradient: ['only-one'], progress: null }] });
  const [a] = await achievementService.getActiveAchievements();
  assertEqual(a.icon, 'Trophy');
  assertEqual(a.gradient.length, 2);
  assertEqual(a.progress.gained, 0);
  assertEqual(a.progress.target, 1);
});

test('getAchievements GETs the admin list', async () => {
  withToken('admin-token');
  queueResponses({ status: 200, body: [ACH_ADMIN_ROW] });
  const list = await achievementService.getAchievements();
  assertEqual(lastCall().url, `${BASE}/admin/achievements/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer admin-token');
  assertEqual(list[0].active, true);
  assertEqual(list[0].earnedCount, 2);
  assertEqual(list[0].image, '/x.png');
  assertEqual(list[0].criteriaConfig.target, 5);
});

test('createAchievement POSTs the criteria in wire shape and never sends slug', async () => {
  withToken();
  queueResponses({ status: 201, body: { ...ACH_ADMIN_ROW, id: 99 } });
  const created = await achievementService.createAchievement({
    name: 'Crypto Fan',
    description: 'Solve 3 crypto',
    category: 'Cryptography',
    icon: 'KeyRound',
    gradient: ['#f6d365', '#fda085'],
    rarity: 'Common',
    reward: 150,
    active: true,
    criteriaType: 'category_solves',
    criteriaConfig: { category: 2, target: 3 },
    slug: 'client-controlled',
  });
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/admin/achievements/`);
  assertEqual(lastCall().body.criteria_type, 'category_solves');
  assertEqual(lastCall().body.criteria_config.category, 2);
  assertEqual(lastCall().body.criteria_config.target, 3);
  assertEqual(lastCall().body.is_active, true);
  assertEqual(lastCall().body.slug, undefined, 'slug must be server-derived');
  assertEqual(created.id, 99);
});

test('updateAchievement PATCHes only the provided fields', async () => {
  withToken();
  queueResponses({ status: 200, body: { ...ACH_ADMIN_ROW } });
  await achievementService.updateAchievement(12, { active: false });
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/admin/achievements/12/`);
  assertEqual(lastCall().body.is_active, false);
  assertEqual(Object.keys(lastCall().body).length, 1, 'omitted fields must not be sent');
});

test('setActive toggles through the validated PATCH', async () => {
  withToken();
  queueResponses({ status: 200, body: { ...ACH_ADMIN_ROW, is_active: false } });
  const next = await achievementService.setActive(12, false);
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().body.is_active, false);
  assertEqual(next.active, false);
});

test('deleteAchievement DELETEs and resolves', async () => {
  withToken();
  queueResponses({ status: 204, body: null });
  const result = await achievementService.deleteAchievement(12);
  assertEqual(lastCall().method, 'DELETE');
  assertEqual(lastCall().url, `${BASE}/admin/achievements/12/`);
  assertEqual(result.success, true);
});

test('a failed admin mutation rejects with field errors (no false success)', async () => {
  withToken();
  queueResponses({ status: 400, body: { criteria_config: ['Enter a number of 1 or more.'] } });
  let err;
  try {
    await achievementService.createAchievement({ name: 'x', criteriaType: 'total_solves', criteriaConfig: { target: 0 } });
  } catch (e) { err = e; }
  assertEqual(err.status, 400);
  assertEqual(err.data.criteria_config[0], 'Enter a number of 1 or more.');
});

test('an ordinary user is rejected from the admin list (403)', async () => {
  withToken();
  queueResponses({ status: 403, body: null });
  let err;
  try { await achievementService.getAchievements(); } catch (e) { err = e; }
  assertEqual(err.status, 403);
});

test('the criteria vocabulary exposes exactly the four supported types', () => {
  assertEqual(CRITERIA_TYPES.length, 4);
  const values = CRITERIA_TYPES.map(t => t.value).sort();
  assertEqual(values.join(','), 'category_solves,challenge_solved,first_solve,total_solves');
  assertEqual(criteriaMeta('bogus').value, 'first_solve');
});

test('describeRule summarises every supported rule, with real names', () => {
  const lookups = { categoryNames: { 1: 'Web Exploitation' }, challengeTitles: { 7: 'SQLi 101' } };
  assertEqual(describeRule('first_solve', {}, lookups), 'Solve your first challenge');
  assertEqual(describeRule('total_solves', { target: 5 }, lookups), 'Solve 5 challenges');
  assertEqual(describeRule('total_solves', { target: 1 }, lookups), 'Solve 1 challenge');
  assertEqual(describeRule('category_solves', { category: 1, target: 5 }, lookups), 'Solve 5 in Web Exploitation');
  assertEqual(describeRule('challenge_solved', { challenge: 7 }, lookups), 'Solve "SQLi 101"');
});

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

let passed = 0;
const failures = [];

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

console.log(`\n${passed}/${tests.length} passed`);

if (failures.length) {
  console.error(`\n${failures.length} failing test(s).`);
  process.exitCode = 1;
}
