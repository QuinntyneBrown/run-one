import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { RememberedBike, RememberedBikeRecord } from '@telo/api';
import { cutName } from '../bluetooth/bike-identity';

/** Where the record lives in localStorage. */
export const REMEMBERED_BIKE_KEY = 'telo-ride.bike';

/**
 * The remembered bike as one JSON record in localStorage, read synchronously so the guard can choose The Class or
 * Connect Bike at start-up (docs/detailed-designs/bike/keep-the-bike-connected). It holds the browser's identifier
 * for the bike and its name, and nothing else (L2-015 AC4); the protocol is read from the bike when it reconnects.
 * A record it cannot parse, or storage the browser refuses, counts as no bike.
 */
@Injectable()
export class RememberedBikeStore implements RememberedBike {
  private readonly window = inject(DOCUMENT).defaultView;

  get(): RememberedBikeRecord | null {
    try {
      const raw = this.window?.localStorage.getItem(REMEMBERED_BIKE_KEY);
      return raw ? parse(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  save(bike: RememberedBikeRecord): void {
    const { id, name } = bike;
    try {
      this.window?.localStorage.setItem(
        REMEMBERED_BIKE_KEY,
        JSON.stringify({ id, name: cutName(name) }),
      );
    } catch {
      // Storage refused (private mode, quota): the rider picks the bike again next time.
    }
  }

  forget(): void {
    try {
      this.window?.localStorage.removeItem(REMEMBERED_BIKE_KEY);
    } catch {
      // Nothing to forget where storage is refused.
    }
  }
}

/** The identifier and the name of a record, whatever else an earlier version wrote beside them. */
function parse(value: unknown): RememberedBikeRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const { id, name } = value as Record<string, unknown>;
  if (typeof id !== 'string' || !id || typeof name !== 'string') return null;
  return { id, name: cutName(name) };
}
