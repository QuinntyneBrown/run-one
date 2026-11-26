import { Injectable } from '@angular/core';
import type { PlayerState } from '@telo/api';

/** How many seconds of the ride the video may go without playing before it counts as unable to play (L2-088 AC4). */
export const VIDEO_STALL_SECONDS = 10;

/**
 * Tells a class video that cannot play from one that is only starting or catching up
 * (docs/detailed-designs/class-ride/ride-the-class). With no network YouTube's player reports no error: it stays
 * loading, or buffers for good. So the ride asks once a second of its own clock, and a video that has not played for
 * 10 s of the ride cannot play (L2-088 AC4, L2-131 AC1). The count is in the ride's seconds, which stand still while
 * the ride is held, and it starts again whenever the video plays.
 */
@Injectable()
export class VideoStallWatch {
  private since: number | null = null;

  /** Whether the video, in `state` at the ride's whole `second`, has now gone 10 s of the ride without playing. */
  check(state: PlayerState, second: number): boolean {
    if (state === 'playing') {
      this.since = null;
      return false;
    }
    this.since ??= second;
    return second - this.since >= VIDEO_STALL_SECONDS;
  }

  /** Forgets the time without play: a new player starts its own count (L2-186 AC6). */
  reset(): void {
    this.since = null;
  }
}
