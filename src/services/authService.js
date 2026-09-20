/**
 * authService.js
 * Handles authentication logic (login, register, logout, session).
 * All methods currently use mock data / localStorage.
 * Replace with real API calls (JWT + backend) when backend is ready.
 */

import { currentUser } from '../data/users';

const AUTH_KEY = 'cyberforge_auth';
const USER_KEY = 'cyberforge_user';

// Simulated user store (in real app this lives in DB)
const MOCK_USERS = [
  { id: 1, username: 'h4ck3r_x', email: 'hacker@cyberforge.io', password: 'password123', role: 'user' },
  { id: 2, username: 'admin', email: 'admin@cyberforge.io', password: 'admin123', role: 'admin' },
];

const delay = (ms = 600) => new Promise(res => setTimeout(res, ms));

export const authService = {
  /**
   * Login user with username/email and password.
   * TODO: Replace with POST /api/auth/login
   */
  async login(identifier, password) {
    await delay();
    const user = MOCK_USERS.find(
      u => (u.username === identifier || u.email === identifier) && u.password === password
    );
    if (!user) throw new Error('Invalid username or password.');

    const profile = user.id === 1 ? currentUser : { ...currentUser, id: user.id, username: user.username, role: user.role };
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    return profile;
  },

  /**
   * Register a new user.
   * TODO: Replace with POST /api/auth/register
   */
  async register(username, email, password) {
    await delay();
    const exists = MOCK_USERS.find(u => u.username === username || u.email === email);
    if (exists) throw new Error('Username or email already in use.');

    const newUser = {
      ...currentUser,
      id: Date.now(),
      username,
      email,
      role: 'user',
      points: 0,
      rank: 9999,
      solvedChallenges: [],
      streak: 0,
      badges: [],
      recentActivity: [],
      onboardingCompleted: false,
      userType: null,
      onboarding: null,
    };

    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  /**
   * Logout current user.
   * TODO: Replace with POST /api/auth/logout (invalidate token)
   */
  async googleLogin() {
    await delay();
    const profile = { ...currentUser, id: 9001, username: 'google_user', email: 'user@gmail.com', role: 'user' };
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    return profile;
  },

  /**
   * Logout current user.
   * TODO: Replace with POST /api/auth/logout (invalidate token)
   */
  async logout() {
    await delay(200);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Get the currently authenticated user from localStorage.
   * TODO: Replace with GET /api/auth/me using stored JWT
   */
  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Check if a user session is active.
   */
  isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  /**
   * Update user profile in local state.
   * TODO: Replace with PATCH /api/users/:id
   */
  async updateProfile(updates) {
    await delay(400);
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated.');
    const updated = { ...user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },
};
