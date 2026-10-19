/**
 * Service-level harness for Phase 11 account settings.
 *
 * Runs the REAL src/services/authService.js and src/services/api.js in Node
 * against a stubbed fetch + localStorage, so the wire contract of the three new
 * endpoints is pinned without a backend or a browser:
 *
 *   POST   /auth/password/           change password (re-login afterwards)
 *   PATCH  /auth/me/preferences/     notification flags + profile visibility
 *   POST   /auth/logout/             blacklist the refresh token (best effort)
 *
 * Bundled by run.mjs with esbuild, which also defines import.meta.env so api.js
 * resolves its base URL exactly as Vite would.
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
  dispatchEvent: (e) => { dispatchedEvents.push(e); return true; },
  addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
  removeEventListener: () => {},
};

let calls = [];
let queue = [];
let networkFailure = false;

const jsonResponse = (res) => ({
  ok: res.status >= 200 && res.status < 300,
  status: res.status,
  text: async () => (res.body == null ? '' : JSON.stringify(res.body)),
  json: async () => res.body,
});

const fetchStub = async (url, options = {}) => {
  if (networkFailure) throw new TypeError('Failed to fetch');
  let body;
  if (options.body !== undefined) body = JSON.parse(options.body);
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

const { authService } = await import('../../src/services/authService.js');
const { tokenStore, ApiError } = await import('../../src/services/api.js');

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
const withTokens = (access = 'tok123', refresh = 'ref123') => tokenStore.setTokens({ access, refresh });

function resetEnv() {
  calls = [];
  queue = [];
  networkFailure = false;
  store.clear();
  dispatchedEvents.length = 0;
}

/** A canonical /auth/me/ payload, as the backend now returns it. */
const USER_PAYLOAD = {
  id: 1,
  username: 'om',
  email: 'om@example.com',
  points: 320,
  profile_visibility: 'private',
  notification_prefs: {
    solves: true,
    achievements: false,
    new_challenges: true,
    events: true,
    rank_changes: true,
  },
};

/* ------------------------------------------------------------------ */
/* Reading the account (/auth/me/)                                     */
/* ------------------------------------------------------------------ */

test('getCurrentUser translates snake_case preferences to camelCase', async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  const u = await authService.getCurrentUser();
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/auth/me/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  assertEqual(u.profileVisibility, 'private');
  assertEqual(u.notifPrefs.rank_changes, true);
  assertEqual(u.notifPrefs.achievements, false);
});

test('getCurrentUser caches the server preferences, so a reload keeps them', async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  await authService.getCurrentUser();
  const cached = JSON.parse(localStorage.getItem('cyberforge_user'));
  assertEqual(cached.profileVisibility, 'private');
  assertEqual(cached.notifPrefs.events, true);
});

test('a payload without preferences still yields safe defaults', async () => {
  withTokens();
  queueResponses({ status: 200, body: { id: 2, username: 'fresh' } });
  const u = await authService.getCurrentUser();
  assertEqual(u.profileVisibility, 'public');
  assertEqual(typeof u.notifPrefs, 'object');
  assertEqual(u.notifPrefs, u.notifPrefs);
});

/* ------------------------------------------------------------------ */
/* Changing the password (/auth/password/)                             */
/* ------------------------------------------------------------------ */

test('changePassword POSTs the three password fields', async () => {
  withTokens();
  queueResponses({ status: 200, body: { detail: 'Password updated.' } });
  await authService.changePassword('OldPass123!', 'NewPass456!', 'NewPass456!');
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/auth/password/`);
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  assertEqual(lastCall().headers['Content-Type'], 'application/json');
  assertEqual(JSON.stringify(lastCall().body), JSON.stringify({
    current_password: 'OldPass123!',
    new_password: 'NewPass456!',
    new_password2: 'NewPass456!',
  }));
});

test('changePassword defaults the confirmation to the new password', async () => {
  withTokens();
  queueResponses({ status: 200, body: {} });
  await authService.changePassword('OldPass123!', 'NewPass456!');
  assertEqual(lastCall().body.new_password2, 'NewPass456!');
});

test('changePassword stores no password client-side', async () => {
  withTokens();
  queueResponses({ status: 200, body: {} });
  await authService.changePassword('OldPass123!', 'NewPass456!', 'NewPass456!');
  const dump = JSON.stringify([...store.entries()]);
  assert(!dump.includes('NewPass456!'), 'the new password must not be persisted');
  assert(!dump.includes('OldPass123!'), 'the current password must not be persisted');
});

test('changePassword surfaces a weak-password rejection', async () => {
  withTokens();
  queueResponses({ status: 400, body: { new_password: ['This password is too common.'] } });
  let err;
  try { await authService.changePassword('OldPass123!', 'password', 'password'); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(err.status, 400);
  assert(/too common/i.test(err.message), `unexpected message: ${err.message}`);
});

test('changePassword surfaces a wrong-current-password rejection', async () => {
  withTokens();
  queueResponses({ status: 400, body: { current_password: ['That is not your current password.'] } });
  let err;
  try { await authService.changePassword('nope', 'NewPass456!', 'NewPass456!'); } catch (e) { err = e; }
  assertEqual(err.status, 400);
  assert(/current password/i.test(err.message), `unexpected message: ${err.message}`);
});

test('changePassword surfaces a mismatch rejection', async () => {
  withTokens();
  queueResponses({ status: 400, body: { new_password2: ['The two password fields did not match.'] } });
  let err;
  try { await authService.changePassword('OldPass123!', 'NewPass456!', 'Different!9'); } catch (e) { err = e; }
  assertEqual(err.status, 400);
  assert(/did not match/i.test(err.message), `unexpected message: ${err.message}`);
});

/* ------------------------------------------------------------------ */
/* Persisting preferences (/auth/me/preferences/)                      */
/* ------------------------------------------------------------------ */

test('updatePreferences PATCHes notification_prefs and returns the canonical user', async () => {
  withTokens();
  queueResponses({ status: 200, body: { ...USER_PAYLOAD, notification_prefs: { ...USER_PAYLOAD.notification_prefs, rank_changes: false } } });
  const u = await authService.updatePreferences({ notificationPrefs: { rank_changes: false } });
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/auth/me/preferences/`);
  assertEqual(lastCall().headers['Content-Type'], 'application/json');
  assertEqual(lastCall().headers.Authorization, 'Bearer tok123');
  assertEqual(lastCall().body.profile_visibility, undefined, 'only the provided field is sent');
  assertEqual(lastCall().body.notification_prefs.rank_changes, false);
  assertEqual(u.notifPrefs.rank_changes, false);
});

test('updatePreferences PATCHes profile_visibility on its own', async () => {
  withTokens();
  queueResponses({ status: 200, body: { ...USER_PAYLOAD, profile_visibility: 'public' } });
  const u = await authService.updatePreferences({ profileVisibility: 'public' });
  assertEqual(lastCall().body.profile_visibility, 'public');
  assertEqual(lastCall().body.notification_prefs, undefined, 'notifications are untouched');
  assertEqual(u.profileVisibility, 'public');
});

test('updatePreferences sends both fields together', async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  await authService.updatePreferences({
    notificationPrefs: { solves: false },
    profileVisibility: 'private',
  });
  assertEqual(lastCall().body.profile_visibility, 'private');
  assertEqual(lastCall().body.notification_prefs.solves, false);
});

test('updatePreferences merges the response into the cache, keeping stats fields', async () => {
  withTokens();
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 1, username: 'om', rank: 4, streak: 2 }));
  queueResponses({ status: 200, body: { ...USER_PAYLOAD } });
  const u = await authService.updatePreferences({ profileVisibility: 'private' });
  const cached = JSON.parse(localStorage.getItem('cyberforge_user'));
  assertEqual(cached.profileVisibility, 'private');
  assertEqual(cached.notifPrefs.rank_changes, true);
  assertEqual(cached.rank, 4);
  assertEqual(u.rank, 4);
});

test('updatePreferences rejects on failure instead of faking success', async () => {
  withTokens();
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 1, profileVisibility: 'public' }));
  const before = localStorage.getItem('cyberforge_user');
  queueResponses({ status: 400, body: { profile_visibility: ['"nope" is not a valid choice.'] } });
  let err;
  try { await authService.updatePreferences({ profileVisibility: 'nope' }); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(err.status, 400);
  assertEqual(localStorage.getItem('cyberforge_user'), before, 'the cache must not be updated optimistically');
});

test('updatePreferences never writes preferences to a separate localStorage key', async () => {
  withTokens();
  queueResponses({ status: 200, body: USER_PAYLOAD });
  await authService.updatePreferences({ profileVisibility: 'private' });
  const keys = [...store.keys()];
  assert(
    !keys.some(k => /pref|visibility|notif/i.test(k)),
    `server-owned values must not have a localStorage home: ${keys.join(', ')}`,
  );
});

/* ------------------------------------------------------------------ */
/* Signing out (/auth/logout/)                                         */
/* ------------------------------------------------------------------ */

test('logout POSTs the refresh token to /auth/logout/ without an access header', async () => {
  withTokens('acc', 'refresh-abc');
  queueResponses({ status: 200, body: { detail: 'Signed out.' } });
  await authService.logout();
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/auth/logout/`);
  assertEqual(lastCall().body.refresh, 'refresh-abc');
  assertEqual(lastCall().headers.Authorization, undefined);
});

test('logout clears every piece of local state', async () => {
  withTokens('acc', 'refresh-abc');
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 1 }));
  queueResponses({ status: 200, body: {} });
  await authService.logout();
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(localStorage.getItem('cyberforge_refresh'), null);
  assertEqual(localStorage.getItem('cyberforge_user'), null);
});

test('logout still clears local state when the server errors (best effort)', async () => {
  withTokens('acc', 'refresh-abc');
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 1 }));
  queueResponses({ status: 500, body: null });
  await authService.logout();
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(localStorage.getItem('cyberforge_refresh'), null);
  assertEqual(localStorage.getItem('cyberforge_user'), null);
});

test('logout clears local state on a network failure', async () => {
  withTokens('acc', 'refresh-abc');
  localStorage.setItem('cyberforge_user', JSON.stringify({ id: 1 }));
  networkFailure = true;
  await authService.logout();
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(localStorage.getItem('cyberforge_user'), null);
});

test('logout treats an already-invalid token as signed out', async () => {
  withTokens('acc', 'stale');
  queueResponses({ status: 401, body: { detail: 'Token is invalid or expired' } });
  await authService.logout();
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(localStorage.getItem('cyberforge_refresh'), null);
});

test('logout with no stored refresh token never touches the network', async () => {
  tokenStore.setTokens({ access: 'acc-only' });
  await authService.logout();
  assertEqual(calls.length, 0);
  assertEqual(localStorage.getItem('cyberforge_access'), null);
});

test('logout clears the session exactly once (no retry)', async () => {
  withTokens('acc', 'ref');
  queueResponses({ status: 401, body: null });
  await authService.logout();
  assertEqual(calls.length, 1, 'logout must not attempt a token refresh');
  assertEqual(calls[0].url, `${BASE}/auth/logout/`);
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
