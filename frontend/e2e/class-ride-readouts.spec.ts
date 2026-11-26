// Acceptance test
// Traces to: L2-134 AC1, AC2
// Description: Class Ride's readouts follow the bike and the clock. A notification from the bike shows in Power and
// Cadence within 250 ms; each second that passes moves the clock and the segment's countdown once.
//
// Given a running ride, when the bike notifies, then Power shows it within 250 ms.
// Given a running ride, when a second passes, then the clock goes up by one second and the segment's countdown down by
// one, and neither moves before the second is out.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';

test('Power and Cadence show a notification from the bike within 250 ms (L2-134 AC1)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.runFor(2000);
  await expect(ride.power).toHaveText('—');

  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
  await page.clock.runFor(250);

  await expect(ride.power).toHaveText(/^\d+$/);
  await expect(ride.cadence).toHaveText('91');
});

test('the clock and the segment countdown move once a second (L2-134 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.runFor(10_000);
  await expect(ride.clock).toHaveText('0:10 / 20:00');
  const left = async () => (await ride.segmentLeft.textContent())!.trim();
  const before = await left();

  await page.clock.runFor(500);
  await expect(ride.clock).toHaveText('0:10 / 20:00');
  expect(await left()).toBe(before);

  await page.clock.runFor(500);
  await expect(ride.clock).toHaveText('0:11 / 20:00');
  expect(await left()).not.toBe(before);
});
