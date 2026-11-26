// Unit test
// Traces to: L2-179 AC2
// Description: the flight is 9 s from the grid to the finish line, a fifth of it over each of five places.
import { FLIGHT_MS, GIVE_UP_MS, LANDED_MS, flyoverAt } from './flyover';

describe('flyoverAt', () => {
  it.each([
    [0, 0, 0],
    [1_799, 1_799 / 9_000, 0],
    [1_800, 0.2, 1],
    [3_600, 0.4, 2],
    [5_400, 0.6, 3],
    [7_200, 0.8, 4],
    [9_000, 1, 4],
    [20_000, 1, 4],
  ])('at %i ms it has flown %d over place %i', (elapsed, share, place) => {
    const at = flyoverAt(elapsed);
    expect(at.share).toBeCloseTo(share, 6);
    expect(at.place).toBe(place);
  });

  it('keeps the timings the requirement gives', () => {
    expect([FLIGHT_MS, LANDED_MS, GIVE_UP_MS]).toEqual([9_000, 900, 10_000]);
  });
});
