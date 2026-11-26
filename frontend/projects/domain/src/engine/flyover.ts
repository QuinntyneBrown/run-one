// The flyover's timing (L2-179 AC2, AC3, AC8): a flight of 9 seconds from the grid to the finish line, then the
// landing held for 0.9 seconds; a flyover whose course is not drawn in 10 seconds gives way. The timings are the
// prototype's, not tried on a bike (open question 42).

/** How long the flight from the grid to the finish line takes. */
export const FLIGHT_MS = 9_000;
/** How long the landing on the grid is held before Class Ride opens. */
export const LANDED_MS = 900;
/** How long the flyover waits for the course to be drawn before it gives way to Class Ride. */
export const GIVE_UP_MS = 10_000;
/** The places the camera is over in turn, a fifth of the flight each. */
export const FLYOVER_PLACE_COUNT = 5;

/** Where the flight stands `elapsedMs` after it started. */
export interface FlyoverAt {
  /** The share of the flight flown, 0 to 1. */
  readonly share: number;
  /** The place the camera is over, 0 to 4. */
  readonly place: number;
}

export function flyoverAt(elapsedMs: number): FlyoverAt {
  const share = Math.min(Math.max(elapsedMs / FLIGHT_MS, 0), 1);
  return {
    share,
    place: Math.min(Math.floor(share * FLYOVER_PLACE_COUNT), FLYOVER_PLACE_COUNT - 1),
  };
}
