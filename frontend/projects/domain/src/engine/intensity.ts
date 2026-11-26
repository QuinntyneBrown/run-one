import { Injectable, signal } from '@angular/core';
import { MAX_RESISTANCE, MIN_RESISTANCE } from '../protocol/echelon-protocol';

/** The intensity a ride starts at when the rider keeps none: the class as it is (L2-183 AC2, ADR 0050). */
export const DEFAULT_INTENSITY = 5;
/** The intensity's range, like a volume control (L2-183 AC1). */
export const MIN_INTENSITY = 0;
export const MAX_INTENSITY = 10;

/** An intensity as the ride can hold it: a whole number from 0 to 10. */
export function clampIntensity(intensity: number): number {
  return Math.min(MAX_INTENSITY, Math.max(MIN_INTENSITY, Math.round(intensity)));
}

/**
 * The level a segment at `level` is sent at, at `intensity` (L2-183 AC3): round(level × (1 + (intensity − 5) ÷ 10)),
 * halves up, clamped to 1 to 32. At 5 it is `level` itself.
 */
export function intensityLevel(level: number, intensity: number): number {
  const scaled = Math.round(level * (1 + (intensity - DEFAULT_INTENSITY) / 10));
  return Math.min(MAX_RESISTANCE, Math.max(MIN_RESISTANCE, scaled));
}

/**
 * The ride's intensity (docs/detailed-designs/class-ride/set-the-intensity): a signal from 0 to 10 that the rider sets
 * from Class Ride and the engine scales each level by (L2-183). It starts at `start()`'s value, the rider's default,
 * or 5. Provided by the ride's page, so it goes when the rider leaves.
 */
@Injectable()
export class RideIntensity {
  private readonly current = signal(DEFAULT_INTENSITY);

  readonly value = this.current.asReadonly();

  /** The ride opens at `intensity`, the rider's kept default (L2-183 AC2). */
  start(intensity: number): void {
    this.current.set(clampIntensity(intensity));
  }

  /** Sets the intensity, whole and within 0 to 10; returns whether it changed. */
  set(intensity: number): boolean {
    const next = clampIntensity(intensity);
    if (next === this.current()) return false;
    this.current.set(next);
    return true;
  }

  raise(): boolean {
    return this.set(this.current() + 1);
  }

  lower(): boolean {
    return this.set(this.current() - 1);
  }
}
