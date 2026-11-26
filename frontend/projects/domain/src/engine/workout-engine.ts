import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Plan } from '@telo/api';
import { RideIntensity, intensityLevel } from './intensity';
import { type PlanState, planStateAt } from './plan-state';
import { PowerModel } from './power-model';
import { ResistanceController } from './resistance-controller';
import { RideClock } from './ride-clock';
import { RideTicker } from './ride-ticker';

/**
 * Follows a plan on the ride clock (docs/detailed-designs/classes/ride-a-class): on each of the ticker's seconds it
 * finds the plan's state, and when a new segment starts it sends that segment's level as the target resistance, within
 * 500 ms of the boundary since ticks land on whole seconds (L2-027 AC1). A paused clock publishes no second, so no
 * segment changes and nothing is sent (AC3); after a hidden tab only the current segment's level is sent (L2-133 AC2).
 * Provided by each ride screen with `RideClock`, `RideTicker` and `ResistanceController`.
 *
 * With a `RideIntensity` beside it, each level is sent scaled by the ride's intensity, and the state's target power is
 * that level's (L2-183 AC3, L2-089 AC2); a change of intensity sends the current segment's scaled level at once, in
 * place of a nudge (L2-183 AC4, AC5).
 */
@Injectable()
export class WorkoutEngine {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly resistance = inject(ResistanceController);
  private readonly destroyRef = inject(DestroyRef);
  private readonly intensity = inject(RideIntensity, { optional: true });
  private readonly current = signal<PlanState | null>(null);
  private plan: Plan | null = null;

  readonly state = this.current.asReadonly();

  constructor() {
    const intensity = this.intensity;
    if (!intensity) return;
    let first = true;
    effect(() => {
      intensity.value();
      // The intensity the ride opens at is sent with the first segment; a change is sent at once.
      if (first) return void (first = false);
      untracked(() => {
        this.restate();
        this.resend();
      });
    });
  }

  follow(plan: Plan): void {
    const first = this.plan === null;
    this.plan = plan;
    if (first)
      this.ticker.ticks.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.step());
    this.step();
  }

  /**
   * Sends the current segment's level again: the bike is back mid-segment (L2-027 AC4, L2-092 AC3). A level the rider
   * set by hand within the segment gives way to the plan's. Nothing is sent before a plan or after its end.
   */
  resend(): void {
    const now = this.current();
    if (now !== null) void this.resistance.applyPlanLevel(this.level(now.segment.level));
  }

  private step(): void {
    if (this.plan === null) return;
    const before = this.current();
    const now = this.at(this.clock.elapsedMs());
    this.current.set(now);
    if (now !== null && now.index !== before?.index)
      void this.resistance.applyPlanLevel(this.level(now.segment.level));
  }

  /** The state again at the same moment, with the target power at the intensity now. */
  private restate(): void {
    if (this.plan !== null && this.current() !== null)
      this.current.set(this.at(this.clock.elapsedMs()));
  }

  /** The plan's state at `elapsedMs`, its target power that of the level sent (L2-089 AC2). */
  private at(elapsedMs: number): PlanState | null {
    const state = planStateAt(this.plan!, elapsedMs);
    if (state === null || this.intensity === null) return state;
    const { cadenceAim, level } = state.segment;
    return { ...state, targetPower: PowerModel.target(cadenceAim, this.level(level)) };
  }

  /** A segment's level at the ride's intensity (L2-183 AC3). */
  private level(level: number): number {
    return this.intensity === null ? level : intensityLevel(level, this.intensity.value());
  }
}
