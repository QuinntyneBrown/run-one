// Acceptance test
// Traces to: L2-007 AC1, AC4; L2-010; L2-167 AC2
// Description: Connect Bike lists the bikes Telo Ride 1 works with, and in a browser that cannot reach the bike The
// Class still opens for a rider who paired a bike before. The alerts that say why the bike cannot be reached are in
// connect-bike-alerts.spec.ts, and where a new rider opens in such a browser in where-the-app-opens.spec.ts.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { TheClassPage } from './pages/the-class.page';

test.describe('Browser support on Connect Bike', () => {
  test('lists the bikes it works with, one column on a phone and two from sm (L2-007)', async ({
    page,
  }) => {
    const connect = new ConnectBikePage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await connect.open();

    await expect(connect.worksWith).toBeVisible();
    await expect(connect.blocker).toHaveCount(0);
    await expect(connect.worksWithBikes).toHaveText([
      'Echelon EX-5s',
      'Echelon EX-3',
      'Echelon EX-8s',
      'Echelon Connect Sport',
      'Other FTMS smart bikes',
    ]);
    await expect(connect.worksWithStatuses).toHaveText([
      'Full control',
      'Full control',
      'Full control',
      'Full control',
      'Beta',
    ]);
    const [first, second] = await connect.worksWithRowTops();
    expect(second).toBeGreaterThan(first);

    await page.setViewportSize({ width: 1024, height: 768 });
    const [wideFirst, wideSecond] = await connect.worksWithRowTops();
    expect(wideSecond).toBe(wideFirst);
  });

  test('in a browser without Web Bluetooth, The Class opens with no bike for a rider who paired one before (L2-167 AC2, L2-010)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await bluetooth.remove();
    const start = new TheClassPage(page);

    await start.open();

    await expect(start.main).toBeVisible();
    expect(start.url()).toBe('/');
  });
});
