import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DISPLAY_PREFERENCES } from '@telo/api';
import {
  BikeTelemetry,
  Countdown,
  ResistanceController,
  ResistanceEaseOff,
  RideClock,
  RideEnding,
  RideIntensity,
  RideTicker,
  VideoClockSync,
  VideoStallWatch,
  WorkoutEngine,
} from '@telo/domain';
import { IbizaFlyoverPage } from '../ibiza-flyover/ibiza-flyover-page';
import { opensOnFlyover } from '../ibiza-flyover/opens-on-flyover';
import ClassRidePage from './class-ride-page';
import { ClassRideStore } from './class-ride-store';
import { CourseSession } from './course-session';

/**
 * What `/ride` loads: the ride's services, which live as long as `/ride` is open and go when the rider leaves, and one
 * of two screens (L2-179). A ride in Ibiza on a device that does not ask for reduced motion opens on Ibiza Flyover;
 * when the flyover is done, or for any other ride, Class Ride opens on its countdown. The store exists while the flyover
 * shows, so the bike has its first target resistance already, and the course scene is the session's, drawn on by both.
 */
@Component({
  selector: 'wz-ride-page',
  imports: [ClassRidePage, IbizaFlyoverPage],
  templateUrl: './ride-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ClassRideStore,
    RideClock,
    RideTicker,
    WorkoutEngine,
    RideIntensity,
    ResistanceController,
    BikeTelemetry,
    VideoClockSync,
    VideoStallWatch,
    Countdown,
    RideEnding,
    ResistanceEaseOff,
    CourseSession,
  ],
})
export default class RidePage {
  private readonly store = inject(ClassRideStore);
  /** Whether Ibiza Flyover shows: chosen once, as the ride opens. */
  protected readonly flying = signal(
    opensOnFlyover(this.store.way, inject(DISPLAY_PREFERENCES).reducedMotion()),
  );

  protected land(): void {
    this.flying.set(false);
  }
}
