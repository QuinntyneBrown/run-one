// Acceptance test
// Traces to: L2-150 AC2; ADR 0032
// Description: an installed app keeps the version it last loaded; when a new version is deployed, the app offers to
// reload into it when it opens, and never reloads during a ride: the offer waits for the ride to end. Lets the service
// worker run, as the app cache's spec does (playwright.config.ts).
//
// Given the app is cached and a new version is deployed, when the rider opens the app, then a toast reads "A new version
//   is ready" and "Reload to use it now, or it opens next time.", and Reload loads the app again.
// Given a class ride in progress, when the service worker has the new version ready, then no toast shows and the page
//   is not reloaded; when the class ends, then Class Done opens with the toast.
// Given the toast, when the rider dismisses it, then it goes and the page is not reloaded.
import { appCached } from './fixtures/app-cache';
import { startClassRide } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { AppUpdate } from './pages/app-update';
import { TheClassPage } from './pages/the-class.page';
import { ClassDonePage } from './pages/class-done.page';

test.use({ serviceWorkers: 'allow' });

/** How long the worker may take to look for the new version once the app has opened: it waits for a quiet moment. */
const FOUND = { timeout: 45_000 };

test('a new version deployed is offered when the app opens, and Reload loads it (L2-150 AC2) @critical', async ({
  page,
  context,
}) => {
  const start = new TheClassPage(page);
  const update = new AppUpdate(page);
  await start.open();
  await expect(start.title).toBeVisible();
  await appCached(page);

  await update.deploy(context);
  await page.reload();

  await expect(update.toast).toBeVisible(FOUND);
  await expect(update.title).toHaveText('A new version is ready');
  await expect(update.text).toHaveText('Reload to use it now, or it opens next time.');
  await update.markPage();
  await Promise.all([page.waitForEvent('load'), update.reload.click()]);
  expect(await update.reloaded()).toBe(true);
  await expect(start.title).toBeVisible();
  await expect(update.toast).toBeHidden();
});

test('during a ride the new version waits, and is offered when the ride ends (L2-150 AC2)', async ({
  page,
  context,
  bluetooth,
  api,
}) => {
  const start = new TheClassPage(page);
  const update = new AppUpdate(page);
  await start.open();
  await expect(start.title).toBeVisible();
  await appCached(page);
  await startClassRide(page, bluetooth, api);
  await update.markPage();

  await update.deploy(context);
  await update.checkNow();
  await page.clock.runFor(1000);

  await expect(update.toast).toBeHidden();
  expect(await update.reloaded()).toBe(false);

  await page.clock.fastForward('19:58');
  await page.clock.runFor(2000);
  await new ClassDonePage(page).shown();
  await expect(page).toHaveURL(/\/done$/);
  await expect(update.toast).toBeVisible();
  expect(await update.reloaded()).toBe(false);
});

test('the rider can dismiss the offer, and the page stays (L2-150 AC2)', async ({
  page,
  context,
}) => {
  const start = new TheClassPage(page);
  const update = new AppUpdate(page);
  await start.open();
  await expect(start.title).toBeVisible();
  await appCached(page);
  // Opened again, so the worker serves the page and tells it of the next version.
  await page.reload();
  await expect(start.title).toBeVisible();
  await update.markPage();

  await update.deploy(context);
  await update.checkNow();

  await expect(update.toast).toBeVisible();
  await update.dismiss.click();
  await expect(update.toast).toBeHidden();
  expect(await update.reloaded()).toBe(false);
});
