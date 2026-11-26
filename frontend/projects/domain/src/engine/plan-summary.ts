import type { Segment } from '@telo/api';
import { PowerModel } from './power-model';

/** A plan's efforts, its work segments (L2-084 AC2): how many, and the shortest and the longest in seconds. */
export interface PlanEfforts {
  readonly count: number;
  readonly shortest: number;
  readonly longest: number;
}

/**
 * What a plan says in numbers, for The Class (L2-084 AC2):
 * - its efforts: how many, the shortest and the longest;
 * - its expected average power: each segment's target power (L2-023 AC3) weighted by its duration, rounded.
 */
export const PlanSummary = {
  /** The plan's efforts (L2-084 AC2): its work segments, counted, with the shortest and the longest; zeros with none. */
  efforts(segments: readonly Segment[]): PlanEfforts {
    const lengths = segments
      .filter((segment) => segment.kind === 'work')
      .map((segment) => segment.duration);
    return lengths.length === 0
      ? { count: 0, shortest: 0, longest: 0 }
      : { count: lengths.length, shortest: Math.min(...lengths), longest: Math.max(...lengths) };
  },

  averagePower(segments: readonly Segment[]): number {
    const length = segments.reduce((total, segment) => total + segment.duration, 0);
    if (length === 0) return 0;
    const work = segments.reduce(
      (total, segment) =>
        total + PowerModel.target(segment.cadenceAim, segment.level) * segment.duration,
      0,
    );
    return Math.round(work / length);
  },
} as const;
