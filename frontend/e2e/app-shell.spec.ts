// Acceptance test
// Traces to: L2-146
// Description: the ride app built from the Telo Ride workspace serves the class at `/` inside the app shell, with
// its header, the skip link, and the design system's tokens and bundled fonts.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';

test.describe('App shell', () => {
  // A rider who paired a bike opens on the class (L2-015 AC1).
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test(
    'the class opens under its header, with the wordmark and no navigation but the bike status (L2-146 AC1, AC4)',
    { tag: '@critical' },
    async ({ page }) => {
      const start = new TheClassPage(page);
      await start.open();

      await expect(start.header.lockup).toHaveAccessibleName('Telo Ride 1');
      await expect(start.header.nav).toHaveCount(0);
      // The one link is the bike status, to Connect Bike (L2-019 AC3).
      await expect(start.header.links).toHaveCount(1);
      await expect(start.header.links).toHaveAttribute('href', '/connect');
      await expect(start.title).toBeVisible();
      await expect(start.main).toBeAttached();
    },
  );

  test('the first Tab reaches “Skip to content”, which moves focus to the page', async ({
    page,
  }) => {
    const start = new TheClassPage(page);
    await start.open();
    // The class's chunk loads after the shell; under load the first Tab can come before its main exists.
    await expect(start.main).toBeAttached();

    await page.keyboard.press('Tab');
    await expect(start.skipLink).toBeFocused();
    await expect(start.skipLink).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(start.main).toBeFocused();
  });

  test('the wordmark is set in the bundled Barlow Condensed, served by the app itself', async ({
    page,
  }) => {
    const fonts: string[] = [];
    page.on('requestfinished', (request) => {
      if (request.resourceType() === 'font') fonts.push(new URL(request.url()).pathname);
    });
    const start = new TheClassPage(page);
    await start.open();

    await expect.poll(() => start.header.wordmarkFontLoaded()).toBe(true);
    expect(fonts).toContain('/fonts/barlow-condensed-800-italic.woff2');
  });

  test('the design system’s tokens colour the page: ink behind it, signal on the wordmark’s product name', async ({
    page,
  }) => {
    const start = new TheClassPage(page);
    await start.open();

    expect(await start.background()).toBe('rgb(10, 11, 13)');
    // "Ride 1" reads --color-volt-fg, the signal as text: #ff5233 on dark, 4.5:1 on every surface (L2-143 AC2).
    expect(await start.header.productColour()).toBe('rgb(255, 82, 51)');
  });
});
