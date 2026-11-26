import { InjectionToken } from '@angular/core';

/** What the rider has done on this device (L2-168): rides finished, the best output and the last, in whole kJ. */
export interface RideRecordSnapshot {
  readonly rides: number;
  /** The highest output of any finished ride, or `null` before the first. */
  readonly bestKj: number | null;
  /** The output of the latest finished ride, or `null` before the first. */
  readonly lastKj: number | null;
}

/**
 * The record of finished rides, kept in the device's storage and sent nowhere (L2-132 AC2). It holds three numbers,
 * whatever the number of rides (L2-168 AC5). A ride left before its finish is never added (L2-168 AC2).
 */
export interface RideRecord {
  /** Read synchronously from the device's storage; a value it cannot read counts as no rides. */
  read(): RideRecordSnapshot;
  /** Counts a finished ride of `outputKj`; returns `false` when the device would not keep it (L2-168 AC4). */
  add(outputKj: number): boolean;
}

export const RIDE_RECORD = new InjectionToken<RideRecord>('RIDE_RECORD');
