import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { IntensityDefault } from '@telo/api';
import { DEFAULT_INTENSITY, MAX_INTENSITY, MIN_INTENSITY } from '../engine/intensity';

/** Where the default lives in localStorage. */
export const INTENSITY_KEY = 'telo-ride.intensity';

/**
 * The rider's default intensity as one value in localStorage (L2-184), read synchronously so a ride opens at it
 * (L2-183 AC2). It is untrusted data (L2-129): anything but a whole number from 0 to 10, or storage the browser
 * refuses, counts as 5 (L2-184 AC5).
 */
@Injectable()
export class IntensityStore implements IntensityDefault {
  private readonly window = inject(DOCUMENT).defaultView;

  kept(): number {
    try {
      const raw = this.window?.localStorage.getItem(INTENSITY_KEY) ?? '';
      if (!/^\d{1,2}$/.test(raw)) return DEFAULT_INTENSITY;
      const intensity = Number(raw);
      return intensity >= MIN_INTENSITY && intensity <= MAX_INTENSITY
        ? intensity
        : DEFAULT_INTENSITY;
    } catch {
      return DEFAULT_INTENSITY;
    }
  }

  keep(intensity: number): boolean {
    try {
      this.window?.localStorage.setItem(INTENSITY_KEY, String(intensity));
      return true;
    } catch {
      return false;
    }
  }
}
