// Acceptance test
// Traces to: L2-091 AC1, AC2, AC3; L2-088 AC3; L2-092 AC1, AC2, AC3, AC4; L2-017 AC3, AC4; L2-027 AC4;
// L2-093 AC1, AC2, AC3; L2-133 AC3, AC4
// Description: a solo class ride paused and resumed, held for a lost bike, left and finished
// (docs/mocks/pages/class-ride/paused and disconnected). The ride starts on Playwright's paused clock (startClassRide),
// and the shared fixture's fake YouTube player runs on the same clock; nothing sleeps.
//
// Given a running class ride, when the rider presses Pause, then the clock and the video stop under "Paused", Pause
// becomes Resume and the resistance controls stay enabled; Resume picks the clock, the plan and the video up.
// Given the ride is paused or resumed, by touch or by keyboard, when the state changes, then it is announced once.
// Given a class ride, when the bike stops answering, then the ride holds and an alert reads "Lost the bike" and "The
// video is paused. Pedal to wake the bike, then reconnect." with Reconnect; Resume and the resistance controls are
// disabled and Leave stays active.
// Given the bike is back, by a retry or by Reconnect, when it reconnects, then the alert goes, the current segment's
// level is sent and the ride carries on, unless the rider had paused before: then it stays paused until Resume.
// Given a class ride, when the rider presses Leave, then The Class opens without a confirmation, nothing kept on the
// device changes, and no resistance command is sent for that ride again, even when the bike reconnects.
// Given the clock reaches 20:00, when the ride finishes, then the result opens and no resistance command follows.
import type { Page } from '@playwright/test';
import { bikeAnswers, loseBike, startClassRide } from './fixtures/class-ride';
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
  targetResistanceWrites,
} from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { theClass } from './fixtures/the-class';
import { expect, test } from './fixtures/test';
import type { YouTubeFixture } from './fixtures/youtube';
import { AppDocument } from './pages/app-document';
import type { ClassRidePage } from './pages/class-ride.page';
import { TheClassPage } from './pages/the-class.page';
import { ClassDonePage } from './pages/class-done.page';

/** Waits for the fake player, then lets it get ready: its onReady runs on the paused clock. */
async function videoReady(page: Page, youtube: YouTubeFixture): Promise<void> {
  await expect.poll(async () => (await youtube.players()).length).toBe(1);
  await page.clock.runFor(100);
}

/** 5:30 into the class, in the second recovery (level 13), with the bike reporting, as the mocks draw it. */
async function midRide(page: Page, bluetooth: FakeBluetooth, ride: ClassRidePage): Promise<void> {
  await page.clock.fastForward('05:30');
  // The link reads connected from the bike's first notification on.
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveText('5:30 / 20:00');
}

test.describe('Pause, lose the bike, leave or finish', () => {
  test('Pause holds the clock and the video under "Paused" with the stepper on, and Resume carries on from there (L2-091 AC1, AC2, L2-088 AC3)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await midRide(page, bluetooth, ride);

    await ride.pause.click();
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveText('5:30 / 20:00');
    await expect(ride.segmentLeft).toHaveText('0:30');
    await expect(ride.paused).toHaveText('Paused');
    await expect(ride.resume).toBeEnabled();
    await expect(ride.pause).toHaveCount(0);
    expect((await youtube.players())[0].playing).toBe(false);
    expect(await youtube.time()).toBeCloseTo(333.2, 0);
    await expect(ride.raise).toBeEnabled();
    await expect(ride.lower).toBeEnabled();

    await ride.resume.click();
    await page.clock.runFor(2000);
    await expect(ride.clock).toHaveText('5:32 / 20:00');
    await expect(ride.segmentLeft).toHaveText('0:28');
    await expect(ride.paused).toHaveCount(0);
    await expect(ride.pause).toBeEnabled();
    expect((await youtube.players())[0].playing).toBe(true);
    expect(await youtube.time()).toBeCloseTo(335.2, 0);
  });

  test('by keyboard, Pause and Resume are each announced once to a screen reader (L2-091 AC3, L2-140 AC1)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    const app = new AppDocument(page);
    await midRide(page, bluetooth, ride);

    await ride.pause.focus();
    await page.keyboard.press('Enter');
    // The live region takes its words a beat after the change (100 ms), so a screen reader hears it as a change.
    await page.clock.runFor(1000);
    await expect(ride.clock).toHaveText('5:30 / 20:00');
    await expect(app.announcement).toHaveText('Ride paused');
    // Once: the one live region says it, and no other status on the screen repeats it.
    await expect(ride.statuses.filter({ hasText: /paused/i })).toHaveCount(0);
    // The button the rider pressed keeps the focus as it becomes Resume.
    await expect(ride.resume).toBeFocused();

    await page.keyboard.press('Space');
    await page.clock.runFor(1000);
    await expect(ride.clock).toHaveText('5:31 / 20:00');
    await expect(app.announcement).toHaveText('Ride resumed');
    await expect(ride.pause).toBeFocused();
  });

  test(
    'a lost bike holds the ride under "Lost the bike" with Resume and the stepper off, and Reconnect carries it on at the segment’s level (L2-092 AC1, AC2, AC3, L2-017 AC3, AC4)',
    { tag: '@critical' },
    async ({ page, bluetooth, api, youtube }) => {
      const ride = await startClassRide(page, bluetooth, api);
      await videoReady(page, youtube);
      await midRide(page, bluetooth, ride);
      // The rider's own level, one above the recovery's 13.
      await ride.raise.click();
      await page.clock.runFor(100);
      expect(targetResistanceWrites(bluetooth.writes()).at(-1)).toBe(targetResistanceWrite(14));

      const afterDrop = await loseBike(bluetooth);
      await page.clock.runFor(1000);
      await expect(ride.lost).toHaveText(
        'Lost the bike The video is paused. Pedal to wake the bike, then reconnect. Reconnect',
        { useInnerText: true },
      );
      // The ride holds within a second of the drop: the clock, the plan and the video.
      const held = await ride.clock.textContent();
      const left = await ride.segmentLeft.textContent();
      await page.clock.runFor(9000);
      await expect(ride.clock).toHaveText(held!);
      await expect(ride.segmentLeft).toHaveText(left!);
      expect((await youtube.players())[0].playing).toBe(false);
      // Resume and the resistance controls are off; Leave stays active (the mock's header).
      await expect(ride.resume).toBeDisabled();
      await expect(ride.pause).toHaveCount(0);
      await expect(ride.raise).toBeDisabled();
      await expect(ride.lower).toBeDisabled();
      await expect(ride.leave).toBeVisible();
      // The alert says the video is paused; the mock draws no second "Paused" under it.
      await expect(ride.paused).toHaveCount(0);

      // Reconnect tries the bike at once, without waiting for the next retry.
      await bluetooth.switchOn();
      const writes = bluetooth.writes().length;
      await ride.reconnect.click();
      await bikeAnswers(page, bluetooth, afterDrop);
      await page.clock.runFor(2000);
      await expect(ride.lost).toHaveCount(0);
      await expect(ride.pause).toBeEnabled();
      await expect(ride.raise).toBeEnabled();
      await expect(ride.clock).not.toHaveText(held!);
      expect((await youtube.players())[0].playing).toBe(true);
      // The target the connection kept goes first (L2-017 AC4), then the current segment's level (L2-092 AC3).
      expect(targetResistanceWrites(bluetooth.writes().slice(writes))).toEqual([
        targetResistanceWrite(14),
        targetResistanceWrite(13),
      ]);
    },
  );

  test('the bike back by a retry, with nothing pressed, carries the ride on (L2-092 AC3, L2-017 AC1)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await midRide(page, bluetooth, ride);

    const afterDrop = await loseBike(bluetooth);
    await page.clock.runFor(1000);
    await expect(ride.lost).toBeVisible();
    const held = await ride.clock.textContent();

    await bluetooth.switchOn();
    // The next retry, at most 3 seconds away.
    await page.clock.runFor(3000);
    await bikeAnswers(page, bluetooth, afterDrop);
    await page.clock.runFor(2000);
    await expect(ride.lost).toHaveCount(0);
    await expect(ride.clock).not.toHaveText(held!);
    expect((await youtube.players())[0].playing).toBe(true);
    expect(targetResistanceWrites(bluetooth.writes()).at(-1)).toBe(targetResistanceWrite(13));
  });

  test('a ride paused before the bike was lost stays paused when the bike is back, until Resume (L2-092 AC4)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await midRide(page, bluetooth, ride);
    await ride.pause.click();
    await page.clock.runFor(1000);

    const afterDrop = await loseBike(bluetooth);
    await page.clock.runFor(2000);
    await expect(ride.lost).toBeVisible();
    await expect(ride.resume).toBeDisabled();

    await bluetooth.switchOn();
    await ride.reconnect.click();
    await bikeAnswers(page, bluetooth, afterDrop);
    await page.clock.runFor(5000);
    await expect(ride.lost).toHaveCount(0);
    await expect(ride.clock).toHaveText('5:30 / 20:00');
    await expect(ride.paused).toHaveText('Paused');
    await expect(ride.resume).toBeEnabled();
    expect((await youtube.players())[0].playing).toBe(false);

    await ride.resume.click();
    await page.clock.runFor(2000);
    await expect(ride.clock).toHaveText('5:32 / 20:00');
    await expect(ride.paused).toHaveCount(0);
    expect((await youtube.players())[0].playing).toBe(true);
  });

  test('Leave goes to the class at once with no confirmation, keeps nothing new, and stops the ride and its video (L2-093 AC1, AC3)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    const app = new AppDocument(page);
    await videoReady(page, youtube);
    const kept = await app.stored();
    let dialogs = 0;
    page.on('dialog', (dialog) => {
      dialogs += 1;
      void dialog.dismiss();
    });
    await page.clock.fastForward('05:30');
    await page.clock.runFor(100);

    await ride.leave.click();
    await page.clock.runFor(100);
    await expect(page).toHaveURL('/');
    const start = new TheClassPage(page);
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(start.title).toHaveText(theClass.title, { timeout: 50 });
    }).toPass();
    expect(dialogs).toBe(0);
    await expect(ride.confirmation).toHaveCount(0);
    // The ride is not finished: nothing the app keeps on the device changed (L2-168 AC2).
    expect(await app.stored()).toEqual(kept);
    expect((await youtube.players())[0].destroyed).toBe(true);

    // The plan no longer drives the bike: the next effort, at 6:00, never sends its level.
    const writes = bluetooth.writes().length;
    await page.clock.runFor(120_000);
    expect(targetResistanceWrites(bluetooth.writes().slice(writes))).toEqual([]);

    // Nor does the ride's last level go to the bike when it drops and reconnects on The Class.
    const afterDrop = await loseBike(bluetooth);
    await bluetooth.switchOn();
    await page.clock.runFor(3000);
    await bikeAnswers(page, bluetooth, afterDrop);
    await page.clock.runFor(5000);
    await expect(start.start).toHaveText('Start class');
    expect(targetResistanceWrites(bluetooth.writes().slice(writes))).toEqual([]);
  });

  for (const window of [
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    test(`with the bike lost, Leave still takes a press at ${window.width} px and opens The Class (L2-092 AC2, L2-093 AC1)`, async ({
      page,
      bluetooth,
      api,
    }) => {
      await page.setViewportSize(window);
      const ride = await startClassRide(page, bluetooth, api);
      await midRide(page, bluetooth, ride);
      await loseBike(bluetooth);
      await page.clock.runFor(1000);
      await expect(ride.lost).toBeVisible();

      // A press where Leave is drawn reaches it: the alert does not lie over the header.
      await ride.leave.click({ timeout: 5000 });
      await page.clock.runFor(100);
      await expect(page).toHaveURL('/');
      await expect(ride.lost).toHaveCount(0);
    });
  }

  test('at the class length the ride ends, the result opens, and no resistance command follows (L2-093 AC2, AC3)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await page.clock.fastForward('19:58');
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(11));
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('19:58 / 20:00');

    await page.clock.runFor(2000);
    await new ClassDonePage(page).shown();
    await expect(page).toHaveURL('/done');
    expect((await youtube.players())[0].destroyed).toBe(true);

    // The finished ride sends nothing more, even when the bike drops and reconnects on the result.
    const writes = bluetooth.writes().length;
    const afterDrop = await loseBike(bluetooth);
    await bluetooth.switchOn();
    await page.clock.runFor(3000);
    await bikeAnswers(page, bluetooth, afterDrop);
    await page.clock.runFor(5000);
    expect(targetResistanceWrites(bluetooth.writes().slice(writes))).toEqual([]);
  });

  test('the screen stays awake through the ride, is kept awake again when the tab comes back, and is let go on leaving (L2-133 AC3)', async ({
    page,
    bluetooth,
    api,
    wakeLock,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await expect.poll(() => wakeLock.locks()).toEqual([{ type: 'screen', released: false }]);

    await wakeLock.hide();
    await page.clock.runFor(60_000);
    await wakeLock.show();
    await expect
      .poll(() => wakeLock.locks())
      .toEqual([
        { type: 'screen', released: true },
        { type: 'screen', released: false },
      ]);

    await ride.leave.click();
    await page.clock.runFor(100);
    await expect
      .poll(async () => (await wakeLock.locks()).map((lock) => lock.released))
      .toEqual([true, true]);
  });

  test('closing or reloading the tab mid-ride asks the rider to confirm (L2-133 AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    // The browser asks only on a page the rider has interacted with.
    await ride.pause.click();
    const asked = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const dialog = await asked;
    expect(dialog.type()).toBe('beforeunload');
    await dialog.accept();
  });
});
