/**
 * notificationService.js
 * The authenticated user's in-app notifications, from the Django REST API.
 *
 * Responses are normalised into the field names the existing NotificationPanel
 * already reads (`read`, `timestamp`, `icon`) so the component stays
 * presentation-only and its markup is unchanged.
 *
 * There is deliberately NO mock or localStorage fallback: if the API is
 * unreachable the caller shows an error rather than inventing notifications.
 */

import { api } from './api';

/** Closed server vocabulary -> the lucide icon name the panel renders. */
const TYPE_ICON = {
  system: 'Bell',
  challenge: 'CheckCircle',
  achievement: 'Trophy',
  announcement: 'Calendar',
};

/** Map one API row onto the shape the panel consumes. */
function normalise(raw) {
  const type = raw?.type || 'system';
  return {
    id: raw?.id,
    type,
    title: raw?.title ?? '',
    message: raw?.message ?? '',
    // Same-app path or ''. Never trusted blindly - the panel re-checks it
    // before navigating.
    destination: raw?.destination_url || '',
    read: Boolean(raw?.is_read),
    timestamp: raw?.created_at ?? null,
    icon: TYPE_ICON[type] || 'Bell',
  };
}

export const notificationService = {
  /**
   * GET /notifications/ - the caller's own notifications, newest first.
   * Returns the first page of results (the endpoint is paginated with the
   * project's standard {count,next,previous,results} envelope).
   */
  async getNotifications({ limit = 50 } = {}) {
    const data = await api.get(`/notifications/?limit=${limit}`);
    const results = Array.isArray(data) ? data : (data?.results ?? []);
    return results.map(normalise);
  },

  /** GET /notifications/unread-count/ - never negative. */
  async getUnreadCount() {
    const data = await api.get('/notifications/unread-count/');
    const value = data?.unread_count;
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  },

  /** PATCH /notifications/{id}/read/ - idempotent; returns the updated row. */
  async markRead(id) {
    const data = await api.patch(`/notifications/${id}/read/`, {});
    return normalise(data);
  },

  /** POST /notifications/mark-all-read/ - returns the number updated. */
  async markAllRead() {
    const data = await api.post('/notifications/mark-all-read/', {});
    return data?.updated ?? 0;
  },

  /** DELETE /notifications/{id}/ - owner-only. */
  async deleteNotification(id) {
    await api.delete(`/notifications/${id}/`);
  },
};

export { normalise };
