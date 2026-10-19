/**
 * focusAreas.js
 * Resolves a user's onboarding "focus areas" into a value that is safe to put
 * in a React effect dependency list.
 *
 * Writing `user?.onboarding?.focusAreas || []` inline builds a brand-new array
 * on every render whenever the account has no saved preferences, so any effect
 * that lists it as a dependency re-runs on every render and can spin into a
 * "Maximum update depth exceeded" loop. Handing back one shared, frozen empty
 * array keeps that reference stable.
 */

/** Shared fallback. Frozen because consumers only read it, and reused so its
 *  identity never changes between renders. */
export const EMPTY_FOCUS_AREAS = Object.freeze([]);

/**
 * The user's focus areas, or a stable shared empty array when the account has
 * none. A provided array (including an empty one) is returned unchanged, so the
 * caller keeps whatever identity the data source gave it.
 *
 * @param {{ onboarding?: { focusAreas?: unknown } } | null | undefined} user
 * @returns {ReadonlyArray<unknown> | unknown[]}
 */
export function resolveFocusAreas(user) {
  const areas = user?.onboarding?.focusAreas;
  return Array.isArray(areas) ? areas : EMPTY_FOCUS_AREAS;
}
