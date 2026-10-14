/**
 * Service-level harness for the Admin -> Users feature.
 *
 * Runs the REAL src/services/adminService.js and src/services/api.js in Node
 * against a stubbed fetch + localStorage, so URL construction, HTTP methods,
 * payloads, auth headers, pagination/search params and the 200/400/401/403
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

const { adminService } = await import('../../src/services/adminService.js');
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

test('listUsers builds the paginated URL from the configured base', async () => {
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, summary: {}, results: [] } });
  const data = await adminService.listUsers();
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/admin/users/?page=1&page_size=20`);
  assertEqual(data.count, 0);
});

test('listUsers forwards page, page_size and search', async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService.listUsers({ page: 3, pageSize: 5, search: 'ada' });
  assertEqual(lastCall().url, `${BASE}/admin/users/?page=3&page_size=5&search=ada`);
});

test('listUsers drops a blank search term', async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService.listUsers({ search: '   ' });
  assert(!lastCall().url.includes('search='), 'blank search must not be sent');
});

test('the Bearer token is attached when present', async () => {
  withToken('abc.def.ghi');
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService.listUsers();
  assertEqual(lastCall().headers.Authorization, 'Bearer abc.def.ghi');
});

test('no Authorization header is sent when logged out', async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService.listUsers();
  assert(lastCall().headers.Authorization === undefined, 'expected no auth header');
});

test('getUser GETs the detail URL', async () => {
  queueResponses({ status: 200, body: { id: 7 } });
  const data = await adminService.getUser(7);
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/admin/users/7/`);
  assertEqual(data.id, 7);
});

test('createUser POSTs a JSON body', async () => {
  withToken();
  queueResponses({ status: 201, body: { id: 1, username: 'neo' } });
  const data = await adminService.createUser({ username: 'neo', password: 'Str0ng-Pass!42' });
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/admin/users/`);
  assertEqual(lastCall().headers['Content-Type'], 'application/json');
  assertEqual(lastCall().body.username, 'neo');
  assertEqual(data.id, 1);
});

test('updateUser PATCHes profile fields to the detail URL', async () => {
  queueResponses({ status: 200, body: { id: 5 } });
  await adminService.updateUser(5, { first_name: 'Ada', email: 'ada@example.com' });
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/admin/users/5/`);
  assertEqual(lastCall().body.first_name, 'Ada');
});

test('removeUser sends DELETE and tolerates an empty 204', async () => {
  queueResponses({ status: 204, body: null });
  const data = await adminService.removeUser(7);
  assertEqual(lastCall().method, 'DELETE');
  assertEqual(lastCall().url, `${BASE}/admin/users/7/`);
  assertEqual(data, null);
});

test('listUsers adds deleted=true only when asked', async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService.listUsers({ deleted: true });
  assertEqual(lastCall().url, `${BASE}/admin/users/?page=1&page_size=20&deleted=true`);
});

test('listUsers omits deleted for the active view', async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService.listUsers({ deleted: false });
  assert(!lastCall().url.includes('deleted='), 'active view must not send deleted');
});

test('getUser forwards the deleted flag for a deleted account', async () => {
  queueResponses({ status: 200, body: { id: 7, deleted_at: '2026-01-01T00:00:00Z' } });
  await adminService.getUser(7, { deleted: true });
  assertEqual(lastCall().url, `${BASE}/admin/users/7/?deleted=true`);
});

test('restoreUser POSTs to the restore endpoint', async () => {
  queueResponses({ status: 200, body: { id: 7, status: 'active', deleted_at: null } });
  const data = await adminService.restoreUser(7);
  assertEqual(lastCall().method, 'POST');
  assertEqual(lastCall().url, `${BASE}/admin/users/7/restore/`);
  assertEqual(data.deleted_at, null);
});

test('setUserStatus PATCHes status and note', async () => {
  queueResponses({ status: 200, body: { id: 7, status: 'suspended' } });
  await adminService.setUserStatus(7, 'suspended', 'spam');
  assertEqual(lastCall().method, 'PATCH');
  assertEqual(lastCall().url, `${BASE}/admin/users/7/status/`);
  assertEqual(lastCall().body.status, 'suspended');
  assertEqual(lastCall().body.status_note, 'spam');
});

test('setUserStatus defaults the note to an empty string', async () => {
  queueResponses({ status: 200, body: {} });
  await adminService.setUserStatus(7, 'active');
  assertEqual(lastCall().body.status_note, '');
});

test('setUserGroups PATCHes the group id list', async () => {
  queueResponses({ status: 200, body: { id: 7, groups: [] } });
  await adminService.setUserGroups(7, [2, 3]);
  assertEqual(lastCall().url, `${BASE}/admin/users/7/groups/`);
  assertEqual(JSON.stringify(lastCall().body.groups), '[2,3]');
});

test('listGroups GETs the assignable groups', async () => {
  queueResponses({ status: 200, body: [{ id: 1, name: 'Admin' }] });
  const data = await adminService.listGroups();
  assertEqual(lastCall().method, 'GET');
  assertEqual(lastCall().url, `${BASE}/admin/groups/`);
  assertEqual(data[0].name, 'Admin');
});

test('403 becomes an ApiError with a permission message', async () => {
  withToken();
  queueResponses({ status: 403, body: null });
  let err;
  try { await adminService.listUsers(); } catch (e) { err = e; }
  assert(err instanceof ApiError, 'expected an ApiError');
  assertEqual(err.status, 403);
  assert(/permission/i.test(err.message), `unexpected message: ${err.message}`);
});

test('400 surfaces the field-level validation message', async () => {
  withToken();
  queueResponses({ status: 400, body: { username: ['A user with that username already exists.'] } });
  let err;
  try { await adminService.createUser({ username: 'neo', password: 'x' }); } catch (e) { err = e; }
  assertEqual(err.status, 400);
  assert(/username/i.test(err.message), `unexpected message: ${err.message}`);
});

test('404 becomes an ApiError without leaking internals', async () => {
  withToken();
  queueResponses({ status: 404, body: null });
  let err;
  try { await adminService.getUser(999); } catch (e) { err = e; }
  assertEqual(err.status, 404);
  assert(/not found/i.test(err.message), `unexpected message: ${err.message}`);
});

test('401 with no refresh token clears the session and emits auth:expired', async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try { await adminService.listUsers(); } catch (e) { err = e; }
  assertEqual(err.status, 401);
  assertEqual(calls.length, 1, 'should not retry without a refresh token');
  assertEqual(localStorage.getItem('cyberforge_access'), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, 'auth:expired');
});

test('401 with a valid refresh token retries once using the new access token', async () => {
  tokenStore.setTokens({ access: 'old', refresh: 'refresh-1' });
  queueResponses(
    { status: 401, body: null },
    { status: 200, body: { access: 'new-access' } },
    { status: 200, body: { count: 1, results: [{ id: 1 }] } },
  );
  const data = await adminService.listUsers();
  assertEqual(calls.length, 3, 'list, refresh, retried list');
  assertEqual(calls[1].url, `${BASE}/auth/refresh/`);
  assertEqual(calls[1].body.refresh, 'refresh-1');
  assertEqual(calls[2].headers.Authorization, 'Bearer new-access');
  assertEqual(tokenStore.getAccess(), 'new-access');
  assertEqual(data.count, 1);
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
