import { InjectionToken } from '@angular/core';

/**
 * Where the app logs (L2-115): the browser's console, and no remote logging service. An error names its area and the
 * error in plain text, with no email address or session token in it. No per-packet line is written (AC2).
 */
export interface AppLogger {
  /** "[bluetooth] NetworkError: GATT operation failed". */
  error(area: string, error: unknown): void;
}

export const APP_LOGGER = new InjectionToken<AppLogger>('AppLogger');
