// Acceptance test
// Traces to: L2-183 AC1 to AC8; L2-028 AC2; L2-089 AC2
// Description: the ride's intensity, a setting from 0 to 10 like a volume control (docs/mocks/pages/class-ride/
// intensity and ibiza-intensity, ADR 0050). Each notch is 10 % of the plan's level: the level sent is
// round(level × (1 + (intensity − 5) ÷ 10)), clamped to 1 to 32. The class opens on its warm-up at level 14, and its
// first effort, at 2:30, is level 19.
//
// Given a class ride, when Class Ride shows, then the box holds "Intensity", "5/10", Raise intensity, a slider from 0
// to 10 and Lower intensity, and the ride starts at 5/10.
// Given the rider raises the intensity to 7/10, when it changes, then the warm-up's 14 is sent as 17 at once, a screen
// reader hears "Intensity 7 of 10", and the effort at 2:30 is sent as 23.
// Given the slider, when the rider moves it with the keyboard to 0/10, then the warm-up is sent as 7 and Lower is off.
// Given the rider nudged the resistance, when the intensity changes, then the segment's level at the new intensity
// replaces the nudge.
// Given a lost bike, when the control shows, then it is off; while the ride is paused it stays on.
// Given a phone, when the box is short, then +, the setting and − show without the slider.
// Given a ride in Ibiza, when Class Ride shows, then the control is in the course's box.
import { startClassRide, loseBike, startRideInIbiza } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { targetResistanceWrite, targetResistanceWrites } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';

test.describe('Intensity', () => {
  test('shows 5/10 on the box with + over a slider over −, each at least 44 px (L2-183 AC1, AC2)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);

    await expect(ride.box.getByText('Intensity', { exact: true })).toBeVisible();
    await expect(ride.intensityValue).toHaveText('5/10');
    await expect(ride.intensitySlider).toHaveValue('5');
    await expect(ride.intensitySlider).toHaveAttribute('min', '0');
    await expect(ride.intensitySlider).toHaveAttribute('max', '10');
    await expect(ride.intensitySlider).toHaveAttribute('aria-valuetext', '5 of 10');
    for (const button of [ride.raiseIntensity, ride.lowerIntensity]) {
      await expect(button).toBeEnabled();
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    // + stands above the slider, the slider above −, all on the box's left edge.
    const [plus, slider, minus, box] = await Promise.all([
      ride.drawn(ride.raiseIntensity),
      ride.drawn(ride.intensitySlider),
      ride.drawn(ride.lowerIntensity),
      ride.drawn(ride.box),
    ]);
    expect(plus.y).toBeLessThan(slider.y);
    expect(slider.y + slider.height).toBeLessThanOrEqual(minus.y + 1);
    expect(slider.height).toBeGreaterThan(slider.width);
    expect(plus.x - box.x).toBeLessThan(box.width / 4);
  });

  test(
    'raised to 7/10, the warm-up is sent at 17 at once and the first effort at 23 (L2-183 AC3, AC4, AC7)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      const ride = await startClassRide(page, bluetooth, api);
      const announcement = new AppDocument(page).announcement;

      // The paused clock holds the app's rendering until it is stepped (L93).
      await ride.raiseIntensity.click();
      await page.clock.runFor(50);
      await ride.raiseIntensity.click();
      await page.clock.runFor(100);

      await expect(ride.intensityValue).toHaveText('7/10');
      await expect(ride.intensitySlider).toHaveAttribute('aria-valuetext', '7 of 10');
      await expect(announcement).toHaveText('Intensity 7 of 10');
      await expect
        .poll(() => targetResistanceWrites(bluetooth.writes()).at(-1))
        .toBe(targetResistanceWrite(17));

      await page.clock.runFor('02:30');
      await page.clock.runFor(100);
      await expect(ride.segmentKind).toHaveText('Work');
      await expect
        .poll(() => targetResistanceWrites(bluetooth.writes()).at(-1))
        .toBe(targetResistanceWrite(23));
    },
  );

  test('moved to 0/10 with the keyboard, the warm-up is sent at 7 and Lower is off (L2-183 AC3, AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);

    await ride.intensitySlider.focus();
    await page.keyboard.press('Home');
    await page.clock.runFor(100);

    await expect(ride.intensityValue).toHaveText('0/10');
    await expect(ride.lowerIntensity).toBeDisabled();
    await expect(ride.raiseIntensity).toBeEnabled();
    await expect
      .poll(() => targetResistanceWrites(bluetooth.writes()).at(-1))
      .toBe(targetResistanceWrite(7));
  });

  test('a change replaces a nudge with the segment at the new intensity (L2-183 AC5, L2-028 AC2)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);

    await ride.raise.click();
    await page.clock.runFor(100);
    await expect
      .poll(() => targetResistanceWrites(bluetooth.writes()).at(-1))
      .toBe(targetResistanceWrite(15));

    await ride.lowerIntensity.click();
    await page.clock.runFor(100);

    // 14 × 0.9 = 12.6, sent as 13.
    await expect
      .poll(() => targetResistanceWrites(bluetooth.writes()).at(-1))
      .toBe(targetResistanceWrite(13));
  });

  test('is off while the bike is lost and on while the ride is paused (L2-183 AC6)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);

    await ride.pause.click();
    await page.clock.runFor(100);
    await expect(ride.resume).toBeVisible();
    await expect(ride.raiseIntensity).toBeEnabled();
    await expect(ride.intensitySlider).toBeEnabled();
    await ride.resume.click();
    await page.clock.runFor(100);

    await loseBike(bluetooth);
    await page.clock.runFor(1000);
    await expect(ride.lost).toBeVisible();
    await expect(ride.raiseIntensity).toBeDisabled();
    await expect(ride.lowerIntensity).toBeDisabled();
    await expect(ride.intensitySlider).toBeDisabled();
  });

  test('on a phone the box shows −, the setting and + without the slider (L2-183 AC8)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const ride = await startClassRide(page, bluetooth, api);

    await expect(ride.intensityValue).toHaveText('5/10');
    await expect(ride.raiseIntensity).toBeVisible();
    await expect(ride.lowerIntensity).toBeVisible();
    await expect(ride.intensitySlider).toBeHidden();

    await ride.raiseIntensity.click();
    await page.clock.runFor(100);
    await expect(ride.intensityValue).toHaveText('6/10');
  });
});

test.describe('Intensity in Ibiza', () => {
  let files: CourseFiles;

  test.beforeEach(async ({ page }) => {
    files = await CourseFiles.install(page);
    files.hold();
  });

  test.afterEach(async () => {
    await files.dispose();
  });

  test('stands in the course box (L2-183 AC1)', async ({ page, bluetooth }) => {
    const ride = await startRideInIbiza(page, bluetooth);

    await expect(ride.box.locator('.class-intensity')).toBeVisible();
    await expect(ride.intensityValue).toHaveText('5/10');
  });
});
