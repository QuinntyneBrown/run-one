import type { Segment } from '@telo/api';
import { classStepAnnouncement } from './step-announcement';

// Traces to: L2-141 AC2
// What a screen reader hears as a class's segment starts: its kind and length.
const segment = (kind: Segment['kind'], duration: number, level: number): Segment => ({
  kind,
  duration,
  level,
  cadenceAim: 80,
});

describe('classStepAnnouncement', () => {
  it.each([
    [segment('warm-up', 300, 8), 'Warm-up, 5:00'],
    [segment('work', 30, 24), 'Work, 0:30'],
    [segment('recover', 90, 6), 'Recover, 1:30'],
  ])('says %o as "%s"', (step, heard) => {
    expect(classStepAnnouncement(step)).toBe(heard);
  });
});
