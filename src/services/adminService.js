/**
 * adminService.js
 * Handles admin data: users, submissions, audit logs, solve history.
 * Currently uses mock data + localStorage (same pattern as challengeService).
 * TODO: Replace with real API calls when backend is ready.
 */

import { adminUsers as mockUsers, adminSubmissions as mockSubmissions, auditLogs as mockAuditLogs } from '../data/admin';
import { solveEvents as mockSolves } from '../data/solves';

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

  async updateUserStatus(id, status, reason = '') {
    await delay();
    const users = read(USERS_KEY, mockUsers);
    const index = users.findIndex(u => u.id === Number(id));
    if (index === -1) throw new Error('User not found.');
    users[index] = { ...users[index], status, statusNote: reason || users[index].statusNote };
    write(USERS_KEY, users);
    return users[index];
  },

  async updateUserRole(id, role) {
    await delay();
    const users = read(USERS_KEY, mockUsers);
    const index = users.findIndex(u => u.id === Number(id));
    if (index === -1) throw new Error('User not found.');
    users[index] = { ...users[index], role };
    write(USERS_KEY, users);
    return users[index];
  },

  async deleteUser(id) {
    await delay();
    const users = read(USERS_KEY, mockUsers);
    const filtered = users.filter(u => u.id !== Number(id));
    write(USERS_KEY, filtered);
    return { success: true };
  },
};