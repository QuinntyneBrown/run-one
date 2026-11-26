// Acceptance test
// Traces to: L2-168 AC4
// Description: when the record cannot be written (storage full or blocked) a finished ride still shows its result on
// Class Done, and a notice says the ride could not be saved on this device (docs/mocks/pages/class-done/not-saved).
// A ride that was saved shows no notice.
//
// Given storage refuses the record, when a class is ridden to its end, then Class Done shows the output, the time and
// the average, and the notice "This ride could not be saved on this device."
// Given the record is written, then there is no notice.
import { startClassRide } from './fixtures/class-ride';
import { openClassDone, soloClass } from './fixtures/class-done';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';

async function rideToTheEnd(
  page: import('@playwright/test').Page,
  bluetooth: import('./fixtures/fake-bluetooth').FakeBluetooth,
  api: import('./fixtures/api').ApiFixture,
): Promise<ClassDonePage> {
  await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  for (let second = 0; second < 40; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    await page.clock.runFor(4000);
  }
  await page.clock.fastForward('19:20');
  await page.clock.runFor(2000);
  const done = new ClassDonePage(page);
  await done.shown();
  return done;
}

test.describe('A ride that could not be saved', () => {
  test('still shows its result, and says the ride could not be saved on this device (L2-168 AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    // The browser refuses the record: storage is full.
    await page.addInitScript(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'telo-ride.record') throw new DOMException('full', 'QuotaExceededError');
        return set.call(this, key, value);
      };
    });
    const done = await rideToTheEnd(page, bluetooth, api);

    await expect(done.number).toHaveText(/^[1-9]\d*$/);
    await expect(done.time).toHaveText('20:00');
    await expect(done.average).toHaveText(/^\d+ W$/);
    await expect(done.notice).toHaveText(/This ride could not be saved on this device\./);
    await expect(done.notice).toHaveAttribute('role', 'status');
  });

  test('says nothing when the ride was saved (L2-168 AC4)', async ({ page, bluetooth, api }) => {
    const done = await rideToTheEnd(page, bluetooth, api);

    await expect(done.number).toBeVisible();
    await expect(done.notice).toHaveCount(0);
  });

  test('keeps the notice when Class Done is reloaded (L2-168 AC4)', async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    await openClassDone(page, soloClass(342, undefined, false));
    const done = new ClassDonePage(page);

    await expect(done.number).toHaveText('342');
    await expect(done.notice).toBeVisible();
  });
});
