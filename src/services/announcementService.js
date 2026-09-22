/**
 * announcementService.js
 * Handles platform-wide announcements broadcast by admins.
 * TODO: Replace with real API calls when backend is ready.
 */

const ANNOUNCE_KEY = 'cyberforge_announcements';
const DISMISS_KEY = 'cyberforge_dismissed_announcements';
const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

const SEED = [
  {
    id: 1,
    title: 'Welcome to CyberForge',
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

  getDismissed() {
    return read(DISMISS_KEY, []);
  },

  dismiss(id) {
    const ids = new Set(read(DISMISS_KEY, []));
    ids.add(Number(id));
    write(DISMISS_KEY, [...ids]);
  },
};