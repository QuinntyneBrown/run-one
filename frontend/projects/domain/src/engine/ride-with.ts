import type { RideWith } from '@telo/api';

/**
 * How the class is ridden (L2-173): what the rider kept, "Class video" for a rider who has never chosen (AC1), and
 * "Class video" whatever was kept where the browser cannot draw the course (AC6).
 */
export function rideWith(kept: RideWith | null, drawable: boolean): RideWith {
  return kept === 'ibiza' && drawable ? 'ibiza' : 'video';
}
