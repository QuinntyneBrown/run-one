// Unit test
// Traces to: L2-084 AC2; L2-099 AC1, AC2, AC3
// Description: a plan's efforts are counted with the shortest and the longest; its expected average power is each
// segment's target power weighted by its duration, rounded.
import type { Segment, SegmentKind } from '@telo/api';
import { INTERVALS_TO_THE_BEAT } from './intervals-to-the-beat';
import { PlanSummary } from './plan-summary';

const seg = (kind: SegmentKind, duration: number, level: number, cadenceAim: number): Segment => ({
  kind,
  duration,
  level,
  cadenceAim,
});

const gcnHiit: Segment[] = [
  seg('warm-up', 300, 8, 80),
  ...[180, 150, 150, 120, 120, 90, 90].flatMap((rest) => [
    seg('work', 30, 24, 100),
    seg('recover', rest, 6, 72),
  ]),
  seg('work', 30, 24, 100),
  seg('cool-down', 360, 6, 68),
];

describe('PlanSummary', () => {
  it('weights each segment’s target power by its duration: ~154 W for the GCN HIIT ladder', () => {
    expect(PlanSummary.averagePower(gcnHiit)).toBe(154);
  });

  it('reads ~205 W for 30 minutes held at level 12 and 85 rpm (L2-099 AC2)', () => {
    expect(PlanSummary.averagePower([seg('steady', 1800, 12, 85)])).toBe(205);
  });

  it('reads 254 W for Intervals to the Beat, 253.55 W before rounding (L2-084 AC3)', () => {
    expect(PlanSummary.averagePower(INTERVALS_TO_THE_BEAT.plan.segments)).toBe(254);
  });

  it.each([
    ['Intervals to the Beat', INTERVALS_TO_THE_BEAT.plan.segments, 17, 15, 75],
    ['the GCN HIIT ladder, every effort the same length', gcnHiit, 8, 30, 30],
    ['a plan with no effort', [seg('warm-up', 300, 8, 80), seg('steady', 3300, 9, 85)], 0, 0, 0],
    ['an empty plan', [], 0, 0, 0],
  ])(
    'counts the efforts of %s, with the shortest and the longest (L2-084 AC2)',
    (_, segments, count, shortest, longest) => {
      expect(PlanSummary.efforts(segments)).toEqual({ count, shortest, longest });
    },
  );

  it('reads 0 W for an empty plan', () => {
    expect(PlanSummary.averagePower([])).toBe(0);
  });
});
