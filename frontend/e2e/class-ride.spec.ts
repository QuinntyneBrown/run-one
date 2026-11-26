// Acceptance test
// Traces to: L2-087 AC1, AC3; L2-089 AC1 to AC4; L2-027 AC1; L2-026 AC1, AC3; L2-028 AC1, AC4; L2-133 AC2
// Description: a solo class ride on the fake Bluetooth: the header with the class and its clock, the segment card
// counting down the plan, Power and Cadence against their targets, and the resistance stepper. The class's answer is
// held until Playwright's clock is paused (startClassRide), so the ride starts at a known time and the spec moves it
// on by hand. The screen at every width is in class-ride-screen.spec.ts, and its address in ride-address.spec.ts.
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from './fixtures/echelon';
import { startClassRide } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import type { ClassRidePage } from './pages/class-ride.page';

const isTarget = (hex: string): boolean => hex.startsWith('F0 B1 ');

test.describe('Class ride', () => {
  let ride: ClassRidePage;
  let sent: () => string[];

  test.beforeEach(async ({ page, bluetooth, api }) => {
    sent = () => bluetooth.writes().map((write) => write.hex);
    ride = await startClassRide(page, bluetooth, api);
  });

  test(
    'a solo class ride opens at 0:00 on its first segment and sends its level (L2-087 AC1, L2-089 AC1, L2-027 AC1)',
    { tag: '@critical' },
    async () => {
      await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
      expect(ride.url()).toBe('/ride');
      await expect(ride.clock).toHaveText('0:00 / 20:00');
      await expect(ride.clock).toHaveAccessibleName('0:00 of 20:00');
      await expect(ride.segmentKind).toHaveText('Warm-up');
      await expect(ride.segmentLeft).toHaveText('2:30');
      await expect(ride.profile).toBeVisible();
      await expect.poll(sent).toContain(targetResistanceWrite(14));
      await expect(ride.finish).toHaveCount(0);
    },
  );

  test('at 5:30 the clock and the segment card have followed the plan into a recovery, and sent its level (L2-089 AC1, L2-027 AC1, L2-133 AC2)', async ({
    page,
  }) => {
    await page.clock.fastForward('05:30');
    await page.clock.runFor(100);

    await expect(ride.clock).toHaveText('5:30 / 20:00');
    await expect(ride.segmentKind).toHaveText('Recover');
    await expect(ride.segmentLeft).toHaveText('0:30');
    await expect(ride.segmentLeft).toHaveAccessibleName('Recover: 0:30 left');
    await expect.poll(() => ride.segmentProgress()).toBeCloseTo(0.5, 1);
    // Like a tab shown again, the late tick sends only the current segment's level, not the effort it passed.
    await expect.poll(() => sent().filter(isTarget)).toEqual([14, 13].map(targetResistanceWrite));
  });

  test('Power and Cadence read the bike against the segment, and the stepper reads its resistance (L2-089 AC2 to AC4, L2-026 AC1, AC3)', async ({
    page,
    bluetooth,
  }) => {
    await page.clock.fastForward('05:30');
    await page.clock.runFor(100);
    await expect(ride.power).toHaveText('—');
    // No line under Power until the bike has reported what power is estimated from (L2-023 AC2).
    await expect(ride.powerHint).toHaveCount(0);
    await expect(ride.level).toHaveText('—');
    await expect(ride.resistance).toHaveAccessibleName('Resistance unknown');

    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
    await page.clock.runFor(100);

    await expect(ride.power).toHaveText('233');
    await expect(ride.powerHint).toHaveText('On target');
    await expect(ride.cadence).toHaveText('91');
    await expect(ride.cadenceHint).toHaveText('Aim 90');
    await expect(ride.level).toHaveText('13');
    await expect(ride.resistance).toHaveAccessibleName('Resistance 13 of 32');

    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(75));
    await page.clock.runFor(100);

    await expect(ride.power).toHaveText('192');
    await expect(ride.powerHint).toHaveText('-39 W');
  });

  test('Raise and Lower send the next level as the rider’s own, and are off while the bike is away (L2-028 AC1, AC4)', async ({
    page,
    bluetooth,
  }) => {
    await page.clock.fastForward('05:30');
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
    await page.clock.runFor(100);
    await expect(ride.raise).toBeEnabled();

    await ride.raise.click();
    await ride.lower.click();
    await ride.lower.click();

    await expect
      .poll(() => sent().filter(isTarget))
      .toEqual([14, 13, 14, 13, 12].map(targetResistanceWrite));

    await bluetooth.drop();
    await page.clock.runFor(100);

    await expect(ride.raise).toBeDisabled();
    await expect(ride.lower).toBeDisabled();
  });
});
