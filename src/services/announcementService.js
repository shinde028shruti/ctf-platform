/**
 * announcementService.js
 *
 * Talks to the real announcement API. The public banner reads
 * `GET /announcements/` (active published announcements only); the admin page
 * reads and mutates `/admin/announcements/`.
 *
 * The backend speaks snake_case and a `status` of `draft`/`published`; the
 * existing UI speaks camelCase (`showFrom`/`showUntil`/`createdAt`) and a
 * boolean `active`. The two `to*` mappers below are the only place that
 * translation happens, so neither component had to be reshaped.
 *
 * There is deliberately no mock/seed fallback: a failed request rejects, and
 * the caller decides what (if anything) to show.
 *
 * Dismissals are *not* announcement data. They are a per-account presentation
 * preference kept in the browser (localStorage, scoped per account) - the server
 * is never asked to remember them, and one account's dismissals never hide a
 * banner from anybody else.
 */

import { api } from './api';

const USER_KEY = 'cyberforge_user';
const DISMISS_PREFIX = 'cyberforge_announcements_dismissed';

/* ------------------------------------------------------------------ */
/* Dismissals (client-only presentation state)                         */
/* ------------------------------------------------------------------ */

/**
 * A dismissal is a presentation preference, not announcement data: it is kept
 * in the browser only, never sent to the server, and never affects what other
 * accounts see. It is scoped per account (`u:<id>`), so switching accounts in
 * one browser cannot inherit someone else's dismissals, and it lives in
 * localStorage so a reload does not resurrect a banner the user closed. An
 * in-memory mirror means a blocked or full localStorage still lets the current
 * page dismiss banners.
 */
const memoryDismissed = new Map();

/** Who is dismissing. A signed-out visitor gets a shared 'guest' scope. */
const currentScope = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u) return `u:${u.id ?? u.username ?? 'me'}`;
    }
  } catch { /* fall through to guest */ }
  return 'guest';
};

const storageKey = (scope) => `${DISMISS_PREFIX}:${scope}`;

const readStored = (scope) => {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const writeStored = (scope, ids) => {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify([...ids]));
  } catch { /* a blocked or full localStorage must not break dismissing */ }
};

const dismissedFor = (scope) => {
  if (!memoryDismissed.has(scope)) {
    memoryDismissed.set(scope, new Set(readStored(scope)));
  }
  return memoryDismissed.get(scope);
};

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, '0');

/** ISO timestamp -> the `YYYY-MM-DDTHH:MM` shape a datetime-local input wants. */
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

/** ISO timestamp -> the `YYYY-MM-DD HH:MM:SS` shape the table renders. */
const toLocalStamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

/** `datetime-local` value (local wall time) -> an aware ISO string for the API. */
const toIso = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const asArray = (data) =>
  Array.isArray(data) ? data : (data?.results ?? []);

/** Wire shape (public) -> the banner's model. */
const toPublic = (a) => ({
  id: a.id,
  title: a.title,
  body: a.body || '',
  priority: a.priority || 'info',
  // The public endpoint only ever returns active rows.
  active: true,
  showFrom: toLocalInput(a.starts_at),
  showUntil: toLocalInput(a.ends_at),
  createdAt: toLocalStamp(a.published_at || a.created_at),
});

/** Wire shape (admin) -> the admin table/form model. */
const toAdmin = (a) => ({
  id: a.id,
  title: a.title,
  body: a.body || '',
  priority: a.priority || 'info',
  status: a.status,
  active: a.status === 'published',
  showFrom: toLocalInput(a.starts_at),
  showUntil: toLocalInput(a.ends_at),
  createdAt: toLocalStamp(a.created_at),
  createdBy: a.created_by_username || null,
});

/** UI payload -> the writable wire fields. Only provided keys are sent, so a
 *  `PATCH` never clobbers an omitted field. */
const toPayload = (data = {}) => {
  const payload = {};
  if ('title' in data) payload.title = data.title;
  if ('body' in data) payload.body = data.body;
  if ('priority' in data) payload.priority = data.priority;
  if ('status' in data) payload.status = data.status;
  // The UI toggles a boolean; translate it unless an explicit status was given.
  if ('active' in data && !('status' in data)) {
    payload.status = data.active ? 'published' : 'draft';
  }
  if ('showFrom' in data) payload.starts_at = toIso(data.showFrom);
  if ('showUntil' in data) payload.ends_at = toIso(data.showUntil);
  return payload;
};

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export const announcementService = {
  /** Active published announcements, for the banner. Readable anonymously. */
  async getActiveAnnouncements() {
    const data = await api.get('/announcements/', { auth: false });
    return asArray(data).map(toPublic);
  },

  /** Every announcement (drafts included), for the admin table. */
  async getAnnouncements() {
    const data = await api.get('/admin/announcements/');
    return asArray(data).map(toAdmin);
  },

  async createAnnouncement(data) {
    const created = await api.post('/admin/announcements/', toPayload(data));
    return toAdmin(created);
  },

  async updateAnnouncement(id, data) {
    const updated = await api.patch(
      `/admin/announcements/${id}/`,
      toPayload(data),
    );
    return toAdmin(updated);
  },

  async deleteAnnouncement(id) {
    await api.delete(`/admin/announcements/${id}/`);
    return { success: true };
  },

  /** Announcement IDs this account has dismissed (browser-local, never sent to
   *  the server and never visible to any other account). */
  getDismissed() {
    return new Set(dismissedFor(currentScope()));
  },

  /** Records a dismissal for the current account and persists it locally. */
  dismiss(id) {
    const scope = currentScope();
    const set = dismissedFor(scope);
    set.add(String(id));
    writeStored(scope, set);
  },

  dismissAll(ids) {
    const scope = currentScope();
    const set = dismissedFor(scope);
    (ids || []).forEach((id) => set.add(String(id)));
    writeStored(scope, set);
  },

  /** Clears this account's dismissals so active banners reappear immediately -
   *  lets an admin verify their own broadcast without re-creating it. */
  resetDismissals() {
    const scope = currentScope();
    memoryDismissed.delete(scope);
    try { localStorage.removeItem(storageKey(scope)); } catch { /* ignore */ }
    return { success: true };
  },
};
