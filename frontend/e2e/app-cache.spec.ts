// Acceptance test
// Traces to: L2-135 AC3; ADR 0032
// Description: once the app has been opened, its service worker keeps the app on the device: with no network it opens
// again and a solo class starts: the class ships with the app (ADR 0037), so it is among the files the worker keeps.
// The only spec that lets a service worker run (playwright.config.ts).
import { appCached } from './fixtures/app-cache';
import { startClassRide } from './fixtures/class-ride';
import { theClass } from './fixtures/the-class';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';

test.use({ serviceWorkers: 'allow' });

test.beforeEach(async ({ bluetooth }) => {
  await bluetooth.remember(echelonBike);
});

test('once opened, the app opens again and a solo class starts with no network (L2-135 AC3) @critical', async ({
  page,
  context,
  bluetooth,
  api,
}) => {
  const start = new TheClassPage(page);
  await start.open();
  await expect(start.title).toHaveText('Intervals to the Beat');
  await appCached(page);
  await page.reload();
  await expect(start.title).toHaveText('Intervals to the Beat');

  await context.setOffline(true);
  api.offline();
  const ride = await startClassRide(page, bluetooth, api);

  await page.clock.runFor(30_000);
  await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
  await expect(ride.clock).toHaveText('0:30 / 20:00');
});

test('with the service worker in control, the worker fetches the player for the page and the video still loads (ADR 0043)', async ({
  page,
  bluetooth,
  api,
  youtube,
}) => {
  const start = new TheClassPage(page);
  await start.open();
  await appCached(page);
  await page.reload();
  await expect(start.title).toHaveText('Intervals to the Beat');

  await startClassRide(page, bluetooth, api);

  await expect
    .poll(async () => (await youtube.players()).map((player) => player.videoId))
    .toEqual([theClass.video.videoId]);
});
