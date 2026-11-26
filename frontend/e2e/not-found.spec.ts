// Acceptance test
// Traces to: L2-145, L2-146
// Description: the Telo Ride workspace serves the app shell; an unknown address shows Page not found under the slim
// header, with the wordmark and Full screen, and leads back to the class.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';
import { NotFoundPage } from './pages/not-found.page';

test.describe('Page not found', () => {
  test('an address that matches no screen says so, under the wordmark and Full screen (L2-145 AC1)', async ({
    page,
  }) => {
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');

    await expect(notFound.header.lockup).toHaveAccessibleName('Telo Ride 1');
    await expect(notFound.header.fullScreen).toBeVisible();
    await expect(notFound.header.nav).toHaveCount(0);
    await expect(notFound.header.links).toHaveCount(0);
    await expect(notFound.heading).toHaveText('This page doesn’t exist.');
    await expect(notFound.lead).toHaveText(
      'The link may be old, or the address has a typo. Your rides are safe.',
    );
    await expect(notFound.backToClass).toBeVisible();
  });

  test('“Back to the class” opens the class at `/` (L2-145 AC2)', async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');
    await notFound.backToClass.click();

    const start = new TheClassPage(page);
    await expect.poll(() => start.url()).toBe('/');
    await expect(start.title).toBeVisible();
  });

  test('“Back to the class” with no bike remembered opens Connect Bike, as the app does (L2-145 AC2, L2-167)', async ({
    page,
  }) => {
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');
    await notFound.backToClass.click();

    await expect.poll(() => new TheClassPage(page).url()).toBe('/connect');
  });

  for (const address of [
    '/race',
    '/race/ibiza-sunset-strip',
    '/race/ibiza-sunset-strip/lobby',
    '/race/ibiza-sunset-strip/ride',
  ]) {
    test(`Telo Ride 1 has no races: ${address} is no screen (L1, left out)`, async ({ page }) => {
      const notFound = new NotFoundPage(page);
      await notFound.open(address);

      await expect(notFound.heading).toHaveText('This page doesn’t exist.');
    });
  }
});
