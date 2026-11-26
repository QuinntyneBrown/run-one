// Acceptance test
// Traces to: L2-168 AC1, AC2, AC3; L2-167 AC1, AC2; L2-132 AC2, AC3
// Description: the record of finished rides is kept on the device. It is seen here by where the app opens (the ride
// count, best and last are shown on The Class by slice 32.6): a rider with a finished ride and no remembered bike is
// not new, and one who left a ride before its finish is. The app is opened again, with the bike forgotten, so only the
// record can tell. Nothing leaves the device for a finished ride.
//
// Given a ride finished to its end, when the app opens again at "/" with no remembered bike, then The Class opens.
// Given a ride left before its finish, when the app opens again at "/" with no remembered bike, then Connect Bike opens.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';
import { TheClassPage } from './pages/the-class.page';
import type { Page } from '@playwright/test';

/** From the next load on, the browser knows no remembered bike: only the record can say whether the rider is new. */
async function forgetTheBike(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.removeItem('telo-ride.bike'));
}

test('a ride finished to its end is kept: the app opens on The Class with no remembered bike (L2-168 AC1, AC3, L2-167 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.clock.runFor(1000);
  await page.clock.fastForward('19:58');
  await page.clock.runFor(2000);
  await new ClassDonePage(page).shown();

  await forgetTheBike(page);
  await page.goto('/');

  await expect(page).toHaveURL('/');
  // The Class has the one class's title; the paused clock is moved on while its files load.
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return new TheClassPage(page).title.isVisible();
    })
    .toBe(true);
  // Nothing was sent anywhere for it (L2-132 AC3): the shared fixture fails the spec on a request off localhost.
});

test('a ride left before its finish is not kept: the app opens on Connect Bike with no remembered bike (L2-168 AC2, L2-167 AC1)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.clock.runFor(5000);
  await ride.leave.click();
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return new URL(page.url()).pathname;
    })
    .toBe('/');

  await forgetTheBike(page);
  await page.goto('/');

  await expect(page).toHaveURL('/connect');
});
