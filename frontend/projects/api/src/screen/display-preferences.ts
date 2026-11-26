import { InjectionToken, type Signal } from '@angular/core';

/**
 * Motion and the theme as the app applies them: what this device asks for (L2-142, L2-143). Telo Ride 1 has no
 * Settings, so the rider's device decides (ADR 0040). Every screen, and the world, reads motion from here.
 */
export interface DisplayPreferences {
  /** Whether this device asks for reduced motion (`prefers-reduced-motion: reduce`). */
  readonly reducedMotion: Signal<boolean>;
  /** The theme in use: dark unless this device asks for light (L2-143 AC1, AC2). */
  readonly theme: Signal<'dark' | 'light'>;
}

export const DISPLAY_PREFERENCES = new InjectionToken<DisplayPreferences>('DISPLAY_PREFERENCES');
