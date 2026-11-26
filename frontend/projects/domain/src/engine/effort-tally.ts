import type { Segment } from '@telo/api';

/**
 * The watts of each of the class's efforts, its work segments in plan order (L2-169 AC2): the mean of the rider's power
 * over the running seconds of the segment, rounded, with a second of unknown power counting as 0 W. It holds one sum a
 * work segment however long the ride. A stretch of seconds a hidden tab skipped is added at the power of the moment,
 * split across the segments it overlaps, as the ride's output counts it.
 */
export class EffortTally {
  private readonly efforts: { start: number; end: number; joules: number }[] = [];

  constructor(segments: readonly Segment[]) {
    let start = 0;
    for (const segment of segments) {
      const end = start + segment.duration;
      if (segment.kind === 'work') this.efforts.push({ start, end, joules: 0 });
      start = end;
    }
  }

  /** The seconds after `fromSecond` up to `toSecond` of the ride clock, ridden at `powerW` (null counts as 0 W). */
  add(powerW: number | null, fromSecond: number, toSecond: number): void {
    for (const effort of this.efforts) {
      const seconds = Math.min(toSecond, effort.end) - Math.max(fromSecond, effort.start);
      if (seconds > 0) effort.joules += (powerW ?? 0) * seconds;
    }
  }

  /** Each effort's average watts, rounded, in plan order. */
  watts(): number[] {
    return this.efforts.map(({ start, end, joules }) => Math.round(joules / (end - start)));
  }
}
