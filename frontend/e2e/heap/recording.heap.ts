// Heap check, run only when a person asks (`npm run heap`)
// Traces to: L2-178 AC9, AC19; L2-138 AC1
// Description: with the diagnostic recording on, a ride left open for 3 hours still grows the page's memory by at
// most 50 MB from its first minute to its last. The class is ridden for a minute on Playwright's paused clock and then
// paused; the clock runs three hours in ten-minute steps while the fake bike sends what a real one sends in that time,
// five notifications a second, so the recording passes its limit of 20,000 entries many times over and drops its
// oldest. The used heap is read after a forced garbage collection at minute 1 and at the end.
import { startClassRide } from '../fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { DiagnosticsPage } from '../pages/diagnostics.page';
import { expectHeldHeap, usedHeap } from './heap';

const LIMIT_MB = 50;
const TEN_MINUTES = 10 * 60 * 1000;
const STEPS = 18;
/** What a bike sends in ten minutes at five notifications a second. */
const NOTIFICATIONS_A_STEP = 10 * 60 * 5;

test('a ride left open for 3 hours with the recording on grows the heap by at most 50 MB (L2-178 AC19)', async ({
  page,
  bluetooth,
  api,
}) => {
  test.setTimeout(10 * 60 * 1000);
  const ride = await startClassRide(page, bluetooth, api, { diagnose: true });
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
    await bluetooth.notifyTimes(ECHELON_NOTIFY, workoutFrame(0), NOTIFICATIONS_A_STEP);
    await page.clock.runFor(TEN_MINUTES);
  }
  await expect(ride.clock).toHaveText('1:00 / 20:00');

  expectHeldHeap(
    'A paused ride with the recording on',
    firstMinute,
    await usedHeap(page),
    LIMIT_MB,
  );
  // The recording is at its limit and says what it dropped.
  await page.clock.resume();
  const diagnostics = new DiagnosticsPage(page);
  await diagnostics.mark.click();
  await expect(diagnostics.count).toHaveText(/^20,000 entries · the oldest [\d,]+ were dropped$/);
});
