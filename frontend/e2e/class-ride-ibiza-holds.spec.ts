// Acceptance test
// Traces to: L2-091 AC1, AC2; L2-092 AC1, AC2, AC3; L2-174 AC4, AC5
// Description: a ride in Ibiza paused, and held for a lost bike, as with the class video
// (docs/mocks/pages/class-ride/paused-ibiza and disconnected-ibiza). The course is drawn in software here, so it is
// ridden once, in the smallest landscape window (844 × 390), at its lowest step, and never resized. The ride starts
// on the running clock, which is then paused and moved on by hand; nothing sleeps. The rider's place on the road is
// read through the renderer's test-only report (fixtures/course-probe.ts).
//
// Given a running ride in Ibiza, when the rider presses Pause, then the clock stops and the course holds under the
// same "Paused" overlay, over the whole box, the rider at the same metre however long it waits; Resume carries the
// clock on, and the rider from that metre.
// Given a ride in Ibiza, when the bike stops answering, then the alert reads "The ride is paused. Pedal to wake the
// bike, then reconnect.", the clock holds, the rider holds their metre, and Resume and the resistance controls are
// disabled; when the bike is back, then the ride carries on from that metre.
import { bikeAnswers, loseBike, rideInIbiza } from './fixtures/class-ride';
import type { CourseProbe } from './fixtures/course-probe';
import { expect, test } from './fixtures/test';
import { planMetres } from './fixtures/the-class';
import type { ClassRidePage } from './pages/class-ride.page';

/**
 * The latest frame's rider is where the clock puts them (L2-174 AC2): between the plan's metres at the clock's second
 * and at the next. Resolves to the rider's metres.
 */
async function placedByTheClock(ride: ClassRidePage, course: CourseProbe): Promise<number> {
  const second = await ride.clockSeconds();
  const { metres } = (await course.drawn())!;
  expect(metres, `at ${second} s of the clock`).toBeGreaterThanOrEqual(planMetres(second) - 0.5);
  expect(metres, `at ${second} s of the clock`).toBeLessThanOrEqual(planMetres(second + 1) + 0.5);
  return metres;
}

test.describe('Pause and lose the bike in Ibiza', () => {
  test('Pause holds the clock and the rider under "Paused" over the course, a lost bike says the ride is paused and holds them too, and each time the ride carries on from the same metre (L2-091 AC1, AC2, L2-092 AC1, AC2, AC3, L2-174 AC5)', async ({
    page,
    bluetooth,
    course,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await course.pin('low');
    await page.clock.install();
    const ride = await rideInIbiza(page, bluetooth);
    // From here the clock is the spec's: it stands still unless the spec moves it on. The course's first frames are
    // drawn in software and can hold the page for more than a second, so the clock is paused well ahead of now.
    await page.clock.pauseAt((await ride.now()) + 10_000);
    await page.clock.runFor(1000);

    await ride.pause.click();
    await page.clock.runFor(1000);
    await expect(ride.coursePaused).toHaveText('Paused');
    // The one overlay covers the whole box, and the course is still drawn under it.
    expect(await ride.coversBox(ride.coursePaused)).toBe(true);
    await expect(ride.course).toBeVisible();
    await expect(ride.paused).toHaveCount(0);
    await expect(ride.resume).toBeEnabled();
    await expect(ride.raise).toBeEnabled();
    const held = await ride.clock.textContent();
    // The rider holds their place on the road, where the clock stopped (L2-174 AC5).
    const heldAt = await placedByTheClock(ride, course);
    const heldFrames = (await course.drawn())!.frames;
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveText(held!);
    expect((await course.drawn())!.metres).toBe(heldAt);
    // The course holds still: the frame loop is stopped, where ten seconds of it would be six hundred frames. (A
    // readout that goes blank redraws the same picture once.)
    expect((await course.drawn())!.frames).toBeLessThan(heldFrames + 5);

    await ride.resume.click();
    await page.clock.runFor(3000);
    await expect(ride.coursePaused).toHaveCount(0);
    await expect(ride.clock).not.toHaveText(held!);
    // Resume carries on from that place: the ten seconds waited are not ridden.
    const resumed = await placedByTheClock(ride, course);
    expect(resumed).toBeGreaterThan(heldAt);
    expect(resumed).toBeLessThan(heldAt + 40);

    const afterDrop = await loseBike(bluetooth);
    await page.clock.runFor(1000);
    await expect(ride.lost).toHaveText(
      'Lost the bike The ride is paused. Pedal to wake the bike, then reconnect. Reconnect',
      { useInnerText: true },
    );
    const waiting = await ride.clock.textContent();
    const waitingAt = await placedByTheClock(ride, course);
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveText(waiting!);
    expect((await course.drawn())!.metres).toBe(waitingAt);
    await expect(ride.resume).toBeDisabled();
    await expect(ride.raise).toBeDisabled();
    await expect(ride.leave).toBeVisible();

    // The bike is back: the ride carries on from the metre it waited at (L2-092 AC3, L2-174 AC5).
    await bluetooth.switchOn();
    await ride.reconnect.click();
    await bikeAnswers(page, bluetooth, afterDrop);
    await page.clock.runFor(2000);
    await expect(ride.lost).toHaveCount(0);
    await expect(ride.clock).not.toHaveText(waiting!);
    const back = await placedByTheClock(ride, course);
    expect(back).toBeGreaterThan(waitingAt);
    expect(back).toBeLessThan(waitingAt + 40);
  });
});
