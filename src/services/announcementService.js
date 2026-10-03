/**
 * announcementService.js
 * Handles platform-wide announcements broadcast by admins.
 * TODO: Replace with real API calls when backend is ready.
 */

const ANNOUNCE_KEY = 'cyberforge_announcements';
const USER_KEY = 'cyberforge_user';
const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

const SEED = [
  {
    id: 1,
    title: 'Welcome to FlagHunt',
    body: 'Solve challenges, climb the ranks, and keep your streak alive. Good hunting, operator.',
    priority: 'info',
    active: true,
    showFrom: null,
    showUntil: null,
    createdAt: '2026-09-15 09:00:00',
  },
];

const read = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return fallback;
};

const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));

/**
 * Dismissals are session-only: stored in memory for the lifetime of the page.
 * Reloading the page or logging out and back in will always show banners again.
 * Keyed by user scope so switching accounts in one tab cannot leak dismissals.
 */
const sessionDismissed = new Map();
const sessionFor = (scope) => {
  if (!sessionDismissed.has(scope)) sessionDismissed.set(scope, new Set());
  return sessionDismissed.get(scope);
};

/** Who is dismissing. A signed-out visitor gets their own scope so two people
 *  sharing a browser tab cannot inherit each other's dismissals. */
const currentScope = () => {
  try {
    const u = read(USER_KEY, null);
    if (u) return `u:${u.id ?? u.username ?? 'me'}`;
  } catch { /* fall through */ }
  return 'guest';
};

export const announcementService = {
  async getAnnouncements() {
    await delay();
    return read(ANNOUNCE_KEY, SEED);
  },

  async getActiveAnnouncements() {
    await delay(100);
    const now = Date.now();
    return read(ANNOUNCE_KEY, SEED).filter(a => {
      if (!a.active) return false;
      if (a.showFrom && new Date(a.showFrom).getTime() > now) return false;
      if (a.showUntil && new Date(a.showUntil).getTime() < now) return false;
      return true;
    });
  },

  async createAnnouncement(data) {
    await delay();
    const items = read(ANNOUNCE_KEY, SEED);
    const item = {
      id: Date.now(),
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      ...data,
    };
    write(ANNOUNCE_KEY, [item, ...items]);
    return item;
  },

  async updateAnnouncement(id, data) {
    await delay();
    const items = read(ANNOUNCE_KEY, SEED);
    const index = items.findIndex(a => a.id === Number(id));
    if (index === -1) throw new Error('Announcement not found.');
    items[index] = { ...items[index], ...data };
    write(ANNOUNCE_KEY, items);
    return items[index];
  },

  async deleteAnnouncement(id) {
    await delay();
    write(ANNOUNCE_KEY, read(ANNOUNCE_KEY, SEED).filter(a => a.id !== Number(id)));
    return { success: true };
  },

  /** Returns the set of announcement IDs dismissed in this session only.
   *  Always empty on a fresh page load or after logging out and back in. */
  getDismissed() {
    return new Set(sessionFor(currentScope()));
  },

  /** Records a dismissal in memory for the rest of this page session.
   *  The banner will reappear after a reload or a fresh login. */
  dismiss(id) {
    sessionFor(currentScope()).add(String(id));
  },

  dismissAll(ids) {
    (ids || []).forEach(id => this.dismiss(id));
  },

  /** Clears this session's dismissals so active banners reappear immediately —
   *  lets an admin verify their own broadcast without re-creating it. */
  async resetDismissals() {
    await delay(200);
    sessionDismissed.delete(currentScope());
    return { success: true };
  },
};
