import type { CourseRenderer } from '@telo/api';

/**
 * Where the app serves the one course's files (L2-173 AC9): `courses/ibiza.glb` and `courses/ibiza.course.json`, built
 * in Blender from the class's plan (ADR 0034, ADR 0042).
 */
const IBIZA_SUNSET_STRIP = 'courses/ibiza';

/** The renderer for Ibiza Sunset Strip: it imports Three.js on demand, so it stays in a chunk of its own. */
export function loadCourseRenderer(): Promise<CourseRenderer> {
  return import('./course-renderer').then((m) => new m.ThreeCourseRenderer(IBIZA_SUNSET_STRIP));
}
