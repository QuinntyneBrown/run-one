// Acceptance test
// Traces to: L2-170 AC1 to AC4; L2-078 AC2
// Description: Class Done shows "On target" with the share of the ride's running seconds on target, a whole percentage
// rounded to nearest, after Time and Average. A second is on target when the rider's power is within 10 % of the
// segment's target power; a second of unknown power is not. The class has no segment without a cadence aim, so every
// running second counts.
//
// Given a finished ride, when Class Done shows, then the facts read Time, Average, On target and then the best fact.
// Given the warm-up ridden on target for 40 of the class's 1,200 seconds, then On target reads "3%".
// Given the bike never reports, then On target reads "0%".
import { startClassRide } from './fixtures/class-ride';
import { openClassDone, soloClass } from './fixtures/class-done';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';

test.describe('Class Done’s on-target share', () => {
  test('shows On target as a whole percentage after Time and Average, before the best fact (L2-078 AC2, L2-170 AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await openClassDone(page, soloClass());
    const done = new ClassDonePage(page);

    // 0.838 of the ride on target.
    await expect(done.onTarget).toHaveText('84%');
    await expect(page.locator('.class-done__fact-label')).toHaveText([
      'Time',
      'Average',
      'On target',
      'Best',
    ]);
  });

  test('is the seconds within 10 % of target over the running seconds: 40 of 1,200 is 3% (L2-170 AC1, AC2, AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);
    // The warm-up's level 14 at its 80 rpm aim is its target for 40 seconds; then the rider stops pedalling to the end.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
    for (let second = 0; second < 40; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(4000);
    }
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(0));
    await page.clock.runFor(1000);
    await page.clock.fastForward('19:17');
    await page.clock.runFor(2000);
    const done = new ClassDonePage(page);
    await done.shown();

    await expect(done.time).toHaveText('20:00');
    await expect(done.onTarget).toHaveText('3%');
  });

  test('counts a second of unknown power as not on target (L2-170 AC3)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);
    // The bike reports nothing at all: no power is known for any second.
    await page.clock.fastForward('19:59');
    await page.clock.runFor(2000);
    const done = new ClassDonePage(page);
    await done.shown();

    await expect(done.time).toHaveText('20:00');
    await expect(done.onTarget).toHaveText('0%');
  });
});
