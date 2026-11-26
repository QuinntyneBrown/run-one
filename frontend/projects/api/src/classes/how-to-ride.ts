import { InjectionToken } from '@angular/core';

/** The two ways to ride the one class (L2-173): with its video, or in Ibiza Sunset Strip, the only course. */
export type RideWith = 'video' | 'ibiza';

/** The rider's choice of how to ride, kept on this device and sent nowhere (L2-173 AC2, L2-132 AC2). */
export interface HowToRide {
  /** The way the rider last chose, or `null` for a rider who has never chosen or a record that cannot be read. */
  kept(): RideWith | null;
  keep(way: RideWith): void;
}

export const HOW_TO_RIDE = new InjectionToken<HowToRide>('HOW_TO_RIDE');

/** Whether this browser can draw the course: WebGPU, or else WebGL 2 (L2-173 AC6, open question 16). */
export interface CourseGraphics {
  available(): boolean;
}

export const COURSE_GRAPHICS = new InjectionToken<CourseGraphics>('COURSE_GRAPHICS');
