// Acceptance test
// Traces to: L2-182 AC1, AC2, AC4, AC6
// Description: after the finish the target resistance steps down one level at a time, 110 ms apart, to level 4 while
// the finish banner shows; the stepper is off; the roll-out card shows with its bar, the video plays on, and Class Done
// opens on its own when the roll-out is over.
//
// Given the ride is finished at the last segment's level, when the banner shows, then the levels fall to 4, 110 ms apart.
// Given the ending, then Lower resistance and Raise resistance are disabled.
// Given the banner is over, then the roll-out card shows its title, its line and a bar that fills.
// Given the roll-out is over, then Class Done opens by itself.
import { startClassRide } from './fixtures/class-ride';
import { targetResistanceWrite, targetResistanceWrites } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { ClassDonePage } from './pages/class-done.page';

/** The levels the bike eases off through: one below the other, from the one it stands at down to 4. */
const easeOffLevels = (from: number): number[] =>
  Array.from({ length: Math.max(0, from - 4) }, (_, index) => from - 1 - index);

test.describe('Easing off and rolling on', () => {
  test(
    'the bike eases off to level 4 while the banner shows, the roll-out card fills, and Class Done opens by itself (L2-182 AC1, AC2, AC4, AC6)',
    { tag: '@critical' },
    async ({ page, bluetooth, api, youtube }) => {
      const ride = await startClassRide(page, bluetooth, api);
      const last = theClass.segments.at(-1)!.level;
      await page.clock.fastForward('19:58');
      await page.clock.runFor(2500);
      await expect(ride.finishBanner).toBeVisible();

      // One level at a time, 110 ms apart: all of them within the 3.2 s of the banner.
      await expect
        .poll(async () => {
          await page.clock.runFor(110);
          return targetResistanceWrites(bluetooth.writes()).at(-1);
        })
        .toBe(targetResistanceWrite(4));
      const writes = targetResistanceWrites(bluetooth.writes());
      expect(writes.slice(-easeOffLevels(last).length)).toEqual(
        easeOffLevels(last).map((level) => targetResistanceWrite(level)),
      );
      await expect(ride.raise).toBeDisabled();
      await expect(ride.lower).toBeDisabled();

      // The banner gives way to the roll-out card, whose bar fills.
      await page.clock.runFor(2500);
      await expect(ride.finishBanner).toHaveCount(0);
      await expect(ride.rollOut).toBeVisible();
      await expect(ride.rollOutTitle).toHaveText('Rolling on');
      await expect(ride.rollOutLine).toHaveText('Easy spin. Your summary is coming up.');
      const first = Number(await ride.rollOutBar.getAttribute('aria-valuenow'));
      await page.clock.runFor(2000);
      expect(Number(await ride.rollOutBar.getAttribute('aria-valuenow'))).toBeGreaterThan(first);
      expect((await youtube.players())[0].playing).toBe(true);
      await expect(ride.pause).toHaveCount(0);
      await expect(ride.leave).toHaveCount(0);

      await new ClassDonePage(page).shown();
      await expect(page).toHaveURL('/done');
    },
  );
});
