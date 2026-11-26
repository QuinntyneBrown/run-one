// Acceptance test
// Traces to: L2-171 AC1, AC2, AC3, AC5; L2-080 AC3; L2-008 AC2; L2-009 AC1; L2-010 AC1
// Description: The Class fits the screen it is on. In landscape from 1024 px wide (1024 × 768, an 11" tablet at
// 1194 × 834, a desktop at 1440 × 900) it is one screen that does not scroll: the video takes the height left and stays
// 16:9, "What the bike will do" sits under it, and the details, the choice of how to ride and the start button sit in
// a fixed column on the right, in every state, a blocked browser's with its alert under the header included. A landscape window too short for all of it scrolls, and cuts nothing
// off. On a phone or a tablet in portrait (390 × 844, 834 × 1194) it is one column in the order video, details, the
// choice of how to ride, "What the bike will do", with the start button pinned to the bottom, clear of the home bar,
// and nothing behind it at the end of the scroll. In either layout exactly one start button shows, and Tab reaches it.
// (The returning rider's record, L2-171 AC4: journey 32.)
import { connectBike } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { homeBar } from './fixtures/home-bar';
import { keptRideWith } from './fixtures/how-to-ride';
import { expect, test } from './fixtures/test';
import { ShippedClassData } from './fixtures/the-class';
import type { FakeWebGl } from './fixtures/webgl';
import type { YouTubeFixture } from './fixtures/youtube';
import { AppDocument } from './pages/app-document';
import { ClassRidePage } from './pages/class-ride.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { TheClassPage } from './pages/the-class.page';
import type { Page } from '@playwright/test';

interface Given {
  page: Page;
  bluetooth: FakeBluetooth;
  webgl: FakeWebGl;
  youtube: YouTubeFixture;
}

/** Each state of The Class with a body (docs/mocks/pages/the-class/), opened and at rest. */
const states: Record<string, (given: Given) => Promise<TheClassPage>> = {
  'with a connected bike': async ({ page, bluetooth }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();
    await connectBike(bluetooth);
    await expect(theClass.start).toHaveText('Start class');
    await theClass.videoSettled();
    return theClass;
  },
  'with no bike': async ({ page }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.start).toHaveText('Connect your bike');
    await expect(theClass.startHint).toBeVisible();
    await theClass.videoSettled();
    return theClass;
  },
  'with Ibiza chosen': async ({ page }) => {
    await keptRideWith(page, 'ibiza');
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.still).toBeVisible();
    return theClass;
  },
  'where the course cannot be drawn': async ({ page, webgl }) => {
    await webgl.disable();
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.ibizaDetail).toHaveText('This browser can’t draw Ibiza.');
    await theClass.videoSettled();
    return theClass;
  },
  'when the video cannot load': async ({ page, youtube }) => {
    youtube.block();
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.cover).toBeVisible();
    await theClass.videoSettled();
    return theClass;
  },
  // A blocked browser (docs/mocks/pages/the-class/needs-chromium and needs-https): the alert takes its height from
  // the room under the header, and the start button is disabled, with its line (L2-008 AC2, L2-009 AC1, L2-010 AC1).
  'in a browser without Web Bluetooth': async ({ page, bluetooth }) => {
    await bluetooth.remove();
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.noticeAction).toHaveText('Copy link');
    await expect(theClass.start).toBeDisabled();
    await expect(theClass.startHint).toBeVisible();
    await theClass.videoSettled();
    return theClass;
  },
  'on plain http': async ({ page, bluetooth }) => {
    await bluetooth.servePlainHttp();
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.noticeAction).toHaveText('Open over HTTPS');
    await expect(theClass.start).toBeDisabled();
    await expect(theClass.startHint).toBeVisible();
    await theClass.videoSettled();
    return theClass;
  },
};

/** The landscape windows of L2-171 AC1, with the width of the details column the design gives each. */
const landscape = [
  { width: 1024, height: 768, aside: 380 },
  { width: 1194, height: 834, aside: 380 },
  { width: 1440, height: 900, aside: 420 },
] as const;

/** The windows of L2-171 AC2: a phone and an 11" tablet in portrait. */
const portrait = [
  { width: 390, height: 844 },
  { width: 834, height: 1194 },
] as const;

test.describe('The Class by form factor', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  for (const { width, height, aside } of landscape) {
    for (const [state, open] of Object.entries(states)) {
      test(
        `at ${width} × ${height} ${state}, The Class is one screen that does not scroll: the video 16:9 in the height left, "What the bike will do" under it, the start button in the column on the right (L2-171 AC1)`,
        { tag: width === 1194 && state === 'with a connected bike' ? '@critical' : [] },
        async ({ page, bluetooth, webgl, youtube }) => {
          await page.setViewportSize({ width, height });
          const theClass = await open({ page, bluetooth, webgl, youtube });

          expect(await theClass.scrollsDownBy()).toBe(0);

          const video = await theClass.box(theClass.video);
          const media = await theClass.box(theClass.media);
          const plan = await theClass.box(theClass.plan);
          const info = await theClass.box(theClass.info);
          const start = await theClass.box(theClass.start);

          // The video stays 16:9 and takes its place whole: as wide as its column, or as tall as the height left.
          expect(video.width / video.height).toBeCloseTo(16 / 9, 2);
          expect(
            Math.abs(video.width - media.width) < 1 || Math.abs(video.height - media.height) < 1,
          ).toBe(true);
          expect(video.top).toBeGreaterThanOrEqual(media.top - 0.5);
          expect(video.bottom).toBeLessThanOrEqual(media.bottom + 0.5);

          // "What the bike will do" sits under the video, in the video's column, and ends inside the window.
          expect(plan.top).toBeGreaterThanOrEqual(media.bottom);
          expect(plan.left).toBeCloseTo(media.left, 0);
          expect(plan.right).toBeCloseTo(media.right, 0);
          expect(plan.bottom).toBeLessThanOrEqual(height);

          // The details column is fixed in width, on the right of the video and the card.
          expect(info.width).toBeCloseTo(aside, 0);
          expect(info.left).toBeGreaterThan(media.right);
          expect(info.right).toBeLessThanOrEqual(width);
          for (const part of [theClass.title, theClass.summary, theClass.rideWith]) {
            const box = await theClass.box(part);
            expect(box.left).toBeGreaterThanOrEqual(info.left - 0.5);
            expect(box.right).toBeLessThanOrEqual(info.right + 0.5);
            expect(box.top).toBeGreaterThanOrEqual(info.top - 0.5);
            expect(box.bottom).toBeLessThanOrEqual(start.top);
          }

          // The start button ends the column, whole inside the window, with its line under it where it has one.
          expect(start.left).toBeCloseTo(info.left, 0);
          expect(start.right).toBeCloseTo(info.right, 0);
          // As tall as the design draws it from lg: 64 px.
          expect(start.height).toBeCloseTo(64, 0);
          expect(start.bottom).toBeLessThanOrEqual(height);
          if ((await theClass.startHint.count()) > 0) {
            const hint = await theClass.box(theClass.startHint);
            expect(hint.top).toBeGreaterThanOrEqual(start.bottom);
            expect(hint.bottom).toBeLessThanOrEqual(height);
          }
          await expect(theClass.footer).toBeHidden();
        },
      );
    }

    test(`at ${width} × ${height} the class that cannot be loaded says so with Reload, on one screen that does not scroll (L2-171 AC1, L2-080 AC3)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      const data = await ShippedClassData.break(page);
      const theClass = new TheClassPage(page);
      await theClass.open();

      await expect(theClass.unavailable).toBeVisible();
      expect(data.brokenScripts()).toBeGreaterThan(0);
      expect(await theClass.scrollsDownBy()).toBe(0);
      expect((await theClass.box(theClass.reload)).bottom).toBeLessThanOrEqual(height);
      await expect(theClass.start).toHaveCount(0);
    });
  }

  test('in a landscape window too short for the video at its column’s width, the video takes the height left, still 16:9, and nothing scrolls (L2-171 AC1)', async ({
    page,
    bluetooth,
    webgl,
    youtube,
  }) => {
    await page.setViewportSize({ width: 1440, height: 660 });
    const theClass = await states['with a connected bike']({ page, bluetooth, webgl, youtube });

    const video = await theClass.box(theClass.video);
    const media = await theClass.box(theClass.media);
    const plan = await theClass.box(theClass.plan);

    expect(await theClass.scrollsDownBy()).toBe(0);
    expect(video.width / video.height).toBeCloseTo(16 / 9, 2);
    // The height left is the limit here: the video is as tall as its place and narrower than its column, centred.
    expect(video.height).toBeCloseTo(media.height, 0);
    expect(video.width).toBeLessThan(media.width - 1);
    expect(video.left - media.left).toBeCloseTo(media.right - video.right, 0);
    expect(plan.bottom).toBeLessThanOrEqual(660);
    expect((await theClass.box(theClass.start)).bottom).toBeLessThanOrEqual(660);
  });

  test('a landscape window too short for the details column scrolls, and cuts nothing off: the video is still drawn and the start button comes whole into view (L2-171 AC1, L2-139 AC1)', async ({
    page,
    bluetooth,
    webgl,
    youtube,
  }) => {
    await page.setViewportSize({ width: 1024, height: 480 });
    const theClass = await states['with no bike']({ page, bluetooth, webgl, youtube });

    expect(await theClass.scrollsDownBy()).toBeGreaterThan(0);
    const video = await theClass.box(theClass.video);
    expect(video.width / video.height).toBeCloseTo(16 / 9, 2);
    expect(video.height).toBeGreaterThanOrEqual(160);

    await theClass.scrollToTheEnd();

    const hint = await theClass.box(theClass.startHint);
    expect((await theClass.box(theClass.start)).bottom).toBeLessThanOrEqual(hint.top);
    // The body's 16 px stay under the last line, to within the half pixel a line of text can end on.
    expect(hint.bottom).toBeLessThanOrEqual(480 - 16 + 0.5);
  });

  for (const { width, height } of portrait) {
    for (const [state, open] of Object.entries(states)) {
      test(
        `at ${width} × ${height} ${state}, The Class is one column: video, details, the choice of how to ride, "What the bike will do", over the start button pinned to the bottom (L2-171 AC2, AC3)`,
        { tag: width === 390 && state === 'with a connected bike' ? '@critical' : [] },
        async ({ page, bluetooth, webgl, youtube }) => {
          await page.setViewportSize({ width, height });
          const theClass = await open({ page, bluetooth, webgl, youtube });

          // One column, in the order of L2-171 AC2: each part starts under the one before, and none sits beside it.
          const parts = [
            theClass.video,
            theClass.title,
            theClass.summary,
            theClass.rideWith,
            theClass.duration,
            theClass.plan,
          ];
          const boxes = [];
          for (const part of parts) boxes.push(await theClass.box(part));
          for (let index = 1; index < boxes.length; index++) {
            expect(boxes[index].top).toBeGreaterThanOrEqual(boxes[index - 1].bottom - 0.5);
          }
          for (const box of [boxes[0], boxes[3], boxes[5]]) {
            expect(box.left).toBeCloseTo(boxes[0].left, 0);
            expect(box.right).toBeCloseTo(boxes[0].right, 0);
          }
          expect(boxes[0].width / boxes[0].height).toBeCloseTo(16 / 9, 2);

          // The start button is pinned: in the bar at the bottom of the window, which the page itself never scrolls.
          const footer = await theClass.box(theClass.footer);
          const pinned = await theClass.box(theClass.start);
          expect(footer.bottom).toBeCloseTo(height, 0);
          expect(footer.left).toBe(0);
          expect(footer.right).toBe(width);
          expect(pinned.top).toBeGreaterThanOrEqual(footer.top);
          expect(pinned.height).toBeCloseTo(56, 0);
          expect(pinned.bottom).toBeLessThanOrEqual(height);

          // At the end of the scroll the button has not moved, and the last line of the screen is above its bar.
          await theClass.scrollToTheEnd();
          expect(await theClass.box(theClass.start)).toEqual(pinned);
          expect((await theClass.box(theClass.planNote)).bottom).toBeLessThanOrEqual(footer.top);
          expect((await theClass.box(theClass.plan)).bottom).toBeLessThanOrEqual(footer.top);
        },
      );
    }
  }

  test('on a phone the column scrolls under the header while the page itself does not (L2-171 AC2, AC3)', async ({
    page,
    bluetooth,
    webgl,
    youtube,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const theClass = await states['with no bike']({ page, bluetooth, webgl, youtube });

    expect(await theClass.scrollsDownBy()).toBeGreaterThan(0);
    const header = await theClass.box(theClass.header.lockup);
    const start = await theClass.box(theClass.start);

    await theClass.scrollToTheEnd();

    expect(await theClass.box(theClass.header.lockup)).toEqual(header);
    expect(await theClass.box(theClass.start)).toEqual(start);
    await expect(theClass.planNote).toBeInViewport({ ratio: 1 });
  });

  for (const bar of [0, 34]) {
    test(`on a phone whose home bar is ${bar} px tall, the pinned start button's line ends ${Math.max(12, bar)} px above the bottom of the screen (L2-171 AC3)`, async ({
      page,
      bluetooth,
      webgl,
      youtube,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await homeBar(page, bar);
      const theClass = await states['with no bike']({ page, bluetooth, webgl, youtube });

      // The page covers the display, which is what makes a phone tell it how tall its home bar is.
      expect(await new AppDocument(page).viewport()).toContain('viewport-fit=cover');
      const footer = await theClass.box(theClass.footer);
      const hint = await theClass.box(theClass.startHint);
      expect(footer.bottom).toBeCloseTo(844, 0);
      // Clear of the home bar, and never closer to the edge than the bar's own 12 px.
      expect(844 - hint.bottom).toBeCloseTo(Math.max(12, bar), 0);

      await theClass.scrollToTheEnd();
      expect((await theClass.box(theClass.planNote)).bottom).toBeLessThanOrEqual(footer.top);
    });
  }

  for (const { width, height } of [landscape[1], portrait[0]]) {
    test(`at ${width} × ${height} one start button shows, Tab stops at it once, and Enter starts the class (L2-171 AC5)`, async ({
      page,
      bluetooth,
      webgl,
      youtube,
    }) => {
      await page.setViewportSize({ width, height });
      const theClass = await states['with a connected bike']({ page, bluetooth, webgl, youtube });

      await expect(theClass.start).toHaveCount(1);
      const stops = await theClass.tabStops();
      expect(stops.filter((words) => words === 'Start class')).toEqual(['Start class']);
      // The start button comes after the choice of how to ride, which comes after the header's controls.
      expect(stops).toEqual([
        'Skip to content',
        'Echelon EX-5s connected · Change',
        'Full screen',
        'Class video',
        'Start class',
      ]);

      await theClass.tabTo(theClass.start);
      await page.keyboard.press('Enter');

      await expect(new ClassRidePage(page).name).toContainText('Intervals to the Beat');
    });

    test(`at ${width} × ${height} with no bike one start button shows, Tab stops at it once, and Enter opens Connect Bike (L2-171 AC5)`, async ({
      page,
      bluetooth,
      webgl,
      youtube,
    }) => {
      await page.setViewportSize({ width, height });
      const theClass = await states['with no bike']({ page, bluetooth, webgl, youtube });

      await expect(theClass.start).toHaveCount(1);
      const stops = await theClass.tabStops();
      expect(stops.filter((words) => words === 'Connect your bike')).toEqual(['Connect your bike']);

      await theClass.tabTo(theClass.start);
      await page.keyboard.press('Enter');

      await expect(new ConnectBikePage(page).title).toBeVisible();
    });
  }
});
