import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { type CountdownStep, MONOTONIC_TIME } from '@telo/api';
import { type Observable, Subject } from 'rxjs';

/** How long each of "3", "2" and "1" shows (L2-180 AC2). The timings are the prototype's, not tried on a bike. */
export const COUNT_MS = 1000;
/** How long "Go!" shows once the clock has started (L2-180 AC2). */
export const GO_MS = 700;
const COUNTS = 3;
const NUMERALS = ['3', '2', '1'] as const;

/**
 * What the countdown shows `elapsedMs` after it started: "3" with no light from 0 ms, "2" with one from 1,000 ms, "1"
 * with two from 2,000 ms, "Go!" with all three from 3,000 ms, over from 3,700 ms (L2-180 AC2).
 */
export function countdownStep(elapsedMs: number): CountdownStep {
  const counted = Math.floor(Math.max(0, elapsedMs) / COUNT_MS);
  if (counted < COUNTS) {
    return {
      numeral: NUMERALS[counted],
      lit: counted as 0 | 1 | 2,
      go: false,
      over: false,
    };
  }
  return { numeral: 'Go!', lit: 3, go: true, over: elapsedMs >= COUNTS * COUNT_MS + GO_MS };
}

/** The moments, in milliseconds after the start, at which the countdown changes what it shows. */
const BOUNDARIES = [COUNT_MS, 2 * COUNT_MS, COUNTS * COUNT_MS, COUNTS * COUNT_MS + GO_MS];

/**
 * The countdown before a class ride's clock starts (L2-180, docs/detailed-designs/class-ride/count-down-to-the-start).
 * `start()` takes the time from the monotonic source and `step` follows it, `null` while it is not running and once it
 * is over. It wakes by timer at each boundary, and again when a hidden tab is shown, but it reads the time rather than
 * counting wake-ups, so a throttled tab does not stretch it (AC5). `go` emits once, with the instant "Go!" was due, as
 * "Go!" shows or, in a tab hidden through it, as soon as the page reads the time again. `stop()` clears it; `start()`
 * after `stop()` begins again from "3" (AC7). Destroying the owner releases the timer and the listener. Provided by the
 * ride's page.
 */
@Injectable()
export class Countdown {
  private readonly time = inject(MONOTONIC_TIME);
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<CountdownStep | null>(null);
  private readonly went = new Subject<number>();
  private startedAt: number | null = null;
  private wentAt: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') this.read();
  };

  /** What to show now, or `null` when no countdown is running. */
  readonly step = this.current.asReadonly();
  /** Emits the instant "Go!" was due, on the monotonic source, once for each start. */
  readonly go: Observable<number> = this.went.asObservable();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.release();
      this.went.complete();
    });
  }

  start(): void {
    this.release();
    this.startedAt = this.time.now();
    this.wentAt = null;
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.read();
  }

  stop(): void {
    this.release();
    this.startedAt = null;
    this.current.set(null);
  }

  private read(): void {
    if (this.startedAt === null) return;
    const elapsed = this.time.now() - this.startedAt;
    if (elapsed >= COUNTS * COUNT_MS && this.wentAt === null) {
      this.wentAt = this.startedAt + COUNTS * COUNT_MS;
      this.went.next(this.wentAt);
    }
    const step = countdownStep(elapsed);
    if (step.over) {
      this.release();
      this.current.set(null);
      return;
    }
    this.current.set(step);
    const next = BOUNDARIES.find((boundary) => boundary > elapsed)!;
    this.timer = setTimeout(() => this.read(), next - elapsed);
  }

  private release(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
