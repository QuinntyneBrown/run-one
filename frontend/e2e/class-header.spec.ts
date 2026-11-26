// Acceptance test
// Traces to: L2-144 AC1, AC2; L2-167 AC4
// Description: the header of the class at `/` offers Full screen, which enters full screen and then reads "Exit full
// screen" and leaves it; where the browser has no Fullscreen API the button is absent. On a phone the header is one
// row, the wordmark and Full screen, with no navigation under it. The header has no streak, level or XP (ADR 0039)
// and no menu (ADR 0040).
import { echelonBike } from './fixtures/echelon';
import { withoutFullscreen } from './fixtures/fullscreen';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

test('Full screen enters full screen, and Exit full screen leaves it (L2-144 AC1) @critical', async ({
  page,
}) => {
  const start = new TheClassPage(page);
  await start.open();

  await start.header.fullScreen.click();
  await expect.poll(() => start.header.inFullScreen()).toBe(true);
  await expect(start.header.exitFullScreen).toBeVisible();
  await expect(start.header.fullScreen).toHaveCount(0);

  await start.header.exitFullScreen.click();
  await expect.poll(() => start.header.inFullScreen()).toBe(false);
  await expect(start.header.fullScreen).toBeVisible();
});

test('where the browser has no Fullscreen API, the button is absent (L2-144 AC2)', async ({
  page,
}) => {
  await withoutFullscreen(page);
  const start = new TheClassPage(page);
  await start.open();

  await expect(start.header.bike).toBeVisible();
  await expect(start.header.fullScreen).toHaveCount(0);
});

test('on a phone the header is one row with no navigation but the bike status (L2-167 AC4, L2-019 AC4)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const start = new TheClassPage(page);
  await start.open();

  await expect(start.title).toBeVisible();
  await expect(start.header.nav).toHaveCount(0);
  await expect(start.header.links).toHaveCount(1);
  await expect(start.header.bike).toBeVisible();
  const header = await start.header.root.boundingBox();
  const lockup = await start.header.lockup.boundingBox();
  const fullScreen = await start.header.fullScreen.boundingBox();
  // One row: the wordmark at the start and Full screen at the end, on the same line.
  expect(header!.height).toBeLessThan(72);
  expect(fullScreen!.x).toBeGreaterThan(lockup!.x + lockup!.width);
  expect(fullScreen!.x + fullScreen!.width).toBeLessThanOrEqual(390);
});
