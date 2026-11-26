// Acceptance test
// Traces to: L2-078 AC1 to AC5, AC7; L2-079 AC1; L2-141 AC2
// Description: Class Done opens at `/done` when a class ends, from the result the ride hands over: the class in the
// header, the output in whole kJ, the time and the average watts, and Done, its only action, which leads to The Class.
// With no ride just finished `/done` opens The Class instead. (The verdict, the on-target share and the eight efforts
// are slices 32.4 and 32.5; the verdict is class-done-best.spec.ts.)
//
// Given a class ridden to its end, when Class Done opens, then it shows the output, the time and the average watts.
// Given a finished ride, when the rider presses Done, then The Class opens.
// Given no ride just finished, when `/done` is opened, then The Class opens instead.
import { startClassRide } from './fixtures/class-ride';
import { openClassDone, soloClass } from './fixtures/class-done';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';
import { TheClassPage } from './pages/the-class.page';

test.describe('Class Done', () => {
  test('a ridden class shows its output, time and average watts at /done (L2-078 AC1, AC2, AC3, AC4) @critical', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);
    // 120 rpm on the warm-up's level for the whole class: some output, ridden for 20:00.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
    for (let second = 0; second < 40; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(4000);
    }
    await page.clock.fastForward('19:20');
    await page.clock.runFor(2000);
    const done = new ClassDonePage(page);
    await done.shown();

    await expect(page).toHaveURL('/done');
    await expect(done.title).toHaveText('Intervals to the Beat');
    await expect(done.heading).toHaveText('Class done. That’s your number to beat.');
    await expect(done.unit).toHaveText('kJ');
    await expect(done.number).toHaveText(/^[1-9]\d*$/);
    await expect(done.time).toHaveText('20:00');
    const kj = Number(await done.number.textContent());
    // The average is the output over the running seconds: round(kJ × 1000 ÷ 1200), the output itself being whole kJ.
    await expect(done.average).toHaveText(/^\d+ W$/);
    const watts = Number((await done.average.textContent())!.replace(' W', ''));
    expect(Math.abs(watts - (kj * 1000) / 1200)).toBeLessThan(1000 / 1200 / 2 + 0.5);
  });

  test('the output, time and average of a finished ride as a reload finds them (L2-078 AC2, AC3, AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await openClassDone(page, soloClass());
    const done = new ClassDonePage(page);

    await expect(done.number).toHaveText('342');
    await expect(done.unit).toHaveText('kJ');
    await expect(done.time).toHaveText('20:00');
    // 341.6 kJ over 1,200 s.
    await expect(done.average).toHaveText('285 W');
  });

  test('Done is its only action, at least 44 px tall, and leads to The Class (L2-079 AC1)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await openClassDone(page, soloClass());
    const done = new ClassDonePage(page);
    await expect(done.number).toBeVisible();

    await expect(done.main.getByRole('link')).toHaveCount(1);
    await expect(done.main.getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Full screen' })).toHaveCount(1);
    expect((await done.done.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    await done.done.click();
    await expect(page).toHaveURL('/');
    await expect(new TheClassPage(page).title).toHaveText('Intervals to the Beat');
  });

  test('/done with no ride just finished opens The Class (L2-078 AC5)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await new ClassDonePage(page).open();

    await expect(page).toHaveURL('/');
    await expect(new TheClassPage(page).main).toBeAttached();
  });
});
