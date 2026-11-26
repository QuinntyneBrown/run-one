import { DestroyRef, Injectable, inject } from '@angular/core';
import { ResistanceController } from './resistance-controller';

/** The level the bike eases off to after the finish (L2-182 AC1). The values are the prototype's, not tried on a bike. */
export const EASE_OFF_TO = 4;
/** How long after one level the next is sent (L2-182 AC1). */
export const EASE_OFF_STEP_MS = 110;

/** The levels to send, one below the other, from `from` down to `to`; none when `from` is already at or below `to`. */
export function easeOffLevels(from: number, to: number = EASE_OFF_TO): number[] {
  const levels: number[] = [];
  for (let level = from - 1; level >= to; level--) levels.push(level);
  return levels;
}

/**
 * Eases the bike off after the finish: `start()` reads the target resistance and sends each level of `easeOffLevels`
 * through the resistance controller, 110 ms apart. A bike set by hand is sent nothing (L2-182 AC3). Destroying its
 * owner, or `stop()`, clears the pending level. Provided by the ride's page.
 */
@Injectable()
export class ResistanceEaseOff {
  private readonly resistance = inject(ResistanceController);
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  start(): void {
    this.stop();
    const from = this.resistance.target();
    if (from === null || this.resistance.byHand() || !this.resistance.canControl()) return;
    const levels = easeOffLevels(from);
    const next = (): void => {
      const level = levels.shift();
      if (level === undefined) {
        this.timer = null;
        return;
      }
      void this.resistance.applyPlanLevel(level);
      this.timer = setTimeout(next, EASE_OFF_STEP_MS);
    };
    next();
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
