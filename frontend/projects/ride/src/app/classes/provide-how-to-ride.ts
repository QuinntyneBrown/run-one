import type { Provider } from '@angular/core';
import { COURSE_GRAPHICS, HOW_TO_RIDE } from '@telo/api';
import { BrowserCourseGraphics, HowToRideStore } from '@telo/domain';

/**
 * How the rider rides the class (L2-173), for the routes that read it: The Class, which offers the choice, and the
 * class ride, which follows it. The choice is kept on the device, and the browser is asked once whether it can draw
 * the course.
 */
export function provideHowToRide(): Provider[] {
  return [
    { provide: HOW_TO_RIDE, useClass: HowToRideStore },
    { provide: COURSE_GRAPHICS, useClass: BrowserCourseGraphics },
  ];
}
