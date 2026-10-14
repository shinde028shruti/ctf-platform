/**
 * api.js
 * Single HTTP client for the Django REST API.
 *
 * Responsibilities:
 *  - resolve the base URL from VITE_API_BASE_URL (never hard-coded)
 *  - attach `Authorization: Bearer <access>` to authenticated requests
 *  - normalise Django REST Framework errors into plain readable strings
 *  - transparently refresh an expired access token once, then retry
 *
 * There is deliberately no axios dependency: the project ships no HTTP client,
 * so this uses the platform `fetch`.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const ACCESS_KEY = 'cyberforge_access';
const REFRESH_KEY = 'cyberforge_refresh';

/* ------------------------------------------------------------------ */
/* Token storage                                                       */
/* ------------------------------------------------------------------ */

export const tokenStore = {
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
  },
};

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Turn any DRF error body into one readable sentence.
 *
 * DRF returns several shapes:
 *   { detail: "No active account found..." }
 *   { username: ["A user with that username already exists."] }
 *   { non_field_errors: ["..."], password: ["..."] }
 *   ["..."]                                  (list validators)
 *
 * Never surfaces a stack trace or raw JSON to the user.
 */
export function humanizeError(data, fallback = 'Something went wrong. Please try again.') {
  if (data == null) return fallback;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    // A non-JSON body means an unhandled server error. With DEBUG=True Django
    // returns a full HTML traceback page, which must never reach the user.
    if (!trimmed || trimmed.startsWith('<')) return fallback;
    return trimmed.length > 300 ? fallback : trimmed;
  }

  if (Array.isArray(data)) {
    return data.filter(Boolean).join(' ') || fallback;
  }

  if (typeof data === 'object') {
    // `detail` may be a string or a list of strings depending on the view.
    if (data.detail != null) {
      const detail = Array.isArray(data.detail)
        ? data.detail.filter(Boolean).join(' ')
        : data.detail;
      if (typeof detail === 'string' && detail) return detail;
    }

    const parts = [];
    // Debug-only keys that must never be echoed to the user, even if a server
    // or custom exception handler includes them in the body.
    const internalKeys = new Set([
      'trace', 'traceback', 'stack', 'stacktrace', 'debug', 'exception',
      'exc', 'internal', 'django', 'request', 'settings',
    ]);

    for (const [field, value] of Object.entries(data)) {
      if (internalKeys.has(field.toLowerCase())) continue;
      const messages = Array.isArray(value) ? value : [value];
      const text = messages.filter((m) => typeof m === 'string').join(' ');
      if (!text) continue;
      // Readable field labels instead of raw snake_case keys.
      const label = {
        username: 'Username',
        email: 'Email',
        password: 'Password',
        password2: 'Password confirmation',
        refresh: 'Session',
        non_field_errors: '',
      }[field];

      if (label === '') parts.push(text);
      else if (label) parts.push(`${label}: ${text}`);
      else parts.push(text);
    }
    if (parts.length) return parts.join(' ');
  }

  return fallback;
}

/* ------------------------------------------------------------------ */
/* Core request                                                        */
/* ------------------------------------------------------------------ */

async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Perform a request against the API.
 *
 * @param {string} path        e.g. '/auth/login/' (relative to the base URL)
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {object} [options.body]        JSON-serialised when present
 * @param {boolean} [options.auth=true]  send the Bearer token
 * @param {boolean} [options.retry=true] allow one refresh-and-retry on 401
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    retry = true,
    signal,
  } = options;

  const headers = { Accept: 'application/json' };
  // FormData uploads need the browser to set the multipart boundary;
  // JSON bodies get an explicit content type.
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
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
      body: body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body)),
    });
  } catch {
    // Network-level failure: server down, wrong port, blocked by CORS.
    throw new ApiError('Cannot reach the server. Is the backend running?', { status: 0 });
  }

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry exactly once. `retry: false` prevents an infinite loop.
      return request(path, { ...options, retry: false });
    }
    // Refresh token is gone or expired: drop the session.
    tokenStore.clear();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError('Your session has expired. Please log in again.', { status: 401 });
  }

  const data = await readBody(response);

  if (!response.ok) {
    const message = humanizeError(
      data,
      response.status === 403
        ? 'You do not have permission to do that.'
        : response.status === 404
          ? 'That resource was not found.'
          : response.status >= 500
            ? 'The server had a problem. Please try again later.'
            : 'Request failed. Please try again.',
    );
    throw new ApiError(message, { status: response.status, data });
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;

/* ------------------------------------------------------------------ */
/* Refresh                                                             */
/* ------------------------------------------------------------------ */

/**
 * A single in-flight refresh shared by all callers. Concurrent 401s await the
 * same promise instead of firing several refresh requests, which is what would
 * otherwise rotate tokens onto different clients and log the user out.
 */
let refreshInFlight = null;

async function performRefresh() {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data || !data.access) return false;

    tokenStore.setAccess(data.access);
    // SimpleJWT rotates the refresh token when ROTATE_REFRESH_TOKENS is on.
    if (data.refresh) tokenStore.setRefresh(data.refresh);
    return true;
  } catch {
    return false;
  }
}

export function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}