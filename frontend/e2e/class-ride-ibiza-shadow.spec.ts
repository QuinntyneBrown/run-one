// Acceptance test
// Traces to: L2-174 AC12; L2-177 AC1
// Description: the rider's shadow in the sun is their own figure as the sun sees it, laid on the road straight away
// from the sun, and it is made with no shadow map. The renderer reports how it laid the shadow to the test-only hook
// (fixtures/course-probe.ts); how the shadow looks is looked at by a person (e2e/shadow/shadow.shots.ts). The course
// is drawn in software, once, in the smallest landscape window, at its lowest step.
//
// Given a ride in Ibiza, when frames are drawn where the sun is on the rider's left, on their right, ahead of them
// and behind them, then at each the shadow lies straight away from the sun, the shadow of the rider's head lies
// between 3.3 m and 3.5 m from their wheels (the course's sun is lower than the light that shades the rider), the rider's figure has been drawn
// again for it since the place before, and no shadow map is made.
import { courseDrawnOnPausedClock, startRideInIbizaOnPausedClock } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';

test('the rider’s shadow is their own figure, laid straight away from the sun, with no shadow map (L2-174 AC12)', async ({
  page,
  bluetooth,
  course,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await course.pin('low');
  const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
  await courseDrawnOnPausedClock(page, ride, 20);

  let at = 0;
  let figures = 0;
  // The sun on the rider's left, on their right, dead ahead and behind them.
  for (const second of [25, 150, 300, 875]) {
    await page.clock.fastForward((second - at) * 1000);
    at = second;
    await page.clock.runFor(64);
    const drawn = (await course.drawn())!;
    expect(Math.abs(drawn.shadow.off), `off the sun's line at ${second} s`).toBeLessThan(0.5);
    expect(drawn.shadow.reach, `reach at ${second} s`).toBeGreaterThan(3.3);
    expect(drawn.shadow.reach, `reach at ${second} s`).toBeLessThan(3.5);
    expect(drawn.shadow.figures, `figures drawn by ${second} s`).toBeGreaterThan(figures);
    figures = drawn.shadow.figures;
    expect(drawn.shadowMap, `shadow map at ${second} s`).toBe(false);
  }
});
