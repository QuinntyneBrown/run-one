// The world library (ADR 0030, ADR 0047): Three.js and the Ibiza Sunset Strip course, loaded only when a ride in Ibiza
// starts (L2-175 AC1). The ride app creates `CourseScene` from a dynamic import of this library and binds
// `COURSE_RENDERER` to `loadCourseRenderer`, which imports Three.js and the renderer on demand.
export { CourseScene } from './course-scene';
export { loadCourseRenderer } from './course-renderer-loader';
