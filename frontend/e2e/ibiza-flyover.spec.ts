// Acceptance test
// Traces to: L2-179 AC1 to AC6; L2-175 AC1
// Description: a ride in Ibiza opens on Ibiza Flyover at /ride: the course edge to edge between a bar and a band, the
// wordmark, Skip flyover, Cancel, the course's name as the h1 and the bike's name with "connected". While the course
// loads it reads "Loading Ibiza Sunset Strip"; once drawn the camera flies it, and Skip flyover lands the camera on
// the grid, where Class Ride opens on its countdown. The course's files are fetched once for both. Cancel leaves for
// The Class with no ride started.
//
// Given a ride in Ibiza, when the rider starts it, then Ibiza Flyover opens with its bar, its band and the bike.
// Given the course is held, then the flyover reads "Loading Ibiza Sunset Strip" and no caption.
// Given the course is drawn, then the flight shows a caption, and Skip flyover lands on "The start".
// Given the camera has landed, then Class Ride opens on its countdown and the course's files were fetched once.
// Given the flyover, when the rider cancels, then The Class opens and no ride was started.
import { RIDE_START, openTheClassForIbiza } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { ClassRidePage } from './pages/class-ride.page';
import { IbizaFlyoverPage } from './pages/ibiza-flyover.page';
import { TheClassPage } from './pages/the-class.page';

test.describe('Ibiza Flyover', () => {
  test(
    'opens before a ride in Ibiza with its bar and band, flies the course, and lands on the grid, where Class Ride counts down (L2-179 AC1 to AC4)',
    { tag: '@critical' },
    async ({ page, bluetooth, course }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 844, height: 390 });
      await course.pin('low');
      const files = await CourseFiles.install(page);
      // On Playwright's paused clock, as the other specs that draw the course: the spec steps it a frame at a time.
      await page.clock.install({ time: RIDE_START });
      const home = await openTheClassForIbiza(page, bluetooth);
      await page.clock.pauseAt(RIDE_START + 60_000);
      await home.start.click();
      const flyover = new IbizaFlyoverPage(page);

      await expect(async () => {
        await page.clock.runFor(16);
        await expect(flyover.root).toBeVisible({ timeout: 50 });
      }).toPass({ intervals: [0] });
      expect(flyover.url()).toBe('/ride');
      await expect(flyover.heading).toHaveText('Ibiza Sunset Strip');
      await expect(flyover.skip).toBeVisible();
      await expect(flyover.cancel).toBeVisible();
      await expect(flyover.status).toHaveText('Echelon EX-5s connected');
      // The bike has its first target already; the class has not started.
      await expect
        .poll(() => bluetooth.writes().map((write) => write.hex))
        .toContain(targetResistanceWrite(theClass.segments[0].level));
      await expect(new ClassRidePage(page).clock).toHaveCount(0);

      // The course is drawn from above: its first frame is a flight frame, and the camera has a caption.
      await expect(async () => {
        await page.clock.runFor(16);
        await expect(flyover.caption).toContainText('The waterfront', { timeout: 50 });
      }).toPass({ intervals: [0], timeout: 60_000 });
      await expect(flyover.loading).toHaveCount(0);

      await flyover.skip.click();
      await page.clock.runFor(16);
      await expect(flyover.place).toHaveText('The start');
      await expect(flyover.caption).toContainText('your grid for Intervals to the Beat');
      await expect(flyover.status).toHaveText('Bike ready · lining up');
      await expect(flyover.skip).toHaveCount(0);

      const ride = new ClassRidePage(page);
      await expect(async () => {
        await page.clock.runFor(100);
        await expect(ride.countdown).toBeVisible({ timeout: 50 });
      }).toPass({ intervals: [0], timeout: 15_000 });
      await expect(ride.clock).toHaveText('0:00 / 20:00');
      // One download of the course for both screens.
      expect(files.paths().filter((path) => path.endsWith('ibiza.glb'))).toHaveLength(1);
      await files.dispose();
    },
  );

  test('while the course loads it reads "Loading Ibiza Sunset Strip" with no caption, and Cancel opens The Class with no ride started (L2-179 AC5, AC6)', async ({
    page,
    bluetooth,
  }) => {
    const files = await CourseFiles.install(page);
    files.hold();
    const home = await openTheClassForIbiza(page, bluetooth);
    await home.start.click();
    const flyover = new IbizaFlyoverPage(page);

    await expect(flyover.loading).toHaveText('Loading Ibiza Sunset Strip');
    await expect(flyover.caption).toHaveCount(0);

    await flyover.cancel.click();
    await expect(page).toHaveURL('/');
    await expect(new TheClassPage(page).start).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('telo-ride.record'))).toBeNull();
    await files.dispose();
  });
});
