// Acceptance test
// Traces to: L2-136 AC1
// Description: the production build keeps the 3D renderer out of the first load. The class opens without a byte of
// Three.js, a ride with the class video never fetches it, and it arrives only when a ride in Ibiza starts. The initial
// bundle's gzipped size is checked by `npm run bundle:size` after the build, in verify and CI.
import { echelonBike } from './fixtures/echelon';
import { skipFlyover, startClassRide } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { ScriptLog } from './fixtures/scripts';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';

test(
  'the class opens without the 3D renderer’s code (L2-136 AC1)',
  { tag: '@critical' },
  async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    const scripts = new ScriptLog(page);
    const start = new TheClassPage(page);
    await start.open();
    await expect(start.main).toBeAttached();
    await page.waitForLoadState('networkidle');

    expect(await scripts.hasWorldCode()).toBe(false);
  },
);

test('the 3D renderer’s code arrives when a ride in Ibiza starts, and never with the class video (L2-136 AC1, L2-175 AC1)', async ({
  page,
  bluetooth,
  api,
}) => {
  const scripts = new ScriptLog(page);
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.runFor(3_000);
  await expect(ride.clock).toHaveText(/^0:03/);
  expect(await scripts.hasWorldCode()).toBe(false);
  await ride.leave.click();
  await page.clock.runFor(100);
  await page.clock.resume();

  // The spec is about what is fetched and not the drawing: the course's files are held.
  const files = await CourseFiles.install(page);
  files.hold();
  const home = new TheClassPage(page);
  await home.ibiza.click();
  await home.start.click();
  await skipFlyover(page);

  await expect(ride.courseLoading).toBeVisible();
  await expect.poll(() => scripts.hasWorldCode()).toBe(true);
  await files.dispose();
});

test('the video player’s code arrives with The Class, and never on a screen with no video (L2-136 AC1)', async ({
  page,
  bluetooth,
}) => {
  const scripts = new ScriptLog(page);
  await page.goto('/connect');
  await expect(page.locator('main')).toBeAttached();
  await page.waitForLoadState('networkidle');
  expect(await scripts.hasVideoPlayerCode()).toBe(false);

  await page.goto('/no-such-address');
  await page.waitForLoadState('networkidle');
  expect(await scripts.hasVideoPlayerCode()).toBe(false);

  await bluetooth.remember(echelonBike);
  const home = new TheClassPage(page);
  await home.open();
  await expect(home.main).toBeAttached();
  await expect.poll(() => scripts.hasVideoPlayerCode()).toBe(true);
});
