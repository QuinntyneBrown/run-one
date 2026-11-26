import type { Segment } from '@telo/api';
import { RIDE_KINDS, formatClock } from '@telo/components';

/** What a screen reader hears as a class's segment starts (L2-141 AC2), in the segment card's words: "Work, 0:30". */
export function classStepAnnouncement(segment: Segment): string {
  return `${RIDE_KINDS[segment.kind].label}, ${formatClock(segment.duration)}`;
}
