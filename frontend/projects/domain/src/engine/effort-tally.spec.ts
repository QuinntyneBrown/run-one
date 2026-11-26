// Unit test
// Traces to: L2-169 AC2
// Description: an effort's watts are the mean of the rider's power over the running seconds of that work segment,
// rounded; seconds with unknown power count as 0 W; a stretch of seconds a hidden tab skipped counts at the power of
// the moment, split across the segments it overlaps; nothing but work segments is counted.
import type { Segment } from '@telo/api';
import { EffortTally } from './effort-tally';

const plan: readonly Segment[] = [
  { kind: 'warm-up', duration: 10, level: 1, cadenceAim: 80 },
  { kind: 'work', duration: 4, level: 2, cadenceAim: 80 },
  { kind: 'recover', duration: 6, level: 1, cadenceAim: 80 },
  { kind: 'work', duration: 3, level: 2, cadenceAim: 80 },
  { kind: 'cool-down', duration: 5, level: 1, cadenceAim: 80 },
];

/** Rides second by second to `seconds`, at `power(second)`. */
function ride(tally: EffortTally, seconds: number, power: (second: number) => number | null): void {
  for (let second = 1; second <= seconds; second++) tally.add(power(second), second - 1, second);
}

describe('EffortTally', () => {
  it('has one effort for each work segment, in plan order, at 0 W before anything is ridden', () => {
    expect(new EffortTally(plan).watts()).toEqual([0, 0]);
  });

  it('averages the power over each work segment’s seconds, rounded (AC2)', () => {
    const tally = new EffortTally(plan);
    // The first effort is seconds 11 to 14, the second seconds 21 to 23.
    ride(tally, 28, (second) =>
      second >= 11 && second <= 14 ? 200 + (second - 11) : second >= 21 && second <= 23 ? 100 : 500,
    );
    expect(tally.watts()).toEqual([202, 100]); // (200+201+202+203)/4 = 201.5 rounds to 202
  });

  it('counts a second of unknown power as 0 W (AC2)', () => {
    const tally = new EffortTally(plan);
    ride(tally, 28, (second) => (second >= 11 && second <= 12 ? 300 : null));
    expect(tally.watts()).toEqual([150, 0]);
  });

  it('splits a stretch of skipped seconds across the segments it overlaps, at the one power', () => {
    const tally = new EffortTally(plan);
    // One report for seconds 9 to 22: seconds 11 to 14 of the first effort and 21 to 22 of the second count at 400.
    tally.add(400, 8, 22);
    tally.add(0, 22, 28);
    expect(tally.watts()).toEqual([400, Math.round((2 * 400) / 3)]);
  });

  it('counts nothing but the work segments', () => {
    const tally = new EffortTally(plan);
    ride(tally, 10, () => 900);
    ride(tally, 28, () => 0);
    expect(tally.watts()).toEqual([0, 0]);
  });

  it('ignores seconds past the plan’s end', () => {
    const tally = new EffortTally(plan);
    tally.add(900, 28, 60);
    expect(tally.watts()).toEqual([0, 0]);
  });

  it('holds one total for each effort however long the ride (L2-138 AC2)', () => {
    const segments = plan;
    const tally = new EffortTally(segments);
    const total = segments.reduce((sum, segment) => sum + segment.duration, 0);
    for (let second = 0; second < total; second++) tally.add(250, second, second + 1);
    for (let second = 0; second < 3_600; second++)
      tally.add(250, total + second, total + second + 1);

    expect(tally.watts()).toHaveLength(
      segments.filter((segment) => segment.kind === 'work').length,
    );
    expect(JSON.stringify(Object.values(tally)).length).toBeLessThan(2_000);
  });
});
