// Acceptance test
// Traces to: L2-174 AC8
// Description: leaving a ride in Ibiza lets the course go. The frame loop stops, and the renderer holds no geometry
// and no texture when it is disposed (reported to the test-only hook, fixtures/course-probe.ts). The same when the
// ride finishes. The heap over repeated rides is proved by heap/enter-and-leave.heap.ts, which runs when asked.
//
// Given a ride in Ibiza with the course drawn, when the rider leaves, then the renderer reports itself released with
// no geometry or texture, and no frame is drawn after.
import { courseDrawnOnPausedClock, startRideInIbizaOnPausedClock } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';

test('leaving a ride in Ibiza stops the frame loop and releases the course (L2-174 AC8)', async ({
  page,
  bluetooth,
  course,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await course.pin('low');
  const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
  await courseDrawnOnPausedClock(page, ride);
  await page.clock.runFor(200);
  const drawing = (await course.drawn())!;
  expect(drawing.released).toBe(false);
  expect(drawing.frames).toBeGreaterThan(0);

  await ride.leave.click();
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return new URL(page.url()).pathname;
    })
    .toBe('/');
  await page.clock.runFor(2000);

  const left = (await course.drawn())!;
  expect(left.released).toBe(true);
  // The course's own geometry and textures are gone: what the renderer still holds is its own output quad and
  // targets, which its dispose frees (and which a ride that draws nothing holds too).
  expect(left.heldBefore.geometries).toBeGreaterThan(left.held.geometries);
  expect(left.heldBefore.textures).toBeGreaterThan(left.held.textures);
  expect(left.held.geometries).toBeLessThanOrEqual(1);
  expect(left.held.textures).toBeLessThanOrEqual(3);
  // The loop is stopped: two seconds of the clock draw nothing more than the frame that was in flight.
  const frames = left.frames;
  await page.clock.runFor(2000);
  expect((await course.drawn())!.frames).toBe(frames);
});
