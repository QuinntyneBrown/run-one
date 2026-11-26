import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ANNOUNCER, BIKE_CONNECTION, MONOTONIC_TIME, THE_CLASS } from '@telo/api';
import { GIVE_UP_MS, LANDED_MS, flyoverAt } from '@telo/domain';
import { Subject } from 'rxjs';
import { IBIZA_SUNSET_STRIP } from '../classes/ibiza-sunset-strip';
import { CourseSession } from '../class-ride/course-session';
import { FLYOVER_PLACES, type FlyoverPlace, landingPlace } from './flyover-places';
import { Router } from '@angular/router';

/** Where the flyover stands: waiting for the course to be drawn, flying over it, or landed on the grid. */
export type FlyoverStage = 'loading' | 'flying' | 'landed';

/**
 * Ibiza Flyover's state (L2-179, docs/detailed-designs/ibiza-flyover/fly-over-the-course): `loading` until the course
 * is drawn, `flying` for the 9 seconds of the flight, `landed` for 0.9 seconds, and then `done`. It reads time from the
 * monotonic source on each animation frame, so a hidden tab, which draws none, finds the flight where the clock puts it.
 * It gives way, with no landing, when the course cannot be drawn or is not drawn in 10 seconds (AC8); Skip lands at
 * once (AC4); Cancel leaves for The Class, which releases the course (AC5); and a lost bike holds the landing, with
 * Try again (AC7). Provided by the flyover's page.
 */
@Injectable()
export class FlyoverStore {
  private readonly session = inject(CourseSession);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly time = inject(MONOTONIC_TIME);
  private readonly router = inject(Router);
  private readonly theClass = inject(THE_CLASS);
  private readonly now = signal<number>(0);
  private readonly stageState = signal<FlyoverStage>('loading');
  private readonly flown = signal(0);
  private readonly overPlace = signal(0);
  private openedAt = 0;
  private flightAt = 0;
  private landedAt = 0;
  private frame: number | null = null;
  private finished = false;

  /** Where the flyover stands. */
  readonly stage = this.stageState.asReadonly();
  /** The share of the flight flown for the camera, or `null` once landed, when the chase camera takes the grid. */
  readonly share = computed(() => (this.stageState() === 'landed' ? null : this.flown()));
  /** The place and line under the course's name, or `null` while loading. */
  readonly caption = computed<FlyoverPlace | null>(() => {
    switch (this.stageState()) {
      case 'loading':
        return null;
      case 'landed':
        return landingPlace(this.theClass.get().title);
      default:
        return FLYOVER_PLACES[this.overPlace()];
    }
  });
  /** Whether the bike has stopped answering. */
  readonly bikeLost = computed(() => this.connection.ble() === 'disconnected');
  /** What the band says of the bike. */
  readonly status = computed(() =>
    this.stageState() === 'landed'
      ? 'Bike ready · lining up'
      : `${this.connection.bike()?.name ?? 'Bike'} connected`,
  );
  readonly lostLine = computed(
    () => `No answer from the ${this.connection.bike()?.name ?? 'bike'}`,
  );
  readonly canSkip = computed(() => this.stageState() !== 'landed');
  /** Emits once, when Class Ride is to open on its countdown. */
  readonly done = new Subject<void>();

  constructor() {
    const announcer = inject(ANNOUNCER);
    announcer.announce(IBIZA_SUNSET_STRIP.name);
    this.openedAt = this.time.now();
    this.step();
    inject(DestroyRef).onDestroy(() => {
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.finished = true;
      this.done.complete();
    });
  }

  /** Lands the camera on the grid at once, from the loading or the flight (L2-179 AC4). */
  skip(): void {
    if (this.stageState() !== 'landed') this.land();
  }

  /** Leaves for The Class: the ride is not started and the course goes with the page (L2-179 AC5). */
  cancel(): void {
    void this.router.navigateByUrl('/');
  }

  /** Tries the lost bike at once (L2-179 AC7). */
  retry(): void {
    this.connection.reconnectNow();
  }

  /** One animation frame: the stage and the flight are read from the clock, then the next frame is asked for. */
  private step(): void {
    if (this.finished) return;
    const at = this.time.now();
    this.now.set(at);
    switch (this.stageState()) {
      case 'loading':
        if (this.session.unavailable() || at - this.openedAt >= GIVE_UP_MS) return this.finish();
        if (this.session.drawn()) {
          this.flightAt = at;
          this.stageState.set('flying');
        }
        break;
      case 'flying': {
        const flight = flyoverAt(at - this.flightAt);
        this.flown.set(flight.share);
        this.overPlace.set(flight.place);
        if (flight.share >= 1) this.land();
        break;
      }
      case 'landed':
        if (at - this.landedAt >= LANDED_MS && !this.bikeLost()) return this.finish();
        break;
    }
    this.frame = requestAnimationFrame(() => this.step());
  }

  private land(): void {
    this.landedAt = this.time.now();
    this.stageState.set('landed');
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.frame = null;
    this.done.next();
  }
}
