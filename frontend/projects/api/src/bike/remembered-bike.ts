import { InjectionToken } from '@angular/core';

/** All that is kept of the remembered bike (L2-015 AC4): the browser's identifier for the device, and its name. */
export interface RememberedBikeRecord {
  readonly id: string;
  readonly name: string;
}

/** The bike this browser paired, kept so Telo Ride 1 can open on The Class and reconnect without the chooser (L2-015). */
export interface RememberedBike {
  /** The remembered bike, or `null` when there is none or its record cannot be read. */
  get(): RememberedBikeRecord | null;
  /** Remembers the bike in place of any other (L2-015 AC3): its identifier and name, and nothing else. */
  save(bike: RememberedBikeRecord): void;
  forget(): void;
}

export const REMEMBERED_BIKE = new InjectionToken<RememberedBike>('REMEMBERED_BIKE');
