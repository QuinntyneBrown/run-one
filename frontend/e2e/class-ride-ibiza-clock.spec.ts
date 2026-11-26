// Acceptance test
// Traces to: L2-174 AC2, AC4, AC9, AC10; L2-133 AC2; L2-078 AC1; L2-037 AC3
// Description: through a ride in Ibiza the clock places the rider, never their power or cadence
// (docs/mocks/pages/class-ride/ibiza). The rider's place is read through the renderer's test-only report
// (fixtures/course-probe.ts), never from pixels. The course is drawn in software here, so each spec that draws it
// rides once, in the smallest landscape window (844 × 390), at the course's lowest step, and never resizes; the ride
// is on Playwright's paused clock from the start, which the spec jumps and then steps a few frames at a time. Held
// while paused or while the bike is lost: class-ride-ibiza-holds.spec.ts.
//
// Given a ride in Ibiza just started, when the course is drawn, then the rider is on the grid's stretch where the
// clock puts them, and the camera has closed in on them.
// Given the rider does not pedal, when the clock runs on, then the rider is where the plan's segment at that second
// puts them, its stretch ridden evenly, and the camera sits 2.75 m behind and 1.8 m above.
// Given the rider pedals far faster than the plan aims, when the clock runs on, then the rider is still where the
// clock puts them.
// Given the clock reaches the plan's second segment, when a frame is drawn, then the rider is on its stretch, at its
// pace.
// Given the tab is hidden, when the clock runs on and the bike reports, then no frame is drawn; when the tab shows
// again, then the rider is where the clock puts them.
// Given the same telemetry, when the class is ridden in Ibiza and then with the class video, then Class Done shows the
// same time, output and on-target share.
import {
  COUNTDOWN_MS,
  courseDrawnOnPausedClock,
  startRideInIbizaOnPausedClock,
} from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import type { CourseProbe } from './fixtures/course-probe';
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
  targetResistanceWrites,
  workoutFrame,
} from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { hideTab, showTab } from './fixtures/tab';
import { expect, test } from './fixtures/test';
import { planMetres, theClass } from './fixtures/the-class';
import type { Page } from '@playwright/test';
import { ClassRidePage } from './pages/class-ride.page';
import { ClassDonePage } from './pages/class-done.page';
import { TheClassPage } from './pages/the-class.page';

const [WARM_UP, WORK] = theClass.segments;

/**
 * The latest frame's rider is where the clock puts them (L2-174 AC2): between the plan's metres at the clock's
 * second and at the next, since the clock counts whole seconds and the course is drawn through them. Resolves to the
 * clock's second and the rider's metres.
 */
async function placedByTheClock(
  ride: ClassRidePage,
  course: CourseProbe,
): Promise<{ second: number; metres: number }> {
  const second = await ride.clockSeconds();
  const { metres } = (await course.drawn())!;
  expect(metres, `at ${second} s of the clock`).toBeGreaterThanOrEqual(planMetres(second) - 0.5);
  expect(metres, `at ${second} s of the clock`).toBeLessThanOrEqual(planMetres(second + 1) + 0.5);
  return { second, metres };
}

/** Moves the paused clock on by `seconds` at once, then draws a few frames there. */
async function jump(page: Page, seconds: number): Promise<void> {
  await page.clock.fastForward(seconds * 1000);
  await page.clock.runFor(64);
}

/** The first 40 seconds ridden at the warm-up's level and cadence aim, on target; then the rider stops pedalling. */
async function rideFortySecondsOnTarget(page: Page, bluetooth: FakeBluetooth): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(WARM_UP.level));
  for (let second = 0; second < 40; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(WARM_UP.cadenceAim));
    await page.clock.runFor(4000);
  }
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(0));
  await page.clock.runFor(1000);
}

/** Runs the paused clock from 0:41 to the finish, and reads Class Done's time and its output and on-target line. */
async function finishAndRead(page: Page): Promise<{ time: string; line: string }> {
  await page.clock.fastForward('19:17');
  await page.clock.runFor(2000);
  const done = new ClassDonePage(page);
  await done.shown();
  await expect(done.title).toHaveText('Intervals to the Beat');
  return {
    time: (await done.time.textContent())!,
    line: `${await done.number.textContent()} kJ · ${await done.onTarget.textContent()} on target`,
  };
}

test.describe('Placed by the clock in Ibiza', () => {
  test(
    'the clock places the rider from the grid through two segments, whatever the bike reports, and the camera closes in on the grid (L2-174 AC2, AC10)',
    { tag: '@critical' },
    async ({ page, bluetooth, course }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 844, height: 390 });
      await course.pin('low');
      const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
      await courseDrawnOnPausedClock(page, ride);

      // On the grid's stretch, seconds in: the camera has closed in on the rider (AC10).
      const grid = await placedByTheClock(ride, course);
      expect(grid.metres).toBeLessThan(45);
      const near = (await course.drawn())!.camera;
      expect(near.behind).toBeGreaterThanOrEqual(2.4);
      expect(near.behind).toBeLessThan(2.75);
      expect(near.above).toBeGreaterThanOrEqual(1.65);
      expect(near.above).toBeLessThan(1.8);
      // Three seconds up the road it is moving back out, and is not there yet.
      await jump(page, 3);
      const leaving = await placedByTheClock(ride, course);
      expect(leaving.metres).toBeGreaterThan(grid.metres);
      expect(leaving.metres).toBeLessThan(45);
      const opening = (await course.drawn())!.camera;
      expect(opening.behind).toBeGreaterThan(near.behind);
      expect(opening.behind).toBeLessThan(2.75);
      expect(opening.above).toBeGreaterThan(near.above);
      expect(opening.above).toBeLessThan(1.8);

      // The bike has reported no cadence and no power: the rider moves all the same, at the warm-up's pace (AC2).
      await jump(page, 30);
      const coasting = await placedByTheClock(ride, course);
      expect(coasting.second).toBeGreaterThanOrEqual(30);
      expect(coasting.metres).toBeGreaterThan(190);
      // Away from the grid the camera sits back (AC10).
      expect((await course.drawn())!.camera).toEqual({ behind: 2.75, above: 1.8 });

      // Pedalling half as fast again as the warm-up aims, at the bike's top level, moves the rider no further.
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
      for (let second = 0; second < 6; second++) {
        await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
        await jump(page, 1);
      }
      await expect(ride.cadence).toHaveText('120');
      const sprinting = await placedByTheClock(ride, course);
      expect(sprinting.second).toBeGreaterThanOrEqual(coasting.second + 6);

      // 3:05, 35 seconds into the first effort: its stretch, at its own pace, slower than the warm-up's.
      await jump(page, WARM_UP.duration + 35 - sprinting.second);
      await expect(ride.segmentKind).toHaveText('Work');
      const effort = await placedByTheClock(ride, course);
      expect(effort.second).toBeGreaterThanOrEqual(WARM_UP.duration + 35);
      expect(effort.second).toBeLessThan(WARM_UP.duration + WORK.duration);
      // Past the warm-up's last metre by the effort's seconds at the effort's pace: at the warm-up's the rider
      // would be some thirty metres further on.
      const intoEffort = effort.metres - planMetres(WARM_UP.duration);
      const sinceWarmUp = effort.second - WARM_UP.duration;
      expect(intoEffort).toBeGreaterThanOrEqual(sinceWarmUp * (WORK.cadenceAim / 60) * 5 - 0.5);
      expect(intoEffort).toBeLessThan(sinceWarmUp * (WARM_UP.cadenceAim / 60) * 5 - 20);
    },
  );

  test('a hidden tab draws no frame, and shown again the rider is where the clock puts them (L2-174 AC9, L2-133 AC2)', async ({
    page,
    bluetooth,
    course,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await course.pin('low');
    const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
    await courseDrawnOnPausedClock(page, ride);
    await jump(page, 10);
    const before = await placedByTheClock(ride, course);
    const shown = (await course.drawn())!;

    // Hidden for a minute and a half: the clock runs on and the bike reports, and nothing is drawn.
    await hideTab(page);
    for (let second = 0; second < 3; second++) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      await page.clock.fastForward(30_000);
      await page.clock.runFor(200);
    }
    const hidden = (await course.drawn())!;
    expect(hidden.frames).toBe(shown.frames);
    expect(hidden.metres).toBe(shown.metres);

    // Shown again: the course is drawn from where the clock is, a minute and a half up the road.
    await showTab(page);
    await expect(async () => {
      await page.clock.runFor(160);
      expect((await course.drawn())!.frames).toBeGreaterThan(shown.frames);
    }).toPass();
    const after = await placedByTheClock(ride, course);
    expect(after.second).toBeGreaterThanOrEqual(before.second + 90);
    expect(after.metres).toBeGreaterThan(before.metres + 90 * ((WARM_UP.cadenceAim / 60) * 5) - 10);
  });

  test('the rider rolls on past the finish line through the ending, on the road (L2-174 AC7, L2-182 AC5)', async ({
    page,
    bluetooth,
    course,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await course.pin('low');
    const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
    await courseDrawnOnPausedClock(page, ride);

    // The class length's metres are the finish line's; the clock stops there, and the rider does not.
    await jump(page, theClass.lengthSeconds - 3 - (await ride.clockSeconds()));
    await jump(page, 3);
    await expect(ride.finishBanner).toBeVisible();
    const finish = planMetres(theClass.lengthSeconds);
    const atTheLine = (await course.drawn())!.metres;
    expect(atTheLine).toBeLessThanOrEqual(finish + 20);

    await jump(page, 2);
    const past = (await course.drawn())!.metres;
    expect(past).toBeGreaterThan(finish);
    await jump(page, 4);
    await expect(ride.rollOut).toBeVisible();
    expect((await course.drawn())!.metres).toBeGreaterThan(past);
  });

  test('the same telemetry gives the same time, output and on-target share in Ibiza as with the class video (L2-174 AC4)', async ({
    page,
    bluetooth,
  }) => {
    // This spec is about the figures, not the drawing: the course's files are held and nothing is drawn.
    const files = await CourseFiles.install(page);
    files.hold();

    await startRideInIbizaOnPausedClock(page, bluetooth);
    await rideFortySecondsOnTarget(page, bluetooth);
    const ibiza = await finishAndRead(page);
    expect(ibiza.time).toBe('20:00');
    // 40 of 1,200 seconds on target is 3 %; the output is those 40 seconds' alone.
    expect(ibiza.line).toMatch(/^[1-9]\d* kJ · 3% on target$/);

    // The same class again, with its video, fed the same telemetry.
    await new ClassDonePage(page).done.click();
    const home = new TheClassPage(page);
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(home.classVideo).toBeVisible({ timeout: 50 });
    }).toPass({ intervals: [0] });
    await home.classVideo.click();
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(home.classVideo).toBeChecked({ timeout: 50 });
      // A rider with a finished ride is offered it again (L2-084).
      await expect(home.start).toHaveText('Ride it again', { timeout: 50 });
    }).toPass({ intervals: [0] });
    const writes = bluetooth.writes().length;
    await home.start.click();
    // The second ride has started once its first command has gone, as the first had.
    await expect
      .poll(async () => {
        await page.clock.runFor(1);
        return targetResistanceWrites(bluetooth.writes().slice(writes));
      })
      .toContain(targetResistanceWrite(WARM_UP.level));
    await page.clock.runFor(COUNTDOWN_MS);
    await page.clock.runFor(100);
    await expect(new ClassRidePage(page).video).toHaveCount(1);
    await rideFortySecondsOnTarget(page, bluetooth);
    const video = await finishAndRead(page);

    expect(video).toEqual(ibiza);
    await files.dispose();
  });
});
