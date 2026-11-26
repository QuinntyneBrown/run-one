// Acceptance test
// Traces to: L2-088 AC4; L2-014 AC3; L2-087 AC5; L2-135 AC1
// Description: the class goes on when the video or the bike cannot do its part, and Class Ride says so
// (docs/mocks/pages/class-ride/video-unavailable, by-hand and video-unavailable-by-hand). The video is YouTube's fake
// player, blocked, failing or stalled as it is with no network; the bike is an FTMS bike on the fake Bluetooth whose
// control point answers "not permitted", stays silent, or is not there.
//
// Given the video cannot load, is blocked, fails, or stops for want of a network, when the class ride runs, then the
// plan, the clock and the bike carry on, and a notice under the video says "The video can’t play. The bike will still
// follow the class.", as a polite status said once.
// Given a video that stalls for less than ten seconds of the ride, when it plays again, then no notice was shown; a
// video that plays again after the notice takes the notice away.
// Given an FTMS bike that refuses control, does not answer the request, or has no control point, when a ride runs,
// then telemetry, the clock and the video still work, no resistance command is sent, the stepper is disabled, and a
// notice under the bike panel says "The class can’t set this bike’s resistance. Set it by hand.", said once.
// Given such a bike is lost and comes back, when it reconnects, then nothing is written to it.
// Given either notice or both, when Class Ride shows in a landscape window 768 px wide or more, then nothing scrolls.
// Given a ride where the video plays and the bike takes its target, when it runs, then neither notice shows.
import { COUNTDOWN_MS, startClassRide, startClassRideOnFtms } from './fixtures/class-ride';
import { targetResistanceWrite, targetResistanceWrites } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import {
  CONTROL_GRANTED,
  CONTROL_NOT_PERMITTED,
  CONTROL_POINT,
  INDOOR_BIKE_DATA,
  INDOOR_BIKE_FRAME,
  REQUEST_CONTROL,
  RESISTANCE_RANGE,
  controlPointWrites,
  ftmsBikeWithoutControl,
} from './fixtures/ftms';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import type { YouTubeFixture } from './fixtures/youtube';
import type { Locator, Page } from '@playwright/test';
import { AppDocument } from './pages/app-document';
import type { ClassRidePage } from './pages/class-ride.page';

const VIDEO_WORDS = 'The video can’t play. The bike will still follow the class.';
const BIKE_WORDS = 'The class can’t set this bike’s resistance. Set it by hand.';

/** Landscape windows of L2-087 AC5, the two smallest it names and a tablet. */
const LANDSCAPE = [
  { width: 768, height: 432 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
] as const;

/** Steps the paused clock a frame at a time until `locator` shows: the page renders on a timer the clock holds. */
async function rendered(page: Page, locator: Locator): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(16);
    await expect(locator).toBeVisible({ timeout: 50 });
  }).toPass();
}

/** The ride's player is made and playing. */
async function videoPlaying(page: Page, youtube: YouTubeFixture): Promise<void> {
  await expect.poll(async () => (await youtube.players()).length).toBe(1);
  // The video plays on "Go!", the end of the countdown (L2-180 AC4), counted out on the paused clock if it is not yet.
  await expect
    .poll(
      async () => {
        await page.clock.runFor(100);
        return (await youtube.players())[0].playing;
      },
      { intervals: [10], timeout: 15_000 },
    )
    .toBe(true);
}

/** The ride's first target has asked the bike for control: Request Control is the one write so far. */
async function askedForControl(page: Page, bluetooth: FakeBluetooth): Promise<void> {
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return controlPointWrites(bluetooth.writes());
    })
    .toEqual([REQUEST_CONTROL]);
}

/** The notice is one polite status on the screen, and the app's own live region does not say it a second time. */
async function expectSaidOnce(page: Page, ride: ClassRidePage, words: string): Promise<void> {
  await expect(ride.statuses.filter({ hasText: words })).toHaveCount(1);
  await expect(new AppDocument(page).announcement).not.toContainText(words);
}

/** Nothing scrolls, and the bike panel and whatever is under it end inside the window. */
async function expectNoScroll(
  ride: ClassRidePage,
  window: { width: number; height: number },
): Promise<void> {
  const layout = await ride.layout();
  expect(layout.scrollsDown).toBe(0);
  expect(layout.scrollsSideways).toBe(0);
  expect(layout.panel.y + layout.panel.height).toBeLessThanOrEqual(window.height);
  // The box keeps its floor of 8 rem.
  expect(layout.box.height).toBeGreaterThanOrEqual(128);
}

test.describe('The video that cannot play', () => {
  test('blocked, the notice sits under the video in L2’s words, said once, and the clock, the plan and the bike carry on (L2-088 AC4)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    youtube.block();
    const ride = await startClassRide(page, bluetooth, api);

    await rendered(page, ride.videoNotice);
    await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
    await expect(ride.videoNotice).toHaveRole('status');
    await expectSaidOnce(page, ride, VIDEO_WORDS);
    await expect(ride.bikeNotice).toHaveCount(0);
    // Under the video and over the bike panel.
    const layout = await ride.layout();
    const notice = await ride.drawn(ride.videoNotice);
    expect(notice.y).toBeGreaterThanOrEqual(layout.box.y + layout.box.height);
    expect(notice.y + notice.height).toBeLessThanOrEqual(layout.panel.y);

    // The bike still takes the rider's own level, and the plan's at the next segment.
    await expect(ride.raise).toBeEnabled();
    await ride.raise.click();
    await page.clock.runFor(100);
    expect(targetResistanceWrites(bluetooth.writes()).at(-1)).toBe(
      targetResistanceWrite(theClass.segments[0].level + 1),
    );
    await page.clock.fastForward('02:31');
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('2:31 / 20:00');
    expect(targetResistanceWrites(bluetooth.writes()).at(-1)).toBe(
      targetResistanceWrite(theClass.segments[1].level),
    );
    await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
  });

  test(
    'the network goes mid-ride: a video stalled for ten seconds of the ride raises the notice, the ride goes on, and the notice leaves when the video plays again (L2-088 AC4, L2-135 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth, api, youtube }) => {
      const ride = await startClassRide(page, bluetooth, api);
      await videoPlaying(page, youtube);
      await expect(ride.videoNotice).toHaveCount(0);

      await page.context().setOffline(true);
      await youtube.stall();
      // A short stall is not a video that cannot play.
      await page.clock.runFor(9000);
      await expect(ride.clock).toHaveText('0:09 / 20:00');
      await expect(ride.videoNotice).toHaveCount(0);

      await page.clock.runFor(2000);
      await rendered(page, ride.videoNotice);
      await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
      await expectSaidOnce(page, ride, VIDEO_WORDS);

      // The clock, the plan and the bike carry on without it.
      await page.clock.fastForward('02:20');
      await page.clock.runFor(100);
      await expect(ride.clock).toHaveText('2:31 / 20:00');
      expect(targetResistanceWrites(bluetooth.writes()).at(-1)).toBe(
        targetResistanceWrite(theClass.segments[1].level),
      );
      await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
      await expect(ride.raise).toBeEnabled();

      // The network is back: the video plays on, back on the ride clock plus 0:03, and the notice goes.
      await page.context().setOffline(false);
      await youtube.unstall();
      await page.clock.runFor(2000);
      await expect(ride.videoNotice).toHaveCount(0);
      await expect(ride.clock).toHaveText('2:33 / 20:00');
      expect(await youtube.time()).toBeCloseTo(156, 0);
    },
  );

  test('a video that stalls and plays again within ten seconds shows no notice (L2-088 AC4)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoPlaying(page, youtube);

    await youtube.stall();
    await page.clock.runFor(8000);
    await youtube.unstall();
    await page.clock.runFor(8000);

    await expect(ride.clock).toHaveText('0:16 / 20:00');
    await expect(ride.videoNotice).toHaveCount(0);
  });

  test('a paused ride does not count against the video: no notice however long the pause (L2-088 AC3, AC4)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoPlaying(page, youtube);

    await ride.pause.click();
    await page.clock.runFor(60_000);
    await expect(ride.videoNotice).toHaveCount(0);
    await ride.resume.click();
    await page.clock.runFor(15_000);

    await expect(ride.videoNotice).toHaveCount(0);
    expect((await youtube.players())[0].playing).toBe(true);
  });

  for (const window of LANDSCAPE) {
    test(`with the notice, Class Ride does not scroll at ${window.width} × ${window.height} (L2-087 AC5)`, async ({
      page,
      bluetooth,
      api,
      youtube,
    }) => {
      await page.setViewportSize(window);
      youtube.block();
      const ride = await startClassRide(page, bluetooth, api);
      await rendered(page, ride.videoNotice);

      await expectNoScroll(ride, window);
      const layout = await ride.layout();
      const notice = await ride.drawn(ride.videoNotice);
      expect(notice.y).toBeGreaterThanOrEqual(layout.box.y + layout.box.height);
      expect(notice.y + notice.height).toBeLessThanOrEqual(layout.panel.y);
    });
  }

  test('on a phone the notice is between the video, still 16:9, and the bike panel (L2-088 AC4)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    youtube.block();
    const ride = await startClassRide(page, bluetooth, api);
    await rendered(page, ride.videoNotice);

    const layout = await ride.layout();
    const notice = await ride.drawn(ride.videoNotice);
    expect(layout.box.width / layout.box.height).toBeCloseTo(16 / 9, 1);
    expect(notice.y).toBeGreaterThanOrEqual(layout.box.y + layout.box.height);
    expect(notice.y + notice.height).toBeLessThanOrEqual(layout.panel.y);
    expect(layout.scrollsSideways).toBe(0);
  });
});

test.describe('The bike that refuses control', () => {
  test(
    'a control point that answers "not permitted": the stepper is disabled, the notice says to set the resistance by hand, no resistance command is sent, and telemetry, the clock and the video go on (L2-014 AC3)',
    { tag: '@critical' },
    async ({ page, bluetooth, youtube }) => {
      const ride = await startClassRideOnFtms(page, bluetooth);
      await askedForControl(page, bluetooth);
      await expect(ride.bikeNotice).toHaveCount(0);

      await bluetooth.notify(CONTROL_POINT, CONTROL_NOT_PERMITTED);
      await rendered(page, ride.bikeNotice);
      await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
      await expect(ride.bikeNotice).toHaveRole('status');
      await expectSaidOnce(page, ride, BIKE_WORDS);
      await expect(ride.raise).toBeDisabled();
      await expect(ride.lower).toBeDisabled();
      await expect(ride.videoNotice).toHaveCount(0);
      // Under the bike panel.
      const layout = await ride.layout();
      const notice = await ride.drawn(ride.bikeNotice);
      expect(notice.y).toBeGreaterThanOrEqual(layout.panel.y + layout.panel.height);

      // Into the first effort: the clock, the plan, the bike's readings and the video go on, and nothing more is
      // written to the bike, at the segment's start or when the stepper is pressed.
      await videoPlaying(page, youtube);
      await page.clock.fastForward('02:31');
      await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);
      await page.clock.runFor(100);
      await expect(ride.clock).toHaveText('2:31 / 20:00');
      await expect(ride.segmentKind).not.toHaveText('Warm-up');
      await expect(ride.cadence).toHaveText('80');
      expect(await youtube.time()).toBeCloseTo(154, 0);
      await ride.raise.click({ force: true });
      await page.clock.runFor(100);
      expect(bluetooth.writes().map((write) => write.hex)).toEqual([REQUEST_CONTROL]);
      await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
      await expect(ride.lost).toHaveCount(0);
    },
  );

  test('a bike that does not answer the request within 3 s is set by hand, and is not asked again (L2-014 AC3)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startClassRideOnFtms(page, bluetooth);
    await askedForControl(page, bluetooth);
    await page.clock.runFor(2900);
    await expect(ride.bikeNotice).toHaveCount(0);

    await page.clock.runFor(200);
    await rendered(page, ride.bikeNotice);
    await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
    await expect(ride.raise).toBeDisabled();
    await page.clock.fastForward('02:31');
    await page.clock.runFor(100);
    expect(bluetooth.writes().map((write) => write.hex)).toEqual([REQUEST_CONTROL]);
  });

  test('a bike with no control point: nothing is ever written to it, the stepper is disabled and the notice shows from the start (L2-014 AC3)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    const ride = await startClassRideOnFtms(page, bluetooth, ftmsBikeWithoutControl);

    await rendered(page, ride.bikeNotice);
    await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
    await expectSaidOnce(page, ride, BIKE_WORDS);
    await expect(ride.raise).toBeDisabled();
    await expect(ride.lower).toBeDisabled();

    await videoPlaying(page, youtube);
    await page.clock.fastForward('02:31');
    await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('2:31 / 20:00');
    await expect(ride.cadence).toHaveText('80');
    expect(await youtube.time()).toBeCloseTo(154, 0);
    expect(bluetooth.writes()).toEqual([]);
  });

  test('lost and back, a bike that refused control is written nothing, and the notice and the disabled stepper stay (L2-014 AC3, L2-092 AC3)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startClassRideOnFtms(page, bluetooth);
    await askedForControl(page, bluetooth);
    await bluetooth.notify(CONTROL_POINT, CONTROL_NOT_PERMITTED);
    await rendered(page, ride.bikeNotice);
    await page.clock.runFor(5000);

    await bluetooth.switchOff();
    await bluetooth.drop();
    const afterDrop = bluetooth.log().length;
    await page.clock.runFor(1000);
    await expect(ride.lost).toBeVisible();
    await bluetooth.switchOn();
    await ride.reconnect.click();
    await expect
      .poll(async () => {
        await page.clock.runFor(1);
        return bluetooth.log().slice(afterDrop);
      })
      .toEqual([
        `subscribe ${INDOOR_BIKE_DATA}`,
        `subscribe ${CONTROL_POINT}`,
        `read ${RESISTANCE_RANGE}`,
      ]);
    await expect(async () => {
      await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);
      await page.clock.runFor(1000);
      await expect(ride.lost).toHaveCount(0, { timeout: 50 });
    }).toPass();

    await page.clock.fastForward('02:31');
    await page.clock.runFor(100);
    await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
    await expect(ride.raise).toBeDisabled();
    expect(bluetooth.writes().map((write) => write.hex)).toEqual([REQUEST_CONTROL]);
  });

  for (const window of LANDSCAPE) {
    test(`with the notice, Class Ride does not scroll at ${window.width} × ${window.height} (L2-087 AC5)`, async ({
      page,
      bluetooth,
    }) => {
      await page.setViewportSize(window);
      const ride = await startClassRideOnFtms(page, bluetooth, ftmsBikeWithoutControl);
      await rendered(page, ride.bikeNotice);

      await expectNoScroll(ride, window);
      const layout = await ride.layout();
      const notice = await ride.drawn(ride.bikeNotice);
      expect(notice.y).toBeGreaterThanOrEqual(layout.panel.y + layout.panel.height);
      expect(notice.y + notice.height).toBeLessThanOrEqual(window.height);
    });
  }
});

test.describe('The video and the bike together, and neither', () => {
  for (const window of [...LANDSCAPE, { width: 390, height: 844 }] as const) {
    test(`a blocked video on a bike with no control point shows both notices at ${window.width} × ${window.height}, each in its place (L2-088 AC4, L2-014 AC3, L2-087 AC5)`, async ({
      page,
      bluetooth,
      youtube,
    }) => {
      await page.setViewportSize(window);
      youtube.block();
      const ride = await startClassRideOnFtms(page, bluetooth, ftmsBikeWithoutControl);
      await rendered(page, ride.videoNotice);
      await rendered(page, ride.bikeNotice);

      await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
      await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
      await expectSaidOnce(page, ride, VIDEO_WORDS);
      await expectSaidOnce(page, ride, BIKE_WORDS);
      const layout = await ride.layout();
      const video = await ride.drawn(ride.videoNotice);
      const bike = await ride.drawn(ride.bikeNotice);
      expect(video.y).toBeGreaterThanOrEqual(layout.box.y + layout.box.height);
      expect(video.y + video.height).toBeLessThanOrEqual(layout.panel.y);
      expect(bike.y).toBeGreaterThanOrEqual(layout.panel.y + layout.panel.height);
      expect(layout.scrollsSideways).toBe(0);
      if (window.width > window.height) {
        await expectNoScroll(ride, window);
        expect(bike.y + bike.height).toBeLessThanOrEqual(window.height);
      }

      // The ride goes on with neither.
      await page.clock.runFor(COUNTDOWN_MS);
      await page.clock.fastForward('02:31');
      await page.clock.runFor(100);
      await expect(ride.clock).toHaveText('2:31 / 20:00');
      expect(bluetooth.writes()).toEqual([]);
    });
  }

  test('on the Echelon with the video playing, neither notice shows (L2-088 AC4, L2-014 AC3)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoPlaying(page, youtube);

    await page.clock.fastForward('05:30');
    await page.clock.runFor(100);

    await expect(ride.clock).toHaveText('5:30 / 20:00');
    await expect(ride.videoNotice).toHaveCount(0);
    await expect(ride.bikeNotice).toHaveCount(0);
    await expect(ride.raise).toBeEnabled();
  });

  test('an FTMS bike that grants control takes its target and shows no notice (L2-014 AC2, AC3)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    const ride = await startClassRideOnFtms(page, bluetooth);
    await askedForControl(page, bluetooth);

    await bluetooth.notify(CONTROL_POINT, CONTROL_GRANTED);
    // Level 14 of 32 on a range of 1.0 to 100.0 in steps of 1.0 is 43.0: Set Target Resistance Level 430.
    await expect
      .poll(async () => {
        await page.clock.runFor(1);
        return controlPointWrites(bluetooth.writes());
      })
      .toEqual([REQUEST_CONTROL, '04 AE 01']);
    await videoPlaying(page, youtube);
    await page.clock.runFor(15_000);

    await expect(ride.bikeNotice).toHaveCount(0);
    await expect(ride.videoNotice).toHaveCount(0);
    await expect(ride.raise).toBeEnabled();
    await expect(ride.lower).toBeEnabled();
  });
});
