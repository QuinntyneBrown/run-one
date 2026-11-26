// Acceptance test
// Traces to: L2-180 AC1 to AC10; L2-027 AC1; L2-093 AC1; L2-092; L2-133
// Description: Class Ride opens on a countdown ("3", "2", "1", "Go!") over the video's box, with the bike already set,
// no Pause, and the ride clock held at 0:00 until "Go!". Playwright's clock is paused, so the spec counts the seconds
// out by hand; startClassRide with `countdown: 'hold'` leaves the ride where it opened. The countdown in Ibiza is in
// class-ride-ibiza-countdown.spec.ts.
import { COUNTDOWN_MS, startClassRide } from './fixtures/class-ride';
import { targetResistanceWrite } from './fixtures/echelon';
import { bikeAnswers, loseBike } from './fixtures/class-ride';
import { hideTab, showTab } from './fixtures/tab';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { TheClassPage } from './pages/the-class.page';

test.describe('Countdown', () => {
  test(
    'Class Ride opens on 3, 2, 1 and Go! with the bike set and the clock held at 0:00 until Go! (L2-180 AC1 to AC3, AC6)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      const ride = await startClassRide(page, bluetooth, api, { countdown: 'hold' });

      // AC1, AC3: the countdown lies over the box, the plan's first segment is shown and its level already sent.
      await expect(ride.countdown).toBeVisible();
      expect(await ride.coversBox(ride.countdown)).toBe(true);
      await expect(ride.countdownNumeral).toHaveText('3');
      await expect(ride.countdownLights).toHaveCount(0);
      await expect(ride.countdownLine).toHaveText('The plan sets your resistance. Just pedal.');
      await expect(ride.clock).toHaveText('0:00 / 20:00');
      await expect(ride.segmentKind).toHaveText('Warm-up');
      await expect(ride.segmentLeft).toHaveText('2:30');
      expect(bluetooth.writes().map((write) => write.hex)).toContain(targetResistanceWrite(14));
      // Nothing is on or off target yet, so no line stands under Power.
      await expect(ride.powerHint).toHaveCount(0);
      await expect(ride.cadenceHint).toHaveText('Aim 80');
      await expect(ride.raise).toBeEnabled();
      // AC6: there is no Pause; Leave and Full screen work.
      await expect(ride.pause).toHaveCount(0);
      await expect(ride.resume).toHaveCount(0);
      await expect(ride.leave).toBeVisible();

      // AC2: a second each, a light lit as each second passes.
      await page.clock.runFor(1000);
      await expect(ride.countdownNumeral).toHaveText('2');
      await expect(ride.countdownLights).toHaveCount(1);
      await page.clock.runFor(1000);
      await expect(ride.countdownNumeral).toHaveText('1');
      await expect(ride.countdownLights).toHaveCount(2);
      await expect(ride.clock).toHaveText('0:00 / 20:00');
      await page.clock.runFor(1000);
      await expect(ride.countdownNumeral).toHaveText('Go!');
      await expect(ride.countdownLights).toHaveCount(3);
      await expect(ride.countdown).toHaveClass(/class-countdown--go/);
      // The clock starts as "Go!" shows, then the countdown goes.
      await expect(ride.clock).toHaveText('0:00 / 20:00');
      await expect(ride.pause).toBeVisible();
      await page.clock.runFor(700);
      await expect(ride.countdown).toHaveCount(0);
      await page.clock.runFor(2000);
      await expect(ride.clock).toHaveText('0:02 / 20:00');
    },
  );

  test('a screen reader hears "The class starts in 3 seconds" once and "Go" once, never each numeral, and the lights are hidden (L2-180 AC8, AC10)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api, { countdown: 'hold' });
    await expect(ride.countdownStatus).toHaveText('The class starts in 3 seconds');
    await page.clock.runFor(1000);
    await expect(ride.countdownNumeral).toHaveText('2');
    await expect(ride.countdownStatus).toHaveText('The class starts in 3 seconds');
    await page.clock.runFor(2000);
    await expect(ride.countdownNumeral).toHaveText('Go!');
    await expect(ride.countdownStatus).toHaveText('Go');
    // The numeral and the lights are drawn, not read; the numeral's words are in the status.
    await expect(ride.countdownNumeral).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.class-countdown__lights')).toHaveAttribute('aria-hidden', 'true');
  });

  test('Leave opens The Class with no ride started and the record unchanged (L2-180 AC6, L2-093 AC1)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api, { countdown: 'hold' });
    await ride.leave.click();
    await page.clock.runFor(100);
    await expect(page).toHaveURL('/');
    const start = new TheClassPage(page);
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(start.title).toHaveText(theClass.title, { timeout: 50 });
    }).toPass();
    expect(await page.evaluate(() => localStorage.getItem('telo-ride.record'))).toBeNull();
  });

  test('a bike lost during the countdown stops it under "Lost the bike", and it starts again from 3 when the bike is back (L2-180 AC7)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api, { countdown: 'hold' });
    await page.clock.runFor(1500);
    await expect(ride.countdownNumeral).toHaveText('2');

    const afterDrop = await loseBike(bluetooth);
    await page.clock.runFor(1500);
    await expect(ride.lost).toBeVisible();
    await expect(ride.lostBody).toHaveText(
      'The class has not started. Pedal to wake the bike, then reconnect.',
    );
    await expect(ride.countdown).toHaveCount(0);
    // No ride has started, so the clock holds at 0:00 and there is nothing to pause or resume.
    await page.clock.runFor(5000);
    await expect(ride.clock).toHaveText('0:00 / 20:00');
    await expect(ride.pause).toHaveCount(0);
    await expect(ride.resume).toHaveCount(0);
    await expect(ride.leave).toBeVisible();

    await bluetooth.switchOn();
    await ride.reconnect.click();
    await bikeAnswers(page, bluetooth, afterDrop);
    await expect(async () => {
      await page.clock.runFor(100);
      await expect(ride.countdown).toBeVisible({ timeout: 50 });
    }).toPass();
    await expect(ride.lost).toHaveCount(0);
    await expect(ride.countdownNumeral).toHaveText('3');
    await expect(ride.countdownLights).toHaveCount(0);
  });

  test('the countdown is counted by the clock, so a hidden tab does not stretch it (L2-180 AC5, L2-133)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api, { countdown: 'hold' });
    await hideTab(page, { throttled: true });
    await page.clock.runFor(COUNTDOWN_MS + 2000);
    await showTab(page);
    // Five seconds passed, two of them since "Go!": the ride is on and its clock shows them.
    await page.clock.runFor(100);
    await expect(ride.countdown).toHaveCount(0);
    await expect(ride.clock).toHaveText('0:02 / 20:00');
  });

  test('the class video is parked at 0:03 through the countdown and plays from it on Go! (L2-180 AC4)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    await startClassRide(page, bluetooth, api, { countdown: 'hold' });
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(2000);
    expect((await youtube.players())[0].playing).toBe(false);
    expect(await youtube.time()).toBeCloseTo(3, 0);

    await page.clock.runFor(1200);
    await expect.poll(async () => (await youtube.players())[0].playing).toBe(true);
    expect(await youtube.time()).toBeCloseTo(3.2, 0);
  });

  test('with reduced motion the numeral changes without growing or sliding (L2-180 AC9)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const animation = (name: string) =>
      expect
        .poll(() =>
          page.locator('.class-countdown__num').evaluate((e) => getComputedStyle(e).animationName),
        )
        .toMatch(name);
    let ride = await startClassRide(page, bluetooth, api, { countdown: 'hold' });
    await animation('ride-countdown-step');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await animation('ride-countdown-fade');
    expect(ride.url()).toBe('/ride');
  });
});
