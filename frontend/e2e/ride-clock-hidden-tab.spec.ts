// Acceptance test
// Traces to: L2-133 AC2
// Description: a ride's clock comes from the monotonic clock, so a tab hidden for 10 minutes, its timers throttled to
// once a minute as Chrome's are while the bike's notifications still arrive each second, is where a visible tab would
// be the moment it is shown again: the clock and the plan's segment. (A running class asks the rider to confirm before
// the tab closes: class-pause-leave.spec.ts.)
import type { Page } from '@playwright/test';
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { hideTab, showTab } from './fixtures/tab';
import { expect, test } from './fixtures/test';

/** Rides at 85 rpm for `seconds`, a notification from the bike each second. */
async function ride(page: Page, bluetooth: FakeBluetooth, seconds: number): Promise<void> {
  for (let second = 0; second < seconds; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
  }
}

test('a class ride hidden for 10 minutes with its timers throttled shows the clock and the segment a visible tab would (L2-133 AC2) @critical', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride10 = await startClassRide(page, bluetooth, api);
  await ride(page, bluetooth, 10);
  await expect(ride10.clock).toHaveText('0:10 / 20:00');

  await hideTab(page, { throttled: true });
  await ride(page, bluetooth, 600);
  await showTab(page);
  await page.clock.runFor(16);

  await expect(ride10.clock).toHaveText('10:10 / 20:00');
  await expect(ride10.segmentKind).toHaveText('Work');
  await expect(ride10.segmentLeft).toHaveText('0:20');
});
