// Acceptance test
// Traces to: L2-179 AC7 to AC10
// Description: when the flyover falls short. A bike lost while the camera lands holds the landing with an alert and
// Try again; a course that cannot be drawn gives way to Class Ride's countdown with no landing; a device that asks for
// reduced motion has no flyover; and Cancel lets the course go.
//
// Given the flyover, when the bike stops answering, then the band says so with Try again and Class Ride does not open;
// when the bike answers again, then the camera's landing completes and Class Ride opens.
// Given a course that cannot be drawn, then Class Ride opens on its countdown with no flyover held.
// Given reduced motion, then a ride in Ibiza opens straight on Class Ride's countdown.
// Given the course drawn, when the rider cancels, then the renderer reports itself released.
import { RIDE_START, bikeAnswers, loseBike, openTheClassForIbiza } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { IbizaFlyoverPage } from './pages/ibiza-flyover.page';

test.describe('Ibiza Flyover falls short', () => {
  test('a lost bike holds the landing with Try again, and Class Ride opens once the bike answers (L2-179 AC7)', async ({
    page,
    bluetooth,
  }) => {
    test.setTimeout(120_000);
    const files = await CourseFiles.install(page);
    files.hold();
    await page.clock.install({ time: RIDE_START });
    const home = await openTheClassForIbiza(page, bluetooth);
    await page.clock.pauseAt(RIDE_START + 60_000);
    await home.start.click();
    const flyover = new IbizaFlyoverPage(page);
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(flyover.root).toBeVisible({ timeout: 50 });
    }).toPass({ intervals: [0] });

    const since = await loseBike(bluetooth);
    await flyover.skip.click();
    await page.clock.runFor(2000);
    await expect(flyover.lost).toContainText('No answer from the');
    await expect(flyover.retry).toBeVisible();
    await expect(new ClassRidePage(page).clock).toHaveCount(0);

    await bluetooth.switchOn();
    await flyover.retry.click();
    await bikeAnswers(page, bluetooth, since);
    await expect(async () => {
      await page.clock.runFor(100);
      await expect(new ClassRidePage(page).clock).toBeVisible({ timeout: 50 });
    }).toPass({ intervals: [0], timeout: 30_000 });
    await files.dispose();
  });

  test('a course that cannot be drawn gives way to the countdown with no landing (L2-179 AC8)', async ({
    page,
    bluetooth,
  }) => {
    test.setTimeout(120_000);
    const files = await CourseFiles.install(page);
    files.refuse('/courses/ibiza.glb');
    const home = await openTheClassForIbiza(page, bluetooth);
    await home.start.click();
    const ride = new ClassRidePage(page);
    await expect(ride.clock).toBeVisible({ timeout: 30_000 });
    await expect(new IbizaFlyoverPage(page).root).toHaveCount(0);
    await files.dispose();
  });

  test('with reduced motion a ride in Ibiza opens straight on the countdown (L2-179 AC9)', async ({
    page,
    bluetooth,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const home = await openTheClassForIbiza(page, bluetooth);
    await home.start.click();
    await expect(new ClassRidePage(page).clock).toBeVisible();
    await expect(new IbizaFlyoverPage(page).root).toHaveCount(0);
  });

  test('Cancel opens The Class and lets the course go (L2-179 AC5, AC10)', async ({
    page,
    bluetooth,
    course,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await course.pin('low');
    await page.clock.install({ time: RIDE_START });
    const home = await openTheClassForIbiza(page, bluetooth);
    await page.clock.pauseAt(RIDE_START + 60_000);
    await home.start.click();
    const flyover = new IbizaFlyoverPage(page);
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(flyover.caption).toContainText('The waterfront', { timeout: 50 });
    }).toPass({ intervals: [0], timeout: 60_000 });
    expect((await course.drawn())!.released).toBe(false);

    await flyover.cancel.click();
    await expect(async () => {
      await page.clock.runFor(100);
      expect(new URL(page.url()).pathname).toBe('/');
    }).toPass({ intervals: [0] });
    await page.clock.runFor(2000);
    expect((await course.drawn())!.released).toBe(true);
  });
});
