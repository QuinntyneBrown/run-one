// Performance check, run only when a person asks (`npm run perf`)
// Traces to: L2-136 AC3
// Description: on the reference tablet (an 11-inch 1194 × 834 screen, its CPU 4 times slower than this machine's), a
// class ride that runs for a minute with the bike notifying each second has no frame of the interface longer than
// 100 ms. The page reports its own long animation frames through PerformanceObserver.
import { echelonBike, ECHELON_NOTIFY, workoutFrame } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { startClassRide } from '../fixtures/class-ride';

const FRAME_MS = 100;
const SLOWDOWN = 4;

test.use({ viewport: { width: 1194, height: 834 }, hasTouch: true });

test('a class ride on the reference tablet has no interface frame over 100 ms (L2-136 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  await bluetooth.remember(echelonBike);
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: SLOWDOWN });
  await page.addInitScript(() => {
    const longest = { ms: 0 };
    (window as unknown as { __longestFrame: { ms: number } }).__longestFrame = longest;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longest.ms = Math.max(longest.ms, entry.duration);
    }).observe({ type: 'long-animation-frame', buffered: true });
  });
  await startClassRide(page, bluetooth, api);
  await page.clock.resume();
  for (let second = 0; second < 60; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.waitForTimeout(1000);
  }

  const longest = await page.evaluate(
    () => (window as unknown as { __longestFrame: { ms: number } }).__longestFrame.ms,
  );
  expect(longest).toBeLessThanOrEqual(FRAME_MS);
});
