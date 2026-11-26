import type { Page } from '@playwright/test';
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
} from './echelon';
import type { ApiFixture } from './api';
import type { FakeBike, FakeBluetooth } from './fake-bluetooth';
import { INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME, ftmsBike } from './ftms';
import { expect } from './test';
import { ClassRidePage } from '../pages/class-ride.page';
import { IbizaFlyoverPage } from '../pages/ibiza-flyover.page';
import { TheClassPage } from '../pages/the-class.page';
import { theClass } from './the-class';
import { keptRideWith } from './how-to-ride';
import { YouTubeFixture } from './youtube';

/** When a class ride spec's clock starts; the ride itself starts a minute later, on a paused clock. */
export const RIDE_START = new Date('2026-11-21T18:00:00Z').getTime();

/**
 * Connects the remembered Echelon: once its latest initialisation has gone (a reload starts it again), it reports its
 * resistance, so `ble` is connected and Start riding can turn on (L2-157 AC3).
 */
export async function connectBike(bluetooth: FakeBluetooth): Promise<void> {
  await expect
    .poll(() => bluetooth.log().slice(-ECHELON_INITIALISED.length))
    .toEqual(ECHELON_INITIALISED);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
}

/**
 * How far a started ride is taken. By default the countdown is counted out to "Go!", so a spec begins at 0:00 as it did
 * before the ride had a countdown (L2-180); `countdown: 'hold'` leaves it where it opened, for the countdown's own specs.
 */
export interface RideStartOptions {
  readonly diagnose?: boolean;
  readonly countdown?: 'hold';
  /** The level of the ride's first command: the warm-up's, unless a kept intensity scales it (L2-183 AC2). */
  readonly firstLevel?: number;
}

/** The countdown's "3", "2" and "1", a second each, before "Go!" starts the ride clock (L2-180 AC2). */
export const COUNTDOWN_MS = 3000;

/**
 * Starts Intervals to the Beat with the class video, as a rider does, on Playwright's paused clock: The Class opens
 * with the remembered Echelon on the running clock, and once the bike is connected and the video's box has settled
 * the clock is paused and the spec presses Start class, so the ride starts at a known time and the spec moves it on
 * by hand. Change detection waits on a timer, so the paused clock is stepped a millisecond at a time until the ride's
 * first command has gone. Resolves once the page has rendered, a tenth of a second into the ride. The player The
 * Class parked is forgotten before the ride starts, so `youtube.players()` lists the ride's own. The class ships with
 * the app, so no request is answered for it (ADR 0037); `api` is taken so the shared fixture watches for one.
 * `diagnose` opens the app with the diagnostic recording on (L2-178).
 */
export async function startClassRide(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
  options: RideStartOptions = {},
): Promise<ClassRidePage> {
  void api;
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  const home = new TheClassPage(page);
  await home.open(options);
  await connectBike(bluetooth);
  await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/);
  await home.videoSettled();
  await YouTubeFixture.forgetPlayers(page);
  await page.clock.pauseAt(RIDE_START + 60_000);
  await home.start.click();
  // The ride starts the moment Class Ride opens, and its first command shows it has.
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return bluetooth.writes().map((write) => write.hex);
    })
    .toContain(targetResistanceWrite(options.firstLevel ?? theClass.segments[0].level));
  if (options.countdown !== 'hold') await page.clock.runFor(COUNTDOWN_MS);
  await page.clock.runFor(100);
  return new ClassRidePage(page);
}

/**
 * Starts Intervals to the Beat with the class video on a remembered FTMS bike (L2-014), on Playwright's paused clock,
 * as `startClassRide` does on the Echelon. An FTMS bike needs no initialisation: it is connected by its first Indoor
 * Bike Data, which a bike sends about once a second, so the frame is sent until the start button turns on. Resolves
 * with Class Ride open on its countdown; the ride's first target asks the bike for control, which the spec answers or not.
 */
export async function startClassRideOnFtms(
  page: Page,
  bluetooth: FakeBluetooth,
  bike: FakeBike = ftmsBike,
  options: RideStartOptions = {},
): Promise<ClassRidePage> {
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(bike);
  const home = new TheClassPage(page);
  await home.open(options);
  await expect.poll(() => bluetooth.log()).toContain(`subscribe ${INDOOR_BIKE_DATA}`);
  await expect(async () => {
    await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);
    await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/, { timeout: 250 });
  }).toPass();
  await home.videoSettled();
  await YouTubeFixture.forgetPlayers(page);
  await page.clock.pauseAt(RIDE_START + 60_000);
  await home.start.click();
  const ride = new ClassRidePage(page);
  await expect(async () => {
    await page.clock.runFor(1);
    await expect(ride.clock).toBeVisible({ timeout: 50 });
  }).toPass();
  // Left on the countdown: this bike's 3 s answer to its first command is timed from the ride's start, so the
  // specs on it count the countdown out themselves (`COUNTDOWN_MS`).
  return ride;
}

/** Skips Ibiza Flyover, which a ride in Ibiza opens on (L2-179 AC4); Class Ride opens when the camera has landed. */
export async function skipFlyover(page: Page): Promise<void> {
  await new IbizaFlyoverPage(page).skip.click();
}

/** The Class with Ibiza Sunset Strip the kept choice and the remembered Echelon connected: the start button is on. */
export async function openTheClassForIbiza(
  page: Page,
  bluetooth: FakeBluetooth,
): Promise<TheClassPage> {
  await keptRideWith(page, 'ibiza');
  await bluetooth.remember(echelonBike);
  const home = new TheClassPage(page);
  await home.open();
  await connectBike(bluetooth);
  await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/);
  return home;
}

/**
 * Starts a ride in Ibiza as a rider does (L2-173 AC5, L2-175 AC1): Ibiza Sunset Strip is the kept choice, The Class
 * opens with the remembered Echelon, the bike connects, and the rider presses Start class. Class Ride opens at once,
 * with no screen between, and the ride's first command shows it has started. On the running clock, or on the clock
 * the spec installed before it.
 */
export async function startRideInIbiza(
  page: Page,
  bluetooth: FakeBluetooth,
  options: { flyover?: 'watch' } = {},
): Promise<ClassRidePage> {
  const home = await openTheClassForIbiza(page, bluetooth);
  await home.start.click();
  const flyover = new IbizaFlyoverPage(page);
  if (options.flyover === 'watch') return new ClassRidePage(page);
  // Ibiza Flyover shows first (L2-179): the rider skips it, and the camera lands for 0.9 s.
  await flyover.skip.click();
  const ride = new ClassRidePage(page);
  await expect(ride.clock).toBeVisible();
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(theClass.segments[0].level));
  // The countdown runs on the clock the spec has: "Go!" starts the ride (L2-180).
  await expect(ride.pause).toBeVisible({ timeout: 10_000 });
  return ride;
}

/**
 * Starts a ride in Ibiza on Playwright's paused clock, as `startClassRide` does with the class video: the ride starts
 * at a known time and the spec moves the clock on by hand. Resolves once the ride's first command has gone, a tenth of
 * a second into the ride; the course is still loading then (`courseDrawnOnPausedClock`).
 */
export async function startRideInIbizaOnPausedClock(
  page: Page,
  bluetooth: FakeBluetooth,
): Promise<ClassRidePage> {
  await page.clock.install({ time: RIDE_START });
  const home = await openTheClassForIbiza(page, bluetooth);
  await page.clock.pauseAt(RIDE_START + 60_000);
  await home.start.click();
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return bluetooth.writes().map((write) => write.hex);
    })
    .toContain(targetResistanceWrite(theClass.segments[0].level));
  // Ibiza Flyover shows first (L2-179): the rider skips it, the camera lands for 0.9 s, and Class Ride opens.
  await new IbizaFlyoverPage(page).skip.click();
  await expect(async () => {
    await page.clock.runFor(100);
    await expect(new ClassRidePage(page).clock).toBeVisible({ timeout: 50 });
  }).toPass({ intervals: [0], timeout: 60_000 });
  await page.clock.runFor(COUNTDOWN_MS);
  await page.clock.runFor(100);
  return new ClassRidePage(page);
}

/**
 * Steps the paused clock a frame at a time until the course's first frame is drawn (L2-175 AC3). The course's files
 * come in the page's own time, so the ride clock is a second or two on by then, never more than `withinSeconds`.
 */
export async function courseDrawnOnPausedClock(
  page: Page,
  ride: ClassRidePage,
  withinSeconds = 6,
): Promise<void> {
  for (let frame = 0; frame < (withinSeconds * 1000) / 16; frame++) {
    await page.clock.runFor(16);
    if (await ride.course.isVisible()) return;
    // The files and the programs come in real time, whatever the page's clock says.
    await new Promise((wait) => setTimeout(wait, 100));
  }
  await expect(ride.course, 'the course is drawn').toBeVisible({ timeout: 1 });
}

/** The Echelon keepalive, written about once a second while the bike is connected (L2-016 AC1). */
const KEEPALIVE = 'F0 A0 01 01 92';

/**
 * On the paused clock, the bike lost at `since` is switched on and answers again: the app initialises it (initialising
 * waits between commands, so the paused clock steps until it is done), the bike reports its resistance at `level`, and
 * the link is connected.
 */
export async function bikeAnswers(
  page: Page,
  bluetooth: FakeBluetooth,
  since: number,
  level = 13,
): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(100);
    // The keepalives of the minutes before can still be reaching the log; the initialisation is what is left.
    const log = bluetooth.log().slice(since);
    expect(
      log.filter((line) => !line.endsWith(KEEPALIVE)).slice(0, ECHELON_INITIALISED.length),
    ).toEqual(ECHELON_INITIALISED);
  }).toPass();
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(level));
  await page.clock.runFor(200);
}

/**
 * The bike is switched off and its link drops, so it stays lost until `bikeBack`. Resolves to the length of the
 * bike's log at the drop, which `bikeBack` reads from.
 */
export async function loseBike(bluetooth: FakeBluetooth): Promise<number> {
  await bluetooth.switchOff();
  await bluetooth.drop();
  return bluetooth.log().length;
}

/**
 * The bike lost at `since` is back: once the app has initialised it again (on its own retry, or at once when the
 * rider presses the screen's Connect bike or Reconnect), it reports its resistance and `ble` is connected.
 */
export async function bikeBack(bluetooth: FakeBluetooth, since: number): Promise<void> {
  await expect.poll(() => bluetooth.log().slice(since)).toEqual(ECHELON_INITIALISED);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
}

/**
 * Starts a ride in Ibiza and waits until the course is drawn in the box (L2-174 AC1), on the running clock. The
 * course is drawn in software here: a spec that is about the page and not the drawing holds the course's files
 * instead (`CourseFiles.hold`) and never draws it.
 */
export async function rideInIbiza(page: Page, bluetooth: FakeBluetooth): Promise<ClassRidePage> {
  const ride = await startRideInIbiza(page, bluetooth);
  await expect(ride.course).toBeVisible({ timeout: 60_000 });
  return ride;
}
