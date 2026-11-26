// Where the flyover's camera sits (L2-179 AC2): above the road, on its way from the grid to the finish line. It depends
// on the share of the flight flown alone. No Three.js here. The height and the look-ahead are the first guess, to be
// measured against the frame budgets (L2-177) when the course is drawn from above (open question 45).

/** The camera hangs this far behind the point it flies over, and above the road, in metres. */
const BEHIND = 40;
const ABOVE = 55;
/** It looks at the road this far ahead of that point, so the road runs up the picture. */
const LOOK_AHEAD = 60;

/** The flyover camera's place: the road's metres it flies over, how far behind and above, and where it looks. */
export interface FlyoverCamera {
  metres: number;
  behind: number;
  above: number;
  ahead: number;
}

/**
 * The camera `share` (0 to 1) of the way along a flight from the grid to the finish line at `finish` metres, written
 * into `into` so a frame allocates nothing.
 */
export function flyoverCamera(
  share: number,
  finish: number,
  into: FlyoverCamera = { metres: 0, behind: BEHIND, above: ABOVE, ahead: LOOK_AHEAD },
): FlyoverCamera {
  into.metres = Math.min(Math.max(share, 0), 1) * finish;
  into.behind = BEHIND;
  into.above = ABOVE;
  into.ahead = LOOK_AHEAD;
  return into;
}
