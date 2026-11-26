// Where the chase camera sits (L2-174 AC10): behind and above the rider, and nearer on the grid and at the finish
// line, so the ride opens and closes on the rider. It depends on the metres ridden alone. No Three.js here.

/** Through the ride: this far behind the rider and above the road, in metres. */
const BEHIND = 2.75;
const ABOVE = 1.8;
/** On the grid and on the finish line the camera has closed in to this. */
const CLOSE_BEHIND = 2.4;
const CLOSE_ABOVE = 1.65;
/** It closes in over these metres either side of the grid, and either side of the finish line. */
const CLOSE_GRID = 45;
const CLOSE_FINISH = 70;

/** The camera's place by the rider: metres behind them along the road, and metres above it. */
export interface ChaseCamera {
  behind: number;
  above: number;
}

/**
 * The camera for a rider `metres` from the grid on a course whose finish line stands at `finish` metres, written
 * into `into` so a frame allocates nothing. The move is eased, with no step where it starts or ends.
 */
export function chaseCamera(
  metres: number,
  finish: number,
  into: ChaseCamera = { behind: BEHIND, above: ABOVE },
): ChaseCamera {
  const near = Math.max(
    1 - Math.abs(metres) / CLOSE_GRID,
    1 - Math.abs(metres - finish) / CLOSE_FINISH,
    0,
  );
  const close = near * near * (3 - 2 * near);
  into.behind = BEHIND + (CLOSE_BEHIND - BEHIND) * close;
  into.above = ABOVE + (CLOSE_ABOVE - ABOVE) * close;
  return into;
}
