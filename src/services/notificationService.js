/**
 * notificationService.js
 * Handles user notification data.
 * TODO: Replace with real-time WebSocket or polling endpoint.
 */

import { notifications as mockNotifications } from '../data/notifications';

const NOTIF_KEY = 'cyberforge_notifications';
const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

const getStored = () => {
  const raw = localStorage.getItem(NOTIF_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return mockNotifications;
};

const save = (data) => localStorage.setItem(NOTIF_KEY, JSON.stringify(data));

export const notificationService = {
  /**
   * Get all notifications for current user.
   * TODO: Replace with GET /api/notifications
   */
  async getNotifications() {
    await delay();
    return getStored();
  },

  /**
   * Mark a notification as read.
   * TODO: Replace with PATCH /api/notifications/:id/read
   */
  async markRead(id) {
    const notifs = getStored();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    save(updated);
    return updated;
  },

  /**
   * Mark all notifications as read.
   * TODO: Replace with PATCH /api/notifications/read-all
   */
  async markAllRead() {
    const notifs = getStored();
    const updated = notifs.map(n => ({ ...n, read: true }));
    save(updated);
    return updated;
  },

  /**
   * Get unread count.
   * TODO: Replace with GET /api/notifications/unread-count
   */
  async getUnreadCount() {
    const notifs = getStored();
    return notifs.filter(n => !n.read).length;
  },
};
