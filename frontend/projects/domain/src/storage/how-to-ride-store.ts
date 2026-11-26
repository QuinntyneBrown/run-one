import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { HowToRide, RideWith } from '@telo/api';

/** Where the choice lives in localStorage. */
export const HOW_TO_RIDE_KEY = 'telo-ride.ride-with';

/**
 * The rider's choice of how to ride as one value in localStorage (L2-173 AC2), read synchronously so The Class and
 * the class ride open on it. A value it does not know, or storage the browser refuses, counts as never chosen.
 */
@Injectable()
export class HowToRideStore implements HowToRide {
  private readonly window = inject(DOCUMENT).defaultView;

  kept(): RideWith | null {
    try {
      const raw = this.window?.localStorage.getItem(HOW_TO_RIDE_KEY);
      return raw === 'video' || raw === 'ibiza' ? raw : null;
    } catch {
      return null;
    }
  }

  keep(way: RideWith): void {
    try {
      this.window?.localStorage.setItem(HOW_TO_RIDE_KEY, way);
    } catch {
      // Storage refused (private mode, quota): the choice lasts for this visit.
    }
  }
}
