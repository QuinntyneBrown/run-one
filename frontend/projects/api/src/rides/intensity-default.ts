import { InjectionToken } from '@angular/core';

/**
 * The rider's default intensity, kept on this device and sent nowhere (L2-184, ADR 0050): the intensity every ride
 * opens at (L2-183 AC2).
 */
export interface IntensityDefault {
  /** The kept default, a whole number from 0 to 10; 5 when none is kept, it cannot be read, or storage refuses. */
  kept(): number;
  /** Keeps `intensity` as the default; `false` when the device would not keep it (L2-184 AC5). */
  keep(intensity: number): boolean;
}

export const INTENSITY_DEFAULT = new InjectionToken<IntensityDefault>('INTENSITY_DEFAULT');
