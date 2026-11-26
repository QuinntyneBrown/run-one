// Acceptance test
// Traces to: L2-184 AC1 to AC6; L2-183 AC2; L2-079 AC1
// Description: Class Done asks whether the ride's intensity should be the rider's default when it ended away from it
// (docs/mocks/pages/class-done/intensity and intensity-kept, ADR 0050), and keeps it on the device only at the
// rider's word; the next ride starts at it.
//
// Given a ride raised to 7/10 and ridden to its end, when Class Done opens, then it asks "Make 7/10 your intensity?"
// with "Make it my default" and "Keep 5/10" above Done.
// Given the rider presses "Make it my default", then 7/10 is kept and the card says so, with no buttons.
// Given the rider presses "Keep 5/10", then nothing is kept, the card goes and focus is on Done.
// Given the ride ended at the default, then no card shows; Done unanswered keeps nothing.
// Given 7/10 is kept, when the next ride opens, then it opens at 7/10; a kept value that is not 0 to 10 counts as 5.
// Given storage refuses the default, then the card says it couldn't be kept.
import type { Page } from '@playwright/test';
import { startClassRide } from './fixtures/class-ride';
import { openClassDone, soloClass } from './fixtures/class-done';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';

/** Where the app keeps the rider's default intensity. */
const KEY = 'telo-ride.intensity';

/** Class Done for a ride that ended at `intensity`. */
const endedAt = (intensity: number) => {
  const state = soloClass();
  return { classResult: { ...state.classResult, intensity } };
};

const kept = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);

/** Call before the page loads: the rider kept `value` as their default on an earlier visit. */
const keepBefore = (page: Page, value: string) =>
  page.addInitScript(([key, v]) => localStorage.setItem(key, v), [KEY, value] as const);

test.describe('Intensity default', () => {
  test('a ride raised to 7/10 and ridden to its end asks whether to keep it (L2-184 AC1)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await ride.raiseIntensity.click();
    await page.clock.runFor(50);
    await ride.raiseIntensity.click();
    await page.clock.runFor(100);
    await page.clock.fastForward('19:59');
    await page.clock.runFor(2000);
    const done = new ClassDonePage(page);
    await done.shown();

    await expect(done.intensityTitle).toHaveText('Make 7/10 your intensity?');
    await expect(done.intensityText).toHaveText(
      'Your next rides start at 7/10. It’s kept on this device.',
    );
    for (const button of [done.makeDefault, done.keepDefault]) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(done.keepDefault).toHaveText('Keep 5/10');
    // The card stands above Done, which stays the one primary button.
    expect((await done.drawn(done.intensityCard)).y).toBeLessThanOrEqual(
      (await done.drawn(done.done)).y + 1,
    );
    expect(await kept(page)).toBeNull();
  });

  test(
    '"Make it my default" keeps it and says so, with no buttons (L2-184 AC2)',
    { tag: '@critical' },
    async ({ page }) => {
      await openClassDone(page, endedAt(7));
      const done = new ClassDonePage(page);

      await done.makeDefault.click();

      await expect(done.intensityStatus).toHaveText('7/10 is now your intensity.');
      await expect(done.makeDefault).toHaveCount(0);
      await expect(done.keepDefault).toHaveCount(0);
      expect(await kept(page)).toBe('7');
    },
  );

  test('"Keep 5/10" keeps nothing, and focus moves to Done (L2-184 AC3)', async ({ page }) => {
    await openClassDone(page, endedAt(7));
    const done = new ClassDonePage(page);

    await done.keepDefault.click();

    await expect(done.intensityTitle).toHaveCount(0);
    await expect(done.done).toBeFocused();
    expect(await kept(page)).toBeNull();
  });

  test('no card for a ride that ended at the default, and Done unanswered keeps nothing (L2-184 AC4, AC6)', async ({
    page,
  }) => {
    await keepBefore(page, '7');
    await openClassDone(page, endedAt(7));
    const done = new ClassDonePage(page);
    await expect(done.number).toBeVisible();
    await expect(done.intensityTitle).toHaveCount(0);

    await openClassDone(page, endedAt(3));
    await expect(done.intensityTitle).toHaveText('Make 3/10 your intensity?');
    await expect(done.keepDefault).toHaveText('Keep 7/10');
    await done.done.click();
    // Done leads to The Class, which sends a rider with no remembered bike on to Connect Bike.
    await expect(page).not.toHaveURL(/\/done$/);
    expect(await kept(page)).toBe('7');
  });

  test('says when the device would not keep it (L2-184 AC5)', async ({ page }) => {
    await page.addInitScript((key) => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, value: string) {
        if (k === key) throw new DOMException('full', 'QuotaExceededError');
        return set.call(this, k, value);
      };
    }, KEY);
    await openClassDone(page, endedAt(7));
    const done = new ClassDonePage(page);

    await done.makeDefault.click();

    await expect(done.intensityStatus).toHaveText(
      'Your intensity couldn’t be kept on this device.',
    );
    await expect(done.makeDefault).toHaveCount(0);
  });

  test('a ride opens at the kept default (L2-183 AC2)', async ({ page, bluetooth, api }) => {
    await keepBefore(page, '7');
    // The warm-up's 14 at 7/10 is 16.8, sent as 17.
    const ride = await startClassRide(page, bluetooth, api, { firstLevel: 17 });

    await expect(ride.intensityValue).toHaveText('7/10');
  });

  test('a kept value that is not a whole number from 0 to 10 counts as 5 (L2-184 AC5)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await keepBefore(page, '<b>11</b>');
    const ride = await startClassRide(page, bluetooth, api);

    await expect(ride.intensityValue).toHaveText('5/10');
  });
});
