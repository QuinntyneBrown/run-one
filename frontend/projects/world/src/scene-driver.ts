// Steps the ride's frame on from the last and hands it to the renderer: the seconds the rider is placed by, and how
// far the pedals have turned.
import type { CourseRenderer } from '@telo/api';

export interface SceneInput {
  /** The ride clock's whole seconds. */
  readonly elapsed: number;
  /** The bike's speed, which turns the pedals; it never places the rider (L2-174 AC2). */
  readonly speedKmh: number | null;
  readonly running: boolean;
  readonly reducedMotion: boolean;
  /** The share of the flyover's flight flown, or `null` when the chase camera draws the ride (L2-179 AC2). */
  readonly flyover?: number | null;
}

/** The longest step one frame takes, so the pedals do not leap after a hidden tab. */
const MAX_STEP = 0.25;
/** Metres per turn of the pedals, near a road bike in a middle gear. */
const METRES_PER_TURN = 5;

export class SceneDriver {
  private crank = 0;
  private last: number | null = null;
  private time: number | null = null;

  constructor(private readonly renderer: CourseRenderer) {}

  /** Draws the frame at `now` (ms); the rider and the pedals move only while the ride runs (L2-174 AC5). */
  frame(now: number, input: SceneInput): void {
    const dt = this.last === null ? 0 : Math.min(Math.max((now - this.last) / 1000, 0), MAX_STEP);
    this.last = now;
    if (input.running) {
      const metres = ((input.speedKmh ?? 0) / 3.6) * dt;
      this.crank = (this.crank + (metres / METRES_PER_TURN) * 2 * Math.PI) % (2 * Math.PI);
    }
    // The ride clock counts whole seconds; the scene's time runs on between them, never more than a second ahead of
    // the clock and never behind it. The first frame is at the clock's second, wherever the ride has got to
    // (L2-175 AC3).
    if (this.time === null) this.time = input.elapsed;
    else if (input.running) this.time += dt;
    this.time = Math.min(Math.max(this.time, input.elapsed), input.elapsed + 1);
    this.renderer.draw({
      time: this.time,
      crank: this.crank,
      reducedMotion: input.reducedMotion,
      flyover: input.flyover ?? null,
    });
  }
}
