// Acceptance test
// Traces to: L2-087 AC1, AC2, AC3, AC5, AC6; L2-089 AC2 to AC6; L2-140 AC2
// Description: Class Ride as designed (docs/mocks/pages/class-ride/default and off-target), 5:30 into Intervals to the
// Beat on the fake Bluetooth: the header at every width, Power against the recovery's 231 W target in words, Cadence
// with its aim, the 48 px stepper, the bike panel as one row of four from md, and a screen that does not scroll in a
// landscape window 768 px wide or more, with the class video and in Ibiza.
//
// Given a class ride, when it shows, then the header reads the wordmark, the class and "Solo", the clock, Pause,
// Leave class and Full screen, with one hidden heading and nothing that finishes the ride early.
// Given a phone, when the header shows, then the class name and the clock's total are hidden, Pause and Leave are
// 48 px squares, and below 384 px the wordmark's words are hidden.
// Given a window from sm, when the header shows, then its buttons draw as the mock has them (36 px tall, Leave 34 px
// wide) and still take a touch anywhere in 44 × 44 px.
// Given the bike has not reported cadence and resistance, when Power shows, then it reads "—" with no line under it.
// Given power within 10 % of the target, when Power shows, then the line under it reads "On target"; more than 10 %
// under or over, it reads the signed difference in watts.
// Given md or wider, when the bike panel shows, then it is one row of four; below md it is two columns.
// Given a landscape window 768 px wide or more, when Class Ride shows, then nothing scrolls and the video takes the
// height the header and the bike panel leave; a window too short for that scrolls rather than cut the panel off.
// Given a portrait window, when Class Ride shows, then it is one column with the video at 16:9.
// Given a ride in Ibiza, when Class Ride shows, then the course takes the video's box and the rest is the same.
import { startClassRide, startRideInIbiza } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';
import { AppDocument } from './pages/app-document';
import type { ClassRidePage, RideLayout } from './pages/class-ride.page';

/** The windows of L2-087 AC5: landscape, 768 px wide or more, from a phone on its side to a desktop. */
const LANDSCAPE = [
  { width: 768, height: 432 },
  { width: 800, height: 600 },
  { width: 844, height: 390 },
  { width: 932, height: 430 },
  { width: 1024, height: 768 },
  { width: 1194, height: 834 },
  { width: 1440, height: 900 },
] as const;

/** The stage's padding and the gap between the video's box and the bike panel, from sm (space-4 and space-3). */
const PAD = 16;
const GAP = 12;

/** The mid-ride moment of the mocks: 5:30, in the second recovery (90 rpm at level 13, 231 W), at `rpm`. */
async function midRide(page: Page, bluetooth: FakeBluetooth, rpm: number): Promise<void> {
  await page.clock.fastForward('05:30');
  await page.clock.runFor(100);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
  await page.clock.runFor(100);
}

/** The screen fits: nothing scrolls, and the box runs from under the header to the bike panel at the window's foot. */
function expectFits(layout: RideLayout, window: { width: number; height: number }): void {
  expect(layout.scrollsDown).toBe(0);
  expect(layout.scrollsSideways).toBe(0);
  expect(layout.box.x).toBe(PAD);
  expect(layout.box.width).toBe(window.width - 2 * PAD);
  expect(layout.box.y).toBeCloseTo(layout.header.y + layout.header.height + PAD, 0);
  expect(layout.box.y + layout.box.height).toBeCloseTo(layout.panel.y - GAP, 0);
  expect(layout.panel.y + layout.panel.height).toBeCloseTo(window.height - PAD, 0);
  // The video is never squeezed to a strip: 8 rem at least.
  expect(layout.box.height).toBeGreaterThanOrEqual(128);
  // One row of four (L2-089 AC5).
  expect(layout.cells).toHaveLength(4);
  expect(new Set(layout.cells.map((cell) => Math.round(cell.y))).size).toBe(1);
}

test.describe('Class Ride as designed: the header', () => {
  let ride: ClassRidePage;

  test.beforeEach(async ({ page, bluetooth, api }) => {
    ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, 91);
  });

  test('reads the wordmark, the class, the clock, Pause, Leave class and Full screen, with one hidden heading and no way to finish early (L2-087 AC1, AC3)', async ({
    page,
  }) => {
    await expect(ride.header.lockup).toHaveAccessibleName('Telo Ride 1');
    await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
    await expect(ride.clock).toHaveRole('timer');
    await expect(ride.clock).toHaveText('5:30 / 20:00');
    await expect(ride.clock).toHaveAccessibleName('5:30 of 20:00');
    await expect(ride.pause).toHaveText('Pause');
    await expect(ride.leave).toBeVisible();
    await expect(ride.header.fullScreen).toBeVisible();
    await expect(page.getByRole('heading')).toHaveCount(1);
    await expect(ride.heading).toHaveText('Intervals to the Beat · solo class ride');
    // The heading is for a screen reader: it takes no room on the screen.
    expect((await ride.heading.boundingBox())!.width).toBeLessThanOrEqual(1);
    await expect(ride.finish).toHaveCount(0);
    // In the header's order: the wordmark, the class, the clock, Pause, Leave, Full screen.
    const xs = [];
    for (const part of [
      ride.header.lockup,
      ride.name,
      ride.clock,
      ride.pause,
      ride.leave,
      ride.header.fullScreen,
    ])
      xs.push((await part.boundingBox())!.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  test('on a phone the class name and the total are hidden, and Pause and Leave are 48 px squares (L2-087 AC2, L2-140 AC2)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(ride.name).toBeHidden();
    await expect(ride.clockTotal).toBeHidden();
    await expect(ride.clock).toHaveText('5:30', { useInnerText: true });
    await expect(ride.clock).toHaveAccessibleName('5:30 of 20:00');
    await expect(ride.wordmark).toBeVisible();
    await expect(ride.pauseLabel).toBeHidden();
    await expect(ride.pause).toHaveAccessibleName('Pause');
    expect(await ride.pause.boundingBox()).toMatchObject({ width: 48, height: 48 });
    expect(await ride.leave.boundingBox()).toMatchObject({ width: 48, height: 48 });
    // One row, inside the window.
    const full = (await ride.header.fullScreen.boundingBox())!;
    expect(full.x + full.width).toBeLessThanOrEqual(390);
    expect((await ride.header.root.boundingBox())!.height).toBeLessThan(72);
  });

  test('below 384 px the wordmark’s words are hidden and the mark stays; the header still fits (L2-087 AC2)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 383, height: 800 });
    await expect(ride.wordmark).toBeHidden();
    await expect(ride.header.lockup).toBeVisible();

    await page.setViewportSize({ width: 320, height: 640 });
    await expect(ride.wordmark).toBeHidden();
    expect((await ride.layout()).scrollsSideways).toBe(0);
    const full = (await ride.header.fullScreen.boundingBox())!;
    expect(full.x + full.width).toBeLessThanOrEqual(320);

    await page.setViewportSize({ width: 384, height: 800 });
    await expect(ride.wordmark).toBeVisible();
  });

  test('the total shows from sm and the class name from md (L2-087 AC2)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await expect(ride.clockTotal).toBeVisible();
    await expect(ride.pauseLabel).toBeVisible();
    await expect(ride.name).toBeHidden();
    // The header's margin is 24 px from sm, as the mock draws it, and 16 px on a phone.
    expect((await ride.header.lockup.boundingBox())!.x).toBe(24);

    await page.setViewportSize({ width: 767, height: 900 });
    await expect(ride.name).toBeHidden();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(ride.name).toBeVisible();
    await expect(ride.clock).toHaveText('5:30 / 20:00', { useInnerText: true });
    expect((await ride.header.lockup.boundingBox())!.x).toBe(24);

    await page.setViewportSize({ width: 390, height: 844 });
    expect((await ride.header.lockup.boundingBox())!.x).toBe(16);
  });

  test('from sm the buttons draw as designed, 36 px tall with Leave 34 px wide, and take a touch across 44 px (L2-087 AC1, L2-140 AC2)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    expect(await ride.pause.boundingBox()).toMatchObject({ height: 36 });
    expect(await ride.leave.boundingBox()).toMatchObject({ width: 34, height: 36 });
    expect(await ride.header.fullScreen.boundingBox()).toMatchObject({ width: 36, height: 36 });
    expect(await new AppDocument(page).untappable(44)).toEqual([]);
  });
});

test.describe('Class Ride as designed: the bike panel', () => {
  test('before the bike reports, Power and the stepper read a dash and Power has no line under it (L2-089 AC2, L2-023 AC2)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await page.clock.fastForward('05:30');
    await page.clock.runFor(100);

    await expect(ride.power).toHaveText('—');
    await expect(ride.powerHint).toHaveCount(0);
    await expect(ride.cadence).toHaveText('—');
    await expect(ride.cadenceHint).toHaveText('Aim 90');
    await expect(ride.level).toHaveText('—');
  });

  test(
    'Power reads "On target" within 10 % of the target and the signed difference outside it, in words (L2-089 AC2, AC6)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      const ride = await startClassRide(page, bluetooth, api);
      await midRide(page, bluetooth, 91);

      await expect(ride.power).toHaveText('233');
      await expect(ride.powerUnit).toHaveText('W');
      await expect(ride.powerHint).toHaveText('On target');

      // 75 rpm at level 13 is 192 W: 39 W under the recovery's 231 W, more than 10 %.
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(75));
      await page.clock.runFor(100);
      await expect(ride.power).toHaveText('192');
      await expect(ride.powerHint).toHaveText('-39 W');

      // 105 rpm is 269 W: 38 W over.
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(105));
      await page.clock.runFor(100);
      await expect(ride.power).toHaveText('269');
      await expect(ride.powerHint).toHaveText('+38 W');

      // The edge of 10 %: 99 rpm is 254 W, 23 W over 231 W, and still on target.
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(99));
      await page.clock.runFor(100);
      await expect(ride.power).toHaveText('254');
      await expect(ride.powerHint).toHaveText('On target');
    },
  );

  test('Cadence reads the bike with the segment’s aim, and the stepper its resistance between 48 px buttons (L2-089 AC3, AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, 91);

    await expect(ride.cadence).toHaveText('91');
    await expect(ride.cadenceUnit).toHaveText('rpm');
    await expect(ride.cadenceHint).toHaveText('Aim 90');
    await expect(ride.level).toHaveText('13');
    await expect(ride.levelOf).toHaveText('of 32');
    for (const window of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(window);
      expect(await ride.lower.boundingBox()).toMatchObject({ width: 48, height: 48 });
      expect(await ride.raise.boundingBox()).toMatchObject({ width: 48, height: 48 });
      const [lower, value, raise] = [
        (await ride.lower.boundingBox())!,
        (await ride.resistance.boundingBox())!,
        (await ride.raise.boundingBox())!,
      ];
      expect(lower.x + lower.width).toBeLessThanOrEqual(value.x);
      expect(value.x + value.width).toBeLessThanOrEqual(raise.x);
    }
  });

  test('the bike panel is two columns on a phone and one row of four from md (L2-089 AC5)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, 91);

    await page.setViewportSize({ width: 767, height: 1024 });
    let { cells, panel } = await ride.layout();
    // The segment card and the stepper span the panel; Power and Cadence share a row between them.
    expect(cells).toHaveLength(4);
    expect(cells[0].width).toBeCloseTo(panel.width, 0);
    expect(cells[3].width).toBeCloseTo(panel.width, 0);
    expect(cells[1].y).toBe(cells[2].y);
    expect(cells[1].y).toBeGreaterThan(cells[0].y);
    expect(cells[3].y).toBeGreaterThan(cells[1].y);

    await page.setViewportSize({ width: 768, height: 1024 });
    ({ cells, panel } = await ride.layout());
    expect(new Set(cells.map((cell) => Math.round(cell.y))).size).toBe(1);
    expect(new Set(cells.map((cell) => Math.round(cell.height))).size).toBe(1);
    const xs = cells.map((cell) => cell.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    const last = cells[3];
    expect(last.x + last.width).toBeCloseTo(panel.x + panel.width, 0);
  });
});

test.describe('Class Ride as designed: no scrolling in landscape', () => {
  for (const window of LANDSCAPE) {
    test(
      `at ${window.width} × ${window.height} nothing scrolls, and the video takes the height left (L2-087 AC5)`,
      { tag: window.width === 844 ? '@critical' : [] },
      async ({ page, bluetooth, api }) => {
        await page.setViewportSize(window);
        const ride = await startClassRide(page, bluetooth, api);
        await midRide(page, bluetooth, 91);

        expectFits(await ride.layout(), window);
        await expect(ride.raise).toBeInViewport({ ratio: 1 });
      },
    );
  }

  test('a landscape window too short for the video scrolls to the stepper rather than cut it off (L2-087 AC5, L2-139 AC1)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await page.setViewportSize({ width: 800, height: 280 });
    const ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, 91);

    const layout = await ride.layout();
    // The video keeps its floor of 8 rem, so the screen is taller than the window and scrolls.
    expect(layout.box.height).toBe(128);
    expect(layout.scrollsDown).toBeGreaterThan(0);
    expect(layout.scrollsSideways).toBe(0);
    await ride.scrollToEnd();
    await expect(ride.raise).toBeInViewport({ ratio: 1 });
  });

  for (const window of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    test(`in portrait at ${window.width} × ${window.height} it is one column with the video at 16:9 (L2-087 AC5)`, async ({
      page,
      bluetooth,
      api,
    }) => {
      await page.setViewportSize(window);
      const ride = await startClassRide(page, bluetooth, api);
      await midRide(page, bluetooth, 91);

      const layout = await ride.layout();
      expect(layout.box.width / layout.box.height).toBeCloseTo(16 / 9, 1);
      expect(layout.panel.y).toBeGreaterThan(layout.box.y + layout.box.height);
      expect(layout.scrollsSideways).toBe(0);
    });
  }
});

test.describe('Class Ride as designed: in Ibiza', () => {
  test('the course takes the video’s box, nothing scrolls, and the header and the bike panel are the same (L2-087 AC5, AC6)', async ({
    page,
    bluetooth,
  }) => {
    // The spec is about the screen and not the drawing: the course's files are held, and the box is measured with
    // the course's still in it, in the smallest landscape window that must not scroll (class-ride-ibiza.spec.ts
    // draws the course in the same window).
    const files = await CourseFiles.install(page);
    files.hold();
    await page.setViewportSize({ width: 844, height: 390 });
    const ride = await startRideInIbiza(page, bluetooth);

    await expect(ride.box).toHaveClass(/class-course/);
    await expect(ride.courseStill).toBeVisible();
    await expect(ride.video).toHaveCount(0);
    await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
    await expect(ride.clock).toHaveAccessibleName(/^0:\d\d of 20:00$/);
    await expect(ride.pause).toHaveText('Pause');
    await expect(ride.leave).toBeVisible();
    await expect(ride.header.fullScreen).toBeVisible();
    await expect(ride.heading).toHaveText('Intervals to the Beat · solo class ride');
    await expect(ride.segmentKind).toHaveText('Warm-up');
    await expect(ride.profile).toBeVisible();
    await expect(ride.cadenceHint).toHaveText('Aim 80');
    await expect(ride.raise).toBeEnabled();
    expectFits(await ride.layout(), { width: 844, height: 390 });
    await expect(ride.raise).toBeInViewport({ ratio: 1 });
    await files.dispose();
  });
});
