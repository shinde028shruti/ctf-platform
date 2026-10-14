import { useEffect, useState } from 'react';

/**
 * First-run vs returning-user greeting.
 *
 * A brand-new account lands on the dashboard straight after onboarding, so
 * "Welcome back" is wrong there. We record the first dashboard view per user in
 * localStorage: no flag means first time -> "Welcome", flag present means the
 * browser has seen this account before -> "Welcome back".
 *
 * The key is namespaced per username so one user on a shared browser does not
 * make another user's first visit look like a return trip.
 *
 * Reads synchronously in the state initializer so the very first paint already
 * has the correct word (no "Welcome back" flashing to "Welcome"), and writes
 * the flag in an effect so recording the visit causes no re-render.
 */
export default function useGreeting(username) {
  const key = username ? `cyberforge_visited_${username}` : null;

  const [visited] = useState(() => {
    if (!key) return true;
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      // Storage unavailable (private mode / blocked cookies). Assume returning
      // so we never claim a first visit we cannot remember.
      return true;
    }
  });

  useEffect(() => {
    if (!key) return;
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Non-fatal: the greeting degrades to "Welcome" on every visit.
    }
  }, [key]);

  return visited ? 'Welcome back' : 'Welcome';
}