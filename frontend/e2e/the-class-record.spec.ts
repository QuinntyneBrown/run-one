// Acceptance test
// Traces to: L2-084 AC4, AC5, AC8; L2-171 AC4; L2-079 AC2
// Description: The Class shows the record to a returning rider: "Rides", "Best output" and "Last time", and its start
// button reads "Ride it again". A rider with no finished ride sees none of the three and "Start class". On a phone the
// three figures wrap under "20:00" and do not overlap it. After a ride, Done opens The Class with that ride counted.
//
// Given a record of 6 rides, a best of 342 kJ and a last of 318 kJ and a connected bike, when The Class shows, then it
// reads Rides 6, Best output 342 kJ, Last time 318 kJ and "Ride it again".
// Given no finished ride, then none of the three shows and the button reads "Start class".
// Given a phone, then the three figures sit under "20:00" without overlapping it.
// Given a class ridden to its end, when the rider presses Done, then The Class shows 1 ride and "Ride it again".
import { connectBike, startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';
import { TheClassPage } from './pages/the-class.page';

/** From the next load on, the device holds this record of finished rides. */
async function withRecord(
  page: import('@playwright/test').Page,
  rides: number,
  best: number,
  last: number,
): Promise<void> {
  await page.addInitScript(
    (record) => localStorage.setItem('telo-ride.record', JSON.stringify(record)),
    { rides, best, last },
  );
}

test.describe('The Class with a record', () => {
  test('shows Rides, Best output and Last time, and “Ride it again”, to a returning rider (L2-084 AC5, AC8)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await withRecord(page, 6, 342, 318);
    const home = new TheClassPage(page);
    await home.open();
    await connectBike(bluetooth);

    await expect(home.stat('Rides')).toHaveText('6');
    await expect(home.stat('Best output')).toHaveText('342 kJ');
    await expect(home.stat('Last time')).toHaveText('318 kJ');
    await expect(home.start).toHaveText('Ride it again');
  });

  test('shows none of the three, and “Start class”, to a rider with no finished ride (L2-084 AC4, AC8)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const home = new TheClassPage(page);
    await home.open();

    await connectBike(bluetooth);

    await expect(home.start).toHaveText('Start class');
    await expect(home.stats).toHaveCount(0);
  });

  test('wraps the three figures under “20:00” on a phone without overlapping it (L2-171 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bluetooth.remember(echelonBike);
    await withRecord(page, 6, 342, 318);
    const home = new TheClassPage(page);
    await home.open();
    await expect(home.stat('Rides')).toBeVisible();

    const length = (await page.locator('.the-class__length').boundingBox())!;
    const stats = (await home.stats.boundingBox())!;
    expect(stats.y).toBeGreaterThanOrEqual(length.y + length.height - 1);
    const figures = await home.stats
      .locator('.the-class__stat')
      .evaluateAll((all) => all.map((each) => each.getBoundingClientRect().toJSON()));
    for (let i = 1; i < figures.length; i++) {
      expect(figures[i].left).toBeGreaterThanOrEqual(figures[i - 1].right);
    }
    expect(figures[2].right).toBeLessThanOrEqual(390);
  });

  test('after a ride, Done opens The Class with that ride counted and “Ride it again” (L2-079 AC2)', async ({
    page,
    bluetooth,
    api,
  }) => {
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
    const output = await done.number.textContent();

    await done.done.click();
    const home = new TheClassPage(page);
    await expect
      .poll(async () => {
        await page.clock.runFor(100);
        return home.stats.isVisible();
      })
      .toBe(true);

    await expect(home.stat('Rides')).toHaveText('1');
    await expect(home.stat('Best output')).toHaveText(`${output} kJ`);
    await expect(home.stat('Last time')).toHaveText(`${output} kJ`);
  });
});
