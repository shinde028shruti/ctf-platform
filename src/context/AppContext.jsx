import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = authService.getCurrentUser();
    const auth = authService.isAuthenticated();
    setUser(u);
    setIsAuthenticated(auth);
    if (auth) loadNotifications();
    setLoading(false);
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
    await loadNotifications();
    return u;
  };

  const register = async (username, email, password) => {
    const u = await authService.register(username, email, password);
    setUser(u);
    setIsAuthenticated(true);
    return u;
  };

  const googleLogin = async () => {
    const u = await authService.googleLogin();
    setUser(u);
    setIsAuthenticated(true);
    await loadNotifications();
    return u;
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
      const updated = { ...prev, ...updates };
      localStorage.setItem('cyberforge_user', JSON.stringify(updated));
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
      localStorage.setItem('cyberforge_user', JSON.stringify(updated));
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
