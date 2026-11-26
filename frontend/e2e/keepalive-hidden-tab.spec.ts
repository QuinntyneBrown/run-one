// Acceptance test
// Traces to: L2-016 AC2, L2-133 AC1
// Description: a tab hidden during a class ride, its timers throttled to once a minute as Chrome's are, still sends the
// bike a keepalive about once a second: they are timed from the monotonic clock, not counted from ticks.
//
// Given a running class ride and the tab hidden with throttled timers, when 60 seconds pass, then between 55 and 65
// keepalives `F0 A0 01 01 92` have been written.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, workoutFrame } from './fixtures/echelon';
import { hideTab, showTab } from './fixtures/tab';
import { expect, test } from './fixtures/test';

const KEEPALIVE = 'F0 A0 01 01 92';

test('keepalives keep going about once a second in a hidden tab (L2-016 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startClassRide(page, bluetooth, api);
  await hideTab(page, { throttled: true });
  const before = bluetooth.writes().length;

  for (let second = 0; second < 60; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
  }

  const sent = bluetooth
    .writes()
    .slice(before)
    .filter((write) => write.hex === KEEPALIVE);
  expect(sent.length).toBeGreaterThanOrEqual(55);
  expect(sent.length).toBeLessThanOrEqual(65);
  await showTab(page);
});
