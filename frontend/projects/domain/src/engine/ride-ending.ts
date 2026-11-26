import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { MONOTONIC_TIME } from '@telo/api';

/** How long the finish banner shows (L2-181). The timings are the prototype's, not tried on a bike. */
export const BANNER_MS = 3_200;
/** How long the roll-out lasts after the banner (L2-182). */
export const ROLL_OUT_MS = 5_200;

/** How often the roll-out's progress is published (L2-182 AC4). */
export const ROLL_OUT_TICK_MS = 100;

/** Which part of the ending a ride is in, and how far through the roll-out it is. */
export interface RideEndingState {
  readonly stage: 'banner' | 'roll-out' | 'over';
  /** The share of the roll-out that has passed, 0 to 1. */
  readonly rollOutShare: number;
  /** The milliseconds since the finish, which place the rider on the course past the finish line (L2-174 AC7). */
  readonly elapsedMs: number;
}

/** The ending `elapsedMs` after the finish: the banner from 0 ms, the roll-out from 3,200 ms, over from 8,400 ms. */
export function rideEndingAt(elapsedMs: number): RideEndingState {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed < BANNER_MS) return { stage: 'banner', rollOutShare: 0, elapsedMs: elapsed };
  if (elapsed < BANNER_MS + ROLL_OUT_MS) {
    return {
      stage: 'roll-out',
      rollOutShare: (elapsed - BANNER_MS) / ROLL_OUT_MS,
      elapsedMs: elapsed,
    };
  }
  return { stage: 'over', rollOutShare: 1, elapsedMs: elapsed };
}

/**
 * The 8.4 seconds after a ride's finish (L2-181, L2-182): `start()` takes the time from the monotonic source and `state`
 * follows it, `null` until it starts. It wakes by timer at each boundary and when a hidden tab shows, and reads the
 * time rather than counting wake-ups, so a throttled tab does not stretch it. Destroying the owner releases the timer
 * and the listener. Provided by the ride's page.
 */
@Injectable()
export class RideEnding {
  private readonly time = inject(MONOTONIC_TIME);
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<RideEndingState | null>(null);
  private startedAt: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') this.read();
  };

  readonly state = this.current.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  start(): void {
    this.release();
    this.startedAt = this.time.now();
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.read();
  }

  private read(): void {
    if (this.startedAt === null) return;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    const elapsed = this.time.now() - this.startedAt;
    const state = rideEndingAt(elapsed);
    this.current.set(state);
    if (state.stage === 'over') return this.release();
    // Read every 100 ms: the roll-out's bar fills as it passes, and the rider rolls on past the finish line by it.
    const end = state.stage === 'banner' ? BANNER_MS : BANNER_MS + ROLL_OUT_MS;
    this.timer = setTimeout(() => this.read(), Math.min(ROLL_OUT_TICK_MS, end - elapsed));
  }

  private release(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
