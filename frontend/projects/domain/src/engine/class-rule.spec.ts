// Unit test
// Traces to: L2-080 AC3
// Description: the rules a class's plan must meet, one case per rule: every level is 1 to 32, every segment has a
// cadence aim, there are exactly 17 work segments, and the segment lengths add up to the class's 20:00. The first rule
// a class breaks is named; a class that breaks none is valid.
import type { ClassDefinition, Segment } from '@telo/api';
import { ClassRule } from './class-rule';
import { INTERVALS_TO_THE_BEAT } from './intervals-to-the-beat';

/** The class with its segment at `index` (from 0) changed. */
const withSegment = (index: number, change: Partial<Segment>): ClassDefinition => ({
  ...INTERVALS_TO_THE_BEAT,
  plan: {
    segments: INTERVALS_TO_THE_BEAT.plan.segments.map((segment, at) =>
      at === index ? { ...segment, ...change } : segment,
    ),
  },
});

describe('ClassRule', () => {
  it('finds nothing wrong with Intervals to the Beat', () => {
    expect(ClassRule.broken(INTERVALS_TO_THE_BEAT)).toBeNull();
  });

  it.each([
    ['a level below 1', withSegment(0, { level: 0 }), 'level'],
    ['a level above 32', withSegment(17, { level: 33 }), 'level'],
    ['a level that is no whole number', withSegment(4, { level: 13.5 }), 'level'],
    ['a segment with no cadence aim', withSegment(32, { cadenceAim: 0 }), 'cadence_aim'],
    ['a cadence aim that is no number', withSegment(2, { cadenceAim: Number.NaN }), 'cadence_aim'],
    ['sixteen work segments', withSegment(1, { kind: 'recover' }), 'efforts'],
    ['eighteen work segments', withSegment(2, { kind: 'work' }), 'efforts'],
    ['segments that add up to 19:59', withSegment(0, { duration: 149 }), 'length'],
    ['segments that add up to 20:01', withSegment(32, { duration: 151 }), 'length'],
    ['a segment with no length', withSegment(5, { duration: 0 }), 'length'],
    [
      'a length the plan does not add up to',
      { ...INTERVALS_TO_THE_BEAT, lengthSeconds: 1800 },
      'length',
    ],
  ] as const)('%s breaks the rule "%s"', (_, definition, rule) => {
    expect(ClassRule.broken(definition)).toBe(rule);
  });
});
