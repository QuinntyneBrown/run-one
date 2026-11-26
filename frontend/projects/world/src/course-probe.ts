// A test-only hook into the course's renderer. A spec or the course bench sets `window.__wzWorldRide = { tier }`
// before the app boots (e2e/fixtures/course-probe.ts): the course is then drawn at that step from the first frame, its
// frame budget never moves it, and the renderer writes what it draws to `__wzWorldRide.course`. No rider can set it:
// it is not an option, not in the README, and nothing in the app sets it.
// `from` starts the ride that many metres up the road, and `above` looks straight down on the rider from that many
// metres, for the pictures a person looks at the rider's shadow in (e2e/shadow/shadow.shots.ts); `shadow: false`
// leaves the rider's shadow out, so the frame-rate check can time a frame with and without it.

import type { ChaseCamera } from './chase-camera';

/** The step of the course's five a spec pins, by the names the hook has always taken. */
export type Tier = 'low' | 'medium' | 'high' | 'ultra';

/** The global a spec sets before the app boots. */
export const PROBE_KEY = '__wzWorldRide';

const TIERS: readonly Tier[] = ['low', 'medium', 'high', 'ultra'];

/** What a spec asked for: the step to pin, and whether to draw with WebGL 2 where WebGPU is offered. */
export interface CourseProbe {
  readonly tier: Tier;
  readonly forceWebGL: boolean;
}

/** What the renderer reports of the frame just drawn, kept current as it draws. */
export interface CourseDrawn {
  tier: number;
  backend: string;
  drawCalls: number;
  triangles: number;
  /** Whether the renderer makes a shadow map: it does not (L2-177 AC1). */
  shadowMap: boolean;
  /** True once the renderer's own dispose has finished (L2-174 AC8). */
  released: boolean;
  /** What the renderer held of geometries and textures at the start of dispose and after the course's own were released. */
  heldBefore: { geometries: number; textures: number };
  held: { geometries: number; textures: number };
  /** The chunks of each group of the map in view. */
  groups: Record<string, number>;
  /** The riders made for the scene: the rider alone (L2-174 AC6). */
  riders: number;
  /** Metres from the grid where the ride's first frame put the rider (L2-175 AC3); null before it. */
  firstMetres: number | null;
  /** Metres from the grid where the latest frame put the rider. */
  metres: number;
  /** The frames drawn since the course started: a held course and a hidden tab add none (L2-174 AC5, AC9). */
  frames: number;
  /** Where the latest frame put the camera: metres behind the rider and above the road (L2-174 AC10). */
  camera: ChaseCamera;
  /** The rider's shadow in the sun as the latest frame laid it (L2-174 AC12). */
  shadow: ShadowDrawn;
}

/** What the renderer reports of the rider's shadow in the sun. */
export interface ShadowDrawn {
  /** How far its direction on the road stands from straight away from the sun, in degrees. */
  off: number;
  /** Metres from under the rider's wheels to where the shadow of their head lies. */
  reach: number;
  /** How many times the rider's figure has been drawn for it since the course started. */
  figures: number;
  /** The milliseconds of the page's own time spent laying the shadow and drawing its figure, all frames together. */
  ms: number;
}

/** The pinned step, or null when the hook is not set (every rider's ride). */
export function readCourseProbe(value: unknown): CourseProbe | null {
  if (typeof value !== 'object' || value === null) return null;
  const { tier, backend } = value as { tier?: unknown; backend?: unknown };
  return TIERS.includes(tier as Tier)
    ? { tier: tier as Tier, forceWebGL: backend === 'webgl2' }
    : null;
}
