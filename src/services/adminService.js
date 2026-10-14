/**
 * adminService.js
 * Handles admin data: users, submissions, audit logs, solve history.
 * Currently uses mock data + localStorage (same pattern as challengeService).
 * TODO: Replace with real API calls when backend is ready.
 */

import { adminUsers as mockUsers, adminSubmissions as mockSubmissions, auditLogs as mockAuditLogs } from '../data/admin';
import { solveEvents as mockSolves } from '../data/solves';
import { api } from './api';

const USERS_KEY = 'cyberforge_admin_users';
const SUBMISSIONS_KEY = 'cyberforge_admin_submissions';
const AUDIT_KEY = 'cyberforge_audit_logs';
const SOLVES_KEY = 'cyberforge_solves';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

const read = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return fallback;
};

const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const adminService = {
  async getUsers() {
    await delay(250);
    return read(USERS_KEY, mockUsers);
  },

  async getSubmissions() {
    await delay(250);
    return read(SUBMISSIONS_KEY, mockSubmissions);
  },

  async getAuditLogs() {
    await delay(250);
    return read(AUDIT_KEY, mockAuditLogs);
  },

  async getSolvesHistory() {
    await delay(250);
    return read(SOLVES_KEY, mockSolves);
  },

  async logAction(actor, action, target, ip = '192.168.1.104') {
    const logs = read(AUDIT_KEY, mockAuditLogs);
    const next = [{
      id: Date.now(),
      actor: actor || 'System',
      action,
      target,
      ip,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }, ...logs].slice(0, 250);
    write(AUDIT_KEY, next);
    return next;
  },

  /* ---------------------------------------------------------------- */
  /* Real admin user-management API (Admin -> Users page).            */
  /*                                                                    */
  /* These call the Django REST backend at /api/v1/admin/. Errors are   */
  /* thrown as ApiError with a humanised `.message` by api.js.          */
  /* ---------------------------------------------------------------- */

  async listUsers({ page = 1, pageSize = 20, search = '', deleted = false } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    const term = (search || '').trim();
    if (term) params.set('search', term);
    if (deleted) params.set('deleted', 'true');
    return api.get(`/admin/users/?${params.toString()}`);
  },

  async getUser(id, { deleted = false } = {}) {
    const suffix = deleted ? '?deleted=true' : '';
    return api.get(`/admin/users/${id}/${suffix}`);
  },

  async createUser(payload) {
    return api.post('/admin/users/', payload);
  },

  async updateUser(id, payload) {
    return api.patch(`/admin/users/${id}/`, payload);
  },

  async removeUser(id) {
    return api.delete(`/admin/users/${id}/`);
  },

  async restoreUser(id) {
    return api.post(`/admin/users/${id}/restore/`, {});
  },

  async setUserStatus(id, status, statusNote = '') {
    return api.patch(`/admin/users/${id}/status/`, {
      status,
      status_note: statusNote || '',
    });
  },

  async setUserGroups(id, groupIds) {
    return api.patch(`/admin/users/${id}/groups/`, { groups: groupIds });
  },

  async listGroups() {
    return api.get('/admin/groups/');
  },
};