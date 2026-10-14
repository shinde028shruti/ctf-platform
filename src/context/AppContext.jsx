import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

const AppContext = createContext(null);

const USER_KEY = 'cyberforge_user';

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /**
   * Restore the session on first mount.
   *
   * A stored access token is only a hint - it may have expired or been
   * revoked. The token is validated against GET /auth/me/ (which itself
   * retries once through the refresh flow). Anything unexpected clears the
   * session rather than leaving a half-authenticated state behind.
   */
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!authService.isAuthenticated()) {
        if (!cancelled) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser({ refresh: true });
        if (cancelled) return;
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          setLoading(false);
          loadNotifications();
        } else {
          setLoading(false);
        }
      } catch {
        if (cancelled) return;
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    restore();

    return () => { cancelled = true; };
  }, []);

  /**
   * The API client fires this when a refresh attempt fails, so the whole app
   * reacts to an expired session instead of each component noticing on its
   * own next request.
   */
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setNotifications([]);
      setUnreadCount(0);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const loadNotifications = async () => {
    try {
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch { /* silent */ }
  };

  const login = async (identifier, password) => {
    const u = await authService.login(identifier, password);
    setUser(u);
    setIsAuthenticated(true);
    loadNotifications();
    return u;
  };

  const register = async (username, email, password, password2) => {
    const u = await authService.register(username, email, password, password2);
    setUser(u);
    setIsAuthenticated(true);
    return u;
  };

  const googleLogin = async () => {
    // No OAuth endpoint exists on the backend yet.
    throw new Error('Google sign-in is not available yet. Please use your username and password.');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setUnreadCount(0);
  };

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      } catch { /* quota or private mode */ }
      return updated;
    });
  }, []);

  const markNotifRead = async (id) => {
    const updated = await notificationService.markRead(id);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  const markAllNotifsRead = async () => {
    const updated = await notificationService.markAllRead();
    setNotifications(updated);
    setUnreadCount(0);
  };

  const clearAllNotifications = async () => {
    await notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  const addPoints = useCallback((pts) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, points: (prev.points || 0) + pts };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      } catch { /* quota or private mode */ }
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      user, isAuthenticated, loading,
      notifications, unreadCount,
      login, register, googleLogin, logout, updateUser, addPoints,
      markNotifRead, markAllNotifsRead, clearAllNotifications, loadNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
