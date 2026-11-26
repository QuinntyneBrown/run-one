// Acceptance test
// Traces to: L2-135 AC1, AC2; L2-080 AC5
// Description: a class ride that loses the network carries on: the clock, the plan and the bike are unaffected, and
// when it ends Class Done shows the result and the record is updated, exactly as with a network.
//
// Given a running class ride, when the network is lost, then the clock keeps running.
// Given the ride goes on to its end with no network, then Class Done shows its result and The Class counts the ride.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';
import { TheClassPage } from './pages/the-class.page';

test('a ride that loses the network carries on and finishes with its result and record (L2-135 AC1, AC2) @critical', async ({
  page,
  context,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await page.clock.runFor(5000);
  await expect(ride.clock).toHaveText('0:05 / 20:00');

  await context.setOffline(true);
  for (let second = 0; second < 40; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    await page.clock.runFor(4000);
  }
  await expect(ride.clock).toHaveText('0:45 / 20:00');

  await page.clock.fastForward('19:10');
  await page.clock.runFor(2000);
  const done = new ClassDonePage(page);
  await done.shown();
  await expect(done.time).toHaveText('20:00');
  await expect(done.number).toHaveText(/^[1-9]\d*$/);
  await expect(done.notice).toHaveCount(0);

  await done.done.click();
  const home = new TheClassPage(page);
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return home.stats.isVisible();
    })
    .toBe(true);
  await expect(home.stat('Rides')).toHaveText('1');
});
