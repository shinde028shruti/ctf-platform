import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { statsService } from '../services/statsService';

const AppContext = createContext(null);

const USER_KEY = 'cyberforge_user';

/**
 * Translate the stats payload into the field names the existing UI already
 * reads off `user` (rank, solvedChallenges, categoryStats, progress arrays,
 * recentActivity). This keeps every consumer - Dashboard, Profile, Sidebar,
 * Achievements - showing real backend data without each one being rewired.
 */
function statsToUserFields(stats) {
  return {
    rank: stats.rank,
    accuracy: stats.accuracy,
    earnedPoints: stats.earnedPoints,
    spentOnHints: stats.spentOnHints,
    // Server-derived level/rank/Elite, shared verbatim by Dashboard, Profile and
    // the Sidebar so all three always agree. Null until the stats call lands.
    progression: stats.progression ?? null,
    solvedChallenges: stats.solvedChallengeIds ?? [],
    categoryStats: Object.fromEntries(
      (stats.categoryProgress ?? []).map(c => [
        c.name,
        { solved: c.solved, total: c.total, points: c.points },
      ]),
    ),
    recentActivity: (stats.recentActivity ?? []).map((a, i) => ({
      id: `${a.type}-${a.challengeId}-${a.timestamp}-${i}`,
      ...a,
    })),
    weeklyProgress: stats.progress?.weekly ?? [],
    monthlyProgress: stats.progress?.monthly ?? [],
    joinDate: stats.joinDate ?? null,
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bumped on every login / logout / session-expiry. A notification request
  // captures the value it started with and discards its result if it changed,
  // so a slow response can never repopulate the previous account's data after
  // a logout or an account switch.
  const sessionRef = useRef(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

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

  /**
   * Load the current user's statistics and fold them into the user object.
   * One request per authenticated session; the pages read the derived fields
   * without each re-fetching the leaderboard or recomputing anything.
   */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await statsService.getMyStats();
      setStats(data);
      updateUser(statsToUserFields(data));
      return data;
    } catch (err) {
      setStatsError(err?.message || 'Could not load your statistics.');
      return null;
    } finally {
      setStatsLoading(false);
    }
  }, [updateUser]);

  const clearStats = useCallback(() => {
    setStats(null);
    setStatsError(null);
    setStatsLoading(false);
  }, []);

  /**
   * Load the authenticated user's notifications and unread total from the API.
   *
   * Both requests carry the session epoch; if the session changed while they
   * were in flight (logout, account switch, expiry) the result is discarded, so
   * one account's notifications can never land in another account's state.
   * There is no mock fallback: a failure surfaces as an error the panel shows.
   */
  const loadNotifications = useCallback(async () => {
    const epoch = sessionRef.current;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const [list, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      if (epoch !== sessionRef.current) return null;
      setNotifications(list);
      setUnreadCount(count);
      return list;
    } catch (err) {
      if (epoch !== sessionRef.current) return null;
      setNotificationsError(err?.message || 'Could not load notifications.');
      return null;
    } finally {
      if (epoch === sessionRef.current) setNotificationsLoading(false);
    }
  }, []);

  /**
   * Re-read the authoritative unread total after a mutation. The count always
   * comes from the server - it is never adjusted locally - so it cannot drift
   * or go negative.
   */
  const refreshUnreadCount = useCallback(async () => {
    const epoch = sessionRef.current;
    try {
      const count = await notificationService.getUnreadCount();
      if (epoch !== sessionRef.current) return;
      setUnreadCount(count);
    } catch { /* keep the last known count; never invent one */ }
  }, []);

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
          loadStats();
        } else {
          setLoading(false);
        }
      } catch {
        if (cancelled) return;
        sessionRef.current += 1;
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        setNotifications([]);
        setUnreadCount(0);
        setNotificationsError(null);
        clearStats();
        setLoading(false);
      }
    };

    restore();

    return () => { cancelled = true; };
  }, [loadStats, clearStats, loadNotifications]);

  /**
   * The API client fires this when a refresh attempt fails, so the whole app
   * reacts to an expired session instead of each component noticing on its
   * own next request.
   */
  useEffect(() => {
    const handleExpired = () => {
      sessionRef.current += 1;
      setUser(null);
      setIsAuthenticated(false);
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsLoading(false);
      setNotificationsError(null);
      clearStats();
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [clearStats]);

  const login = async (identifier, password) => {
    const u = await authService.login(identifier, password);
    // New session: invalidate any in-flight request from a previous account and
    // clear its data before the fresh load lands.
    sessionRef.current += 1;
    setUser(u);
    setIsAuthenticated(true);
    setNotifications([]);
    setUnreadCount(0);
    setNotificationsError(null);
    loadNotifications();
    loadStats();
    return u;
  };

  const register = async (username, email, password, password2) => {
    const u = await authService.register(username, email, password, password2);
    sessionRef.current += 1;
    setUser(u);
    setIsAuthenticated(true);
    setNotifications([]);
    setUnreadCount(0);
    setNotificationsError(null);
    loadNotifications();
    loadStats();
    return u;
  };

  const googleLogin = async () => {
    // No OAuth endpoint exists on the backend yet.
    throw new Error('Google sign-in is not available yet. Please use your username and password.');
  };

  const logout = async () => {
    // Invalidate in-flight notification requests first so a late response
    // cannot repopulate the state we are about to clear.
    sessionRef.current += 1;
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setUnreadCount(0);
    setNotificationsLoading(false);
    setNotificationsError(null);
    clearStats();
  };

  const markNotifRead = useCallback(async (id) => {
    const updated = await notificationService.markRead(id);
    // Replace just that row, then reconcile the badge with the server. A
    // failure throws before any state changes, so a failed mutation leaves the
    // list and count untouched.
    setNotifications(prev => prev.map(n => (n.id === id ? updated : n)));
    await refreshUnreadCount();
    return updated;
  }, [refreshUnreadCount]);

  const markAllNotifsRead = useCallback(async () => {
    const updated = await notificationService.markAllRead();
    // The endpoint marks every unread row of the caller, so afterwards none are
    // unread; still reconcile with the server to stay authoritative.
    setNotifications(prev => prev.map(n => (n.read ? n : { ...n, read: true })));
    setUnreadCount(0);
    await refreshUnreadCount();
    return updated;
  }, [refreshUnreadCount]);

  const deleteNotification = useCallback(async (id) => {
    await notificationService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    await refreshUnreadCount();
  }, [refreshUnreadCount]);

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
      notifications, unreadCount, notificationsLoading, notificationsError,
      stats, statsLoading, statsError, refreshStats: loadStats,
      login, register, googleLogin, logout, updateUser, addPoints,
      markNotifRead, markAllNotifsRead, deleteNotification,
      loadNotifications, refreshUnreadCount,
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
