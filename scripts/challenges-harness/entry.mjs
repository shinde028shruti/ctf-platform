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
  calls.push({
    url,
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body === undefined ? undefined : JSON.parse(options.body),
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
const { api, tokenStore, ApiError } = await import('../../src/services/api.js');

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
