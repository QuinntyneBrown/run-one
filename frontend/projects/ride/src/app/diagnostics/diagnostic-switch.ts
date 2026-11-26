/** The address query that switches the diagnostic recording on: `/?diagnose` (L2-178 AC2, ADR 0048). */
export const DIAGNOSE_PARAM = 'diagnose';

/**
 * Whether the app was opened with the diagnostic recording switched on. This is the one place that decides it. The
 * query is read once, when the first route loads, so a later navigation that drops it keeps the recording, and a
 * reload without it is the plain app. Nothing is stored.
 */
export function diagnosticsRequested(search: string = location.search): boolean {
  return new URLSearchParams(search).has(DIAGNOSE_PARAM);
}
