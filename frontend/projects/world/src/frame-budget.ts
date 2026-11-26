/** Frames judged before a step, and how their average time must compare with the display's frame period (L2-177 AC3). */
const JUDGED_FRAMES = 90;
const TOO_SLOW = 1.6;
const AT_PACE = 1.1;

/**
 * Which of the course's steps to draw at, from what the frames cost. Every 90 frames it judges their average against
 * the display's frame period: within 1.1 of it, a step up; over 1.6 of it, a step down (to the lowest at the least)
 * and no step up after.
 */
export class FrameBudget {
  tier: number;
  private settled = false;
  private judged = 0;
  private spent = 0;

  constructor(
    private readonly steps: number,
    start: number,
  ) {
    this.tier = start;
  }

  /** Counts a frame that cost `ms`; returns the step taken after it: 1, -1, or 0. */
  frame(ms: number, period: number): number {
    this.spent += ms;
    if (++this.judged < JUDGED_FRAMES) return 0;
    const average = this.spent / this.judged;
    this.restart();
    if (average > period * TOO_SLOW) {
      this.settled = true;
      if (this.tier > 0) {
        this.tier--;
        return -1;
      }
    } else if (!this.settled && average <= period * AT_PACE && this.tier < this.steps - 1) {
      this.tier++;
      return 1;
    }
    return 0;
  }

  /** Begins judging 90 frames afresh, as when the display's period is measured again. */
  restart(): void {
    this.judged = 0;
    this.spent = 0;
  }
}
