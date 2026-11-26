import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { FinishedRides, RideRecord, RideRecordSnapshot } from '@telo/api';

/** Where the record lives in localStorage. */
export const RIDE_RECORD_KEY = 'telo-ride.record';

const NONE: RideRecordSnapshot = { rides: 0, bestKj: null, lastKj: null };

/**
 * The record as one small JSON value in localStorage (L2-168): the ride count, the best output and the last output, in
 * whole kJ, so it is the same size after any number of rides (AC5), read synchronously so the app can open by it
 * (L2-167). It answers `FinishedRides` from its count. A value it cannot read, or storage the browser refuses, counts as
 * no rides; the rider is then new (L2-132 AC4).
 */
@Injectable()
export class RideRecordStore implements RideRecord, FinishedRides {
  private readonly window = inject(DOCUMENT).defaultView;

  read(): RideRecordSnapshot {
    try {
      const raw = this.window?.localStorage.getItem(RIDE_RECORD_KEY);
      return raw ? parse(JSON.parse(raw)) : NONE;
    } catch {
      return NONE;
    }
  }

  any(): boolean {
    return this.read().rides > 0;
  }

  add(outputKj: number): boolean {
    const before = this.read();
    const last = Math.max(0, Math.round(outputKj));
    const best = before.bestKj === null ? last : Math.max(before.bestKj, last);
    try {
      this.window?.localStorage.setItem(
        RIDE_RECORD_KEY,
        JSON.stringify({ rides: before.rides + 1, best, last }),
      );
      return true;
    } catch {
      return false;
    }
  }
}

function parse(value: unknown): RideRecordSnapshot {
  if (typeof value !== 'object' || value === null) return NONE;
  const { rides, best, last } = value as Record<string, unknown>;
  return Number.isInteger(rides) &&
    (rides as number) >= 0 &&
    Number.isInteger(best) &&
    (best as number) >= 0 &&
    Number.isInteger(last) &&
    (last as number) >= 0
    ? { rides: rides as number, bestKj: best as number, lastKj: last as number }
    : NONE;
}
