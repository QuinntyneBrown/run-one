// Heap check, run only when a person asks (`npm run heap`)
// Traces to: L2-138 AC1
// Description: a ride left paused so the screen stays open for 3 hours grows the page's memory by at most 50 MB from its
// first minute to its last. The class is ridden for a minute on Playwright's paused clock, the fake bike notifying each
// second as a real one does, then paused; the clock then runs three hours in ten-minute steps, the bike still
// notifying, and the used heap is read after a forced garbage collection at minute 1 and at the end.
import { startClassRide } from '../fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { expectHeldHeap, usedHeap } from './heap';

const LIMIT_MB = 50;
const TEN_MINUTES = 10 * 60 * 1000;
const STEPS = 18;

test('a ride left paused for 3 hours grows the heap by at most 50 MB (L2-138 AC1)', async ({
  page,
  bluetooth,
  api,
}) => {
  test.setTimeout(10 * 60 * 1000);
  const ride = await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  for (let second = 0; second < 60; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
  }
  await expect(ride.clock).toHaveText('1:00 / 20:00');
  await ride.pause.click();
  await expect(ride.paused).toBeVisible();
  const firstMinute = await usedHeap(page);

  for (let step = 0; step < STEPS; step++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(0));
    await page.clock.runFor(TEN_MINUTES);
  }
  await expect(ride.clock).toHaveText('1:00 / 20:00');

  expectHeldHeap('A paused ride', firstMinute, await usedHeap(page), LIMIT_MB);
});
