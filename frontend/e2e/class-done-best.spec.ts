// Acceptance test
// Traces to: L2-077 AC1, AC2, AC3, AC4
// Description: Class Done's verdict compares the ride's output, in whole kJ, with the best before the ride: "New best
// output" with the output in gold and "Previous best"; "Your best is still {best} kJ" with "Best"; or, for the first
// ride, "Class done. That’s your number to beat." with no best fact. The words carry a new best, never the gold alone.
//
// Given a ride whose output beats the earlier best, when Class Done opens, then the h1 reads "New best output", the
// output is gold and the fact reads "Previous best".
// Given a ride that ties or falls short of the best, then the h1 reads "Your best is still 342 kJ", the output is not
// gold and the fact reads "Best".
// Given the first finished ride, then the h1 reads "Class done. That’s your number to beat." with no best fact.
// Given a class ridden to its end on a device with a record, then the verdict compares with the record's best.
import { startClassRide } from './fixtures/class-ride';
import { openClassDone, soloClass } from './fixtures/class-done';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';

test.describe('Class Done’s verdict', () => {
  test.beforeEach(async ({ bluetooth }) => {
    await bluetooth.remember(echelonBike);
  });

  test('a ride that beats the best says New best output, in gold, with the previous best (L2-077 AC1, AC4)', async ({
    page,
  }) => {
    await openClassDone(page, soloClass(300));
    const done = new ClassDonePage(page);

    await expect(done.heading).toHaveText('New best output');
    await expect(done.heading).toHaveClass(/class-done__verdict--best/);
    await expect(done.number).toHaveText('342');
    await expect(done.output).toHaveClass(/class-done__output--best/);
    await expect(done.bestFact).toHaveText(/Previous best\s*300 kJ/);
  });

  test('a ride that ties the best says the best is still the best, not in gold, with the best (L2-077 AC2)', async ({
    page,
  }) => {
    await openClassDone(page, soloClass(342));
    const done = new ClassDonePage(page);

    await expect(done.heading).toHaveText('Your best is still 342 kJ');
    await expect(done.heading).not.toHaveClass(/class-done__verdict--best/);
    await expect(done.output).not.toHaveClass(/class-done__output--best/);
    await expect(done.bestFact).toHaveText(/^Best\s*342 kJ$/);
  });

  test('a ride that falls short says the best is still the best (L2-077 AC2)', async ({ page }) => {
    await openClassDone(page, soloClass(500));
    const done = new ClassDonePage(page);

    await expect(done.heading).toHaveText('Your best is still 500 kJ');
    await expect(done.bestFact).toHaveText(/^Best\s*500 kJ$/);
  });

  test('the first finished ride is the number to beat, with no best fact and no gold (L2-077 AC3)', async ({
    page,
  }) => {
    await openClassDone(page, soloClass(null));
    const done = new ClassDonePage(page);

    await expect(done.heading).toHaveText('Class done. That’s your number to beat.');
    await expect(done.output).not.toHaveClass(/class-done__output--best/);
    await expect(done.bestFact).toHaveCount(0);
  });

  test('a class ridden to its end is judged against the record on the device (L2-077 AC1, L2-168 AC1)', async ({
    page,
    bluetooth,
    api,
  }) => {
    // A record of an earlier best of 1 kJ: any real ride beats it.
    await page.addInitScript(() =>
      localStorage.setItem('telo-ride.record', JSON.stringify({ rides: 3, best: 1, last: 1 })),
    );
    await startClassRide(page, bluetooth, api);
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
    for (let second = 0; second < 40; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(4000);
    }
    await page.clock.fastForward('19:20');
    await page.clock.runFor(2000);
    const done = new ClassDonePage(page);
    await done.shown();

    await expect(done.heading).toHaveText('New best output');
    await expect(done.bestFact).toHaveText(/Previous best\s*1 kJ/);
  });
});
