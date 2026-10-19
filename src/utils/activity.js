/**
 * activity.js
 * Stable React keys for "recent activity" entries.
 *
 * The backend activity shape (submissions/stats.py `recent_activity`, mirrored
 * by ActivityEntrySerializer) is:
 *
 *   { type, challengeId, challengeName, points, cost, timestamp }
 *
 * There is no `id`, so keying a list with `entry.id` yields `undefined` for
 * every row and React warns about a missing key. Build a stable composite from
 * the immutable fields instead.
 */

/**
 * A stable, unique key for one activity entry.
 *
 * `timestamp` (always present, microsecond precision) is the uniqueness anchor;
 * `type` and the challenge/badge identifier keep solve and hint rows apart, and
 * `points`/`cost` separate two different hints unlocked on the same challenge.
 * The result is never empty, so it cannot silently collapse into a duplicate
 * React key.
 *
 * @param {object | null | undefined} entry
 * @returns {string}
 */
export function activityKey(entry) {
  if (!entry || typeof entry !== 'object') return 'activity:unknown';

  const type = entry.type || 'activity';
  const target = entry.challengeId ?? entry.badge ?? entry.id ?? 'none';
  const at = entry.timestamp ?? entry.createdAt ?? 'unknown';
  const points = entry.points ?? '';
  const cost = entry.cost ?? '';

  return `${type}:${target}:${at}:${points}:${cost}`;
}
