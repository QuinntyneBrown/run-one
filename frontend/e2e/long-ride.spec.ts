// Acceptance test
// Traces to: L2-138 AC2; L2-078 AC1
// Description: a ride keeps its record bounded: its seconds, its output and its seconds on target, never a list that
// grows with it (the recorder's unit test). The class ridden to its end, the bike reporting all the way, opens Class Done
// with 20:00, its output and its share on target.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';

test('the class rides to its end, and Class Done shows 20:00 with its output and average (L2-138 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.clock.runFor(1000);
  await expect(ride.clock).toHaveText('0:01 / 20:00');

  await page.clock.fastForward('19:58');
  await page.clock.runFor(2000);

  const done = new ClassDonePage(page);
  await done.shown();
  await expect(page).toHaveURL('/done');
  await expect(done.time).toHaveText('20:00');
  await expect(done.number).toHaveText(/^\d+$/);
  await expect(done.average).toHaveText(/^\d+ W$/);
});
