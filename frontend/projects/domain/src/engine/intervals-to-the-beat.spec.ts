// Unit test
// Traces to: L2-080 AC1, AC2, AC6
// Description: Intervals to the Beat as it ships with the app (ADR 0037): its words, its video and its plan, one case
// per row of L2-080's table: each segment's kind, the second it starts at, its length, its level and its cadence aim.
// The 33 segments add up to 20:00, and efforts 9 and 10, and 11 and 12, are back to back.
import type { SegmentKind } from '@telo/api';
import { INTERVALS_TO_THE_BEAT } from './intervals-to-the-beat';

/** "2:30" in seconds. */
const seconds = (clock: string): number => {
  const [minutes, rest] = clock.split(':').map(Number);
  return minutes * 60 + rest;
};

/** L2-080 AC2's table: the segments (from 1), their kind, where each starts, its length, its level and its aim. */
const ROWS: readonly (readonly [number[], SegmentKind, string[], string, number, number])[] = [
  [[1], 'warm-up', ['0:00'], '2:30', 14, 80],
  [[2], 'work', ['2:30'], '0:45', 19, 70],
  [[3], 'recover', ['3:15'], '0:30', 14, 90],
  [[4], 'work', ['3:45'], '1:15', 21, 80],
  [[5], 'recover', ['5:00'], '1:00', 13, 90],
  [[6, 8, 10], 'work', ['6:00', '7:00', '8:00'], '0:30', 21, 74],
  [[7, 9, 11], 'recover', ['6:30', '7:30', '8:30'], '0:30', 13, 90],
  [[12, 14, 16], 'work', ['9:00', '10:00', '11:00'], '0:30', 22, 65],
  [[13, 15, 17], 'recover', ['9:30', '10:30', '11:30'], '0:30', 11, 90],
  [[18, 21], 'work', ['12:00', '13:15'], '0:15', 24, 70],
  [[19, 22], 'work', ['12:15', '13:30'], '0:30', 21, 90],
  [[20, 23], 'recover', ['12:45', '14:00'], '0:30', 11, 90],
  [[24, 26, 28, 30, 32], 'work', ['14:30', '15:10', '15:50', '16:30', '17:10'], '0:20', 22, 110],
  [[25, 27, 29, 31], 'recover', ['14:50', '15:30', '16:10', '16:50'], '0:20', 11, 90],
  [[33], 'cool-down', ['17:30'], '2:30', 11, 81],
];

describe('Intervals to the Beat', () => {
  const { plan } = INTERVALS_TO_THE_BEAT;
  /** The second each segment starts at. */
  const starts = plan.segments.map((_, index) =>
    plan.segments.slice(0, index).reduce((total, segment) => total + segment.duration, 0),
  );

  it('is the class of L2-080 AC1: its id, words, length and video', () => {
    expect({ ...INTERVALS_TO_THE_BEAT, plan: null }).toEqual({
      id: 'intervals-to-the-beat',
      title: 'Intervals to the Beat',
      channel: 'GCN Training',
      focus: 'Intervals',
      lengthSeconds: 1200,
      summary:
        'Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast sprints to finish.',
      video: { videoId: 'il_OFz6o42I', syncOffsetSeconds: 3 },
      plan: null,
    });
  });

  it.each(ROWS)(
    'segments %j are %s, starting at %j, %s long, at level %i aiming %i rpm',
    (numbers, kind, startsAt, length, level, cadenceAim) => {
      numbers.forEach((number, at) => {
        expect(plan.segments[number - 1]).toEqual({
          kind,
          duration: seconds(length),
          level,
          cadenceAim,
        });
        expect(starts[number - 1]).toBe(seconds(startsAt[at]));
      });
    },
  );

  it('has 33 segments that add up to 20:00, 17 of them efforts', () => {
    expect(plan.segments).toHaveLength(33);
    expect(plan.segments.reduce((total, segment) => total + segment.duration, 0)).toBe(1200);
    expect(plan.segments.filter((segment) => segment.kind === 'work')).toHaveLength(17);
    expect(ROWS.flatMap(([numbers]) => numbers).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 33 }, (_, index) => index + 1),
    );
  });

  it('rides efforts 9 and 10, and 11 and 12, back to back with no recovery between (AC6)', () => {
    const kinds = plan.segments.map((segment) => segment.kind);
    expect(kinds.slice(17, 20)).toEqual(['work', 'work', 'recover']);
    expect(kinds.slice(20, 23)).toEqual(['work', 'work', 'recover']);
  });
});
