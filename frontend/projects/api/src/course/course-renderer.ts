// The contract the course is drawn through (ADR 0034, ADR 0047). The real renderer is Three.js in the `world`
// library's course-renderer.ts, imported only when a ride in Ibiza starts (L2-175 AC1); a test reaches a fake through
// the same contract.
import { InjectionToken } from '@angular/core';
import type { Segment } from '../workout/plan';

/** The GPU API drawing the course: WebGPU, or WebGL 2 where no WebGPU adapter is granted (L2-173 AC6). */
export type Backend = 'webgpu' | 'webgl2';

/** What the renderer draws in one frame of a ride in Ibiza. */
export interface CourseFrame {
  /**
   * The ride clock's seconds the rider is placed by (L2-174 AC2). It follows the clock's whole seconds and advances by
   * each frame's own time between them, so the rider moves smoothly and not once a second.
   */
  readonly time: number;
  /** The pedals' angle, in radians. */
  readonly crank: number;
  /** Nothing on the course moves but the rider along the road, and the pedals stand still. */
  readonly reducedMotion: boolean;
  /**
   * The share of the flyover's flight flown, 0 to 1, when the course is seen from above before a ride (L2-179 AC2);
   * `null` or absent draws the chase camera behind the rider.
   */
  readonly flyover?: number | null;
}

export interface CourseRenderer {
  /** The GPU API drawing the course once `start` has resolved true. */
  readonly backend: Backend;
  /**
   * Fetches the course's files and starts drawing on `canvas` with WebGPU, else WebGL 2; resolves false when the files
   * cannot be loaded or neither API starts. Its programs compile before it resolves, each frame of that awaited
   * through `nextFrame`. `segments` is the plan the ride follows, whose length the course's clock is scaled to.
   */
  start(
    canvas: HTMLCanvasElement,
    nextFrame: () => Promise<void>,
    segments: readonly Segment[],
  ): Promise<boolean>;
  resize(width: number, height: number, pixelRatio: number): void;
  draw(frame: CourseFrame): void;
  /** Judges frames against the display's measured frame period from now on (L2-177 AC3). */
  setFramePeriod(ms: number): void;
  /** Judges no frame until the next `setFramePeriod`: the period is being measured. */
  pauseBudget(): void;
  /** Releases the map's geometry and materials, the rider and the renderer (L2-174 AC8). */
  dispose(): void;
}

/** Loads the renderer: the real one imports Three.js only when a ride in Ibiza starts (L2-136 AC1). */
export type CourseRendererLoader = () => Promise<CourseRenderer>;

export const COURSE_RENDERER = new InjectionToken<CourseRendererLoader>('COURSE_RENDERER');
