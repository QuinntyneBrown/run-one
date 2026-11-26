// Unit test
// Traces to: L2-179 AC2
// Description: the flyover camera flies over the road from the grid (share 0) to the finish line (share 1), clamped
// outside that, above the road and looking up it.
import { flyoverCamera } from './flyover-camera';

describe('flyoverCamera', () => {
  it('flies over the grid at the start and the finish line at the end', () => {
    expect(flyoverCamera(0, 1200).metres).toBe(0);
    expect(flyoverCamera(1, 1200).metres).toBe(1200);
    expect(flyoverCamera(0.5, 1200).metres).toBe(600);
  });

  it('stays on the road outside the flight', () => {
    expect(flyoverCamera(-1, 1200).metres).toBe(0);
    expect(flyoverCamera(2, 1200).metres).toBe(1200);
  });

  it('is above the road, looking up it, and writes into what it is given', () => {
    const into = { metres: 0, behind: 0, above: 0, ahead: 0 };
    expect(flyoverCamera(0.2, 1000, into)).toBe(into);
    expect(into.above).toBeGreaterThan(0);
    expect(into.ahead).toBeGreaterThan(0);
  });
});
