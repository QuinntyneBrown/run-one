import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Button,
  ClassBike,
  ClassCountdown,
  ClassRollout,
  ClassCourse,
  ClassHeader,
  ClassInset,
  FinishBanner,
  ClassIntensity,
  ClassLost,
  ClassResist,
  ClassSegment,
  ClassSound,
  ClassStat,
  ClassVideo,
  InlineMessage,
} from '@telo/components';
import { IBIZA_SUNSET_STRIP } from '../classes/ibiza-sunset-strip';
import { FullscreenButton } from '../fullscreen/fullscreen-button';
import { ClassRideStore } from './class-ride-store';
import { CourseSceneHost } from './course-scene-host';

/**
 * Class Ride at `/ride` (docs/mocks/pages/class-ride/), ridden as the rider chose on The Class (L2-173 AC5). It opens
 * on a countdown over the box, and the ride starts on "Go!" (L2-180): the header with the class and its clock, the box, and the bike panel with the segment
 * card, Power, Cadence and the resistance stepper. With "Class video" the box is the class video. With "Ibiza Sunset
 * Strip" it is the course (L2-087 AC6): its still under "Loading Ibiza Sunset Strip" while the 3D renderer and the
 * course's files are fetched, then the course drawn there, and no video player (L2-174 AC1, L2-175 AC1). There is no
 * loading screen. Every part of the ride is provided here, so leaving the page stops the clock, the ticker and the
 * course's frame loop and releases them.
 */
@Component({
  selector: 'wz-class-ride-page',
  imports: [
    FullscreenButton,
    Button,
    ClassBike,
    ClassCountdown,
    ClassCourse,
    FinishBanner,
    ClassRollout,
    ClassHeader,
    ClassInset,
    ClassIntensity,
    ClassLost,
    ClassResist,
    ClassSegment,
    ClassSound,
    ClassStat,
    ClassVideo,
    CourseSceneHost,
    InlineMessage,
    RouterLink,
  ],
  templateUrl: './class-ride-page.html',
  styleUrl: './class-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeunload)': 'confirmLeaving($event)' },
})
export default class ClassRidePage {
  protected readonly store = inject(ClassRideStore);
  /** The one course, for a ride in Ibiza: its name and its still. */
  protected readonly course = IBIZA_SUNSET_STRIP;

  constructor() {
    // Class Ride has the screen: the countdown begins, "3" with the bike already set (L2-180 AC1).
    this.store.beginCountdown();
  }

  /** Closing or reloading the tab mid-ride asks the rider to confirm (L2-133 AC4); the listener goes with the page. */
  protected confirmLeaving(event: BeforeUnloadEvent): void {
    if (this.store.ride()) event.preventDefault();
  }
}
