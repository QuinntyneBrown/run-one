import type { Plan } from '../workout/plan';

/**
 * A class's video (ADR 0012): the YouTube video id and the sync offset, the second of the video at which the ride's
 * 0:00 falls.
 */
export interface ClassVideo {
  readonly videoId: string;
  readonly syncOffsetSeconds: number;
}

/**
 * The class as the app holds it (L2-080, ADR 0037): its words, its length, the plan the ride follows and its video.
 * Telo Ride 1 has one, shipped with the app, and one course to ride it in, which the class does not name (L2-173 AC9).
 */
export interface ClassDefinition {
  readonly id: string;
  readonly title: string;
  readonly channel: string;
  readonly focus: string;
  readonly lengthSeconds: number;
  readonly summary: string;
  readonly plan: Plan;
  readonly video: ClassVideo;
}
