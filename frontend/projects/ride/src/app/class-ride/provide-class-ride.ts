import type { EnvironmentProviders, Provider } from '@angular/core';
import {
  COURSE_RENDERER,
  INTENSITY_DEFAULT,
  MONOTONIC_TIME,
  RIDE_MUSIC,
  RIDE_SOUND,
  SCREEN_WAKE_LOCK,
} from '@telo/api';
import {
  BrowserRideMusic,
  BrowserScreenWakeLock,
  IntensityStore,
  RideSoundStore,
} from '@telo/domain';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideHowToRide } from '../classes/provide-how-to-ride';
import { provideTheClass } from '../classes/provide-the-class';

/**
 * What the class ride route binds (ride.routes.ts): the one class, shipped with the app (ADR 0037), how the rider
 * chose to ride it, the monotonic clock the ride runs on (`performance.now()`, L2-133 AC1), the screen wake lock
 * (AC3), the ride's music (L2-176), the class video's player, whose `video` library is imported only when a ride plays its video, and the
 * course's renderer, whose `world` library and Three.js are imported only when a ride in Ibiza starts (L2-175 AC1).
 * Bound on the route, so their code loads with the class ride.
 */
export function provideClassRide(): (Provider | EnvironmentProviders)[] {
  return [
    provideTheClass(),
    // How the rider chose to ride: with the class video alone, or in the course (L2-173 AC5).
    provideHowToRide(),
    { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
    { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
    // The one track, played in a ride in Ibiza only and fetched when that ride starts (L2-176).
    { provide: RIDE_MUSIC, useClass: BrowserRideMusic },
    // The rider's sound for a ride in Ibiza, kept on the device (L2-185), and their default intensity (L2-183 AC2).
    { provide: RIDE_SOUND, useClass: RideSoundStore },
    { provide: INTENSITY_DEFAULT, useClass: IntensityStore },
    provideClassVideo(),
    {
      provide: COURSE_RENDERER,
      useValue: () => import('@telo/world').then((world) => world.loadCourseRenderer()),
    },
  ];
}
