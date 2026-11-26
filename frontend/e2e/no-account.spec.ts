// Acceptance test
// Traces to: L2-132 AC1, AC3; L1 (left out: sign-in, progression, the custom workout, feedback); ADR 0039
// Description: Telo Ride 1 has no account. A new browser opens the app with no sign-in screen and no cookie; `/sign-in`
// and `/profile/custom` are no screens; the header has no streak, level or XP; and a finished class sends no request and shows no XP on Class Done. The app asks no
// backend for anything: the class ships with it (ADR 0037).
import { startClassRide } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { NotFoundPage } from './pages/not-found.page';
import { ClassDonePage } from './pages/class-done.page';

test.describe('No account', () => {
  test('a new browser reaches the app with no sign-in, no cookie and no request for a rider (L2-132 AC1) @critical', async ({
    page,
    api,
  }) => {
    await new TheClassPage(page).open();

    await expect(page).toHaveURL('/connect');
    await expect(new ConnectBikePage(page).title).toBeVisible();
    expect(api.requests()).toEqual([]);
    expect(await page.context().cookies()).toEqual([]);
  });

  for (const address of ['/sign-in', '/sign-in/code', '/sign-in/name', '/profile/custom']) {
    test(`${address} is no screen (ADR 0039)`, async ({ page }) => {
      const notFound = new NotFoundPage(page);
      await notFound.open(address);

      await expect(notFound.heading).toHaveText('This page doesn’t exist.');
    });
  }

  test('the header has no streak, level or XP, and the class asks nothing about a rider (ADR 0039)', async ({
    page,
    api,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const start = new TheClassPage(page);
    await start.open();

    await expect(start.title).toHaveText('Intervals to the Beat');
    await expect(start.header.bike).toBeVisible();
    await expect(start.header.streak).toHaveCount(0);
    await expect(start.header.level).toHaveCount(0);
    expect(api.requests()).toEqual([]);
  });

  test('a finished class sends no request, and Class Done shows no XP (L2-132 AC3) @critical', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);

    await page.clock.fastForward('19:58');
    await page.clock.runFor(2000);

    const done = new ClassDonePage(page);
    await done.shown();
    await expect(page).toHaveURL('/done');
    await expect(done.time).toHaveText('20:00');
    await expect(page.locator('.xp-earned')).toHaveCount(0);
    await expect(done.done).toBeVisible();
    expect(api.requests()).toEqual([]);
    expect(await page.context().cookies()).toEqual([]);
    expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  });
});
