// Acceptance test
// Traces to: L2-176 AC9; ADR 0040
// Description: Telo Ride 1 has no synthesised ride sound: a class ride with the class video makes no audio context,
// from its start to the rider leaving.
import { startClassRide } from './fixtures/class-ride';
import { RideAudio } from './fixtures/ride-audio';
import { expect, test } from './fixtures/test';

test('a class ride makes no audio context: there is no synthesised ride sound (L2-176 AC9)', async ({
  page,
  bluetooth,
  api,
}) => {
  const audio = await RideAudio.install(page);
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.runFor(3_000);

  await expect(ride.clock).toHaveText(/^0:03/);
  await ride.leave.click();
  await page.clock.runFor(100);
  await expect(page).toHaveURL('/');
  expect(await audio.counts()).toEqual({ made: 0, closed: 0 });
});
