// The test-only hook into the course's renderer (`world`'s course-probe.ts). `pin(tier)` sets
// `window.__wzWorldRide = { tier }` before the app boots: the course is then drawn at that step of its five from the
// first frame, its frame budget never moves it, and the renderer writes what it draws to `__wzWorldRide.course`,
// which `drawn()` reads. `low` is the cheapest to draw in software, so the specs that draw the course pin it.
//
// It is not a rider option: nothing in the app sets the global, and only the lazily loaded renderer reads it.
import type { Page } from '@playwright/test';

export type Tier = 'low' | 'medium' | 'high' | 'ultra';

/** What the renderer reports of the course while the hook is set. */
export interface CourseDrawn {
  /** The step of five the course is drawn at, from 0, the lowest (L2-177 AC3). */
  readonly tier: number;
  readonly backend: 'webgpu' | 'webgl2';
  readonly drawCalls: number;
  readonly triangles: number;
  /** Whether the renderer makes a shadow map: it does not (L2-177 AC1). */
  readonly shadowMap: boolean;
  /** True once the renderer's own dispose has finished (L2-174 AC8). */
  readonly released: boolean;
  /** What the renderer held of geometries and textures at the start of dispose and after the course's own were released. */
  readonly heldBefore: { geometries: number; textures: number };
  readonly held: { geometries: number; textures: number };
  /** The riders in the scene: the rider alone (L2-174 AC6). */
  readonly riders: number;
  /** Metres from the grid where the ride's first frame put the rider (L2-175 AC3). */
  readonly firstMetres: number;
  /** Metres from the grid where the latest frame put the rider. */
  readonly metres: number;
  /** The frames drawn since the course started: a held course and a hidden tab add none (L2-174 AC5, AC9). */
  readonly frames: number;
  /** Where the latest frame put the camera: metres behind the rider and above the road (L2-174 AC10). */
  readonly camera: { readonly behind: number; readonly above: number };
  /**
   * The rider's shadow in the sun (L2-174 AC12): how far its direction stands from straight away from the sun, in
   * degrees; the metres from under the wheels to the shadow of the rider's head; and how many times the rider's
   * figure has been drawn for it.
   */
  readonly shadow: {
    readonly off: number;
    readonly reach: number;
    readonly figures: number;
    /** The page's own milliseconds spent on the shadow, all frames together. */
    readonly ms: number;
  };
}

export class CourseProbe {
  constructor(private readonly page: Page) {}

  /**
   * Call before the page loads: the course is drawn at `tier` and never leaves it. With `above`, the camera looks
   * straight down on the rider from that many metres; with `shadow` false the rider throws no shadow.
   */
  async pin(tier: Tier = 'low', above = 0, shadow = true): Promise<void> {
    await this.page.addInitScript(
      ([pinned, height, thrown]) => {
        (window as unknown as Record<string, unknown>)['__wzWorldRide'] = {
          tier: pinned,
          above: height,
          shadow: thrown,
        };
      },
      [tier, above, shadow] as const,
    );
  }

  /** The renderer's report of its latest frame, or null before the ride's first frame is drawn. */
  drawn(): Promise<CourseDrawn | null> {
    return this.page.evaluate(
      () =>
        ((window as unknown as Record<string, { course?: CourseDrawn }>)['__wzWorldRide']?.course ??
          null) as CourseDrawn | null,
    );
  }
}
