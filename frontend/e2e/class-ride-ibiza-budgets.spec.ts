// Acceptance test
// Traces to: L2-177 AC1, AC2
// Description: the course on a low-power tablet stays within its budgets. At the heaviest of its five steps, wherever
// the clock has put the rider, a frame sends the GPU no more than 120,000 triangles in no more than 140 draw calls,
// and makes no shadow map; the map carries no texture; the model is no more than 3 MB gzipped and the music no more
// than 4 MB. The course is drawn in software, once, in the smallest landscape window. (AC3's steps are proved by
// world/src/frame-budget.spec.ts.)
//
// Given the course at its heaviest step, when frames are drawn at 25 places from the grid to the finish, then none
// exceeds 120,000 triangles or 140 draw calls, and no shadow map is made.
// Given the course's model, when it is served, then it carries no texture and is no more than 3 MB gzipped.
// Given the music, when it is served, then it is no more than 4 MB.
import { gzipSync } from 'node:zlib';
import {
  RIDE_START,
  courseDrawnOnPausedClock,
  openTheClassForIbiza,
  startRideInIbizaOnPausedClock,
} from './fixtures/class-ride';
import { IbizaFlyoverPage } from './pages/ibiza-flyover.page';
import { expect, test } from './fixtures/test';

const MEGABYTE = 1024 * 1024;

test('a frame anywhere on the course is within 120,000 triangles and 140 draw calls, with no shadow map (L2-177 AC1)', async ({
  page,
  bluetooth,
  course,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await course.pin('ultra');
  const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
  await courseDrawnOnPausedClock(page, ride, 20);

  let at = 0;
  for (const second of [0, ...Array.from({ length: 23 }, (_, i) => (i + 1) * 50), 1190]) {
    await page.clock.fastForward((second - at) * 1000);
    at = second;
    await page.clock.runFor(64);
    const drawn = (await course.drawn())!;
    expect(drawn.tier, `at ${second} s`).toBe(4);
    expect(drawn.triangles, `triangles at ${second} s`).toBeGreaterThan(0);
    expect(drawn.triangles, `triangles at ${second} s`).toBeLessThanOrEqual(120_000);
    expect(drawn.drawCalls, `draw calls at ${second} s`).toBeGreaterThan(0);
    expect(drawn.drawCalls, `draw calls at ${second} s`).toBeLessThanOrEqual(140);
    expect(drawn.shadowMap, `shadow map at ${second} s`).toBe(false);
  }
});

test('a frame of the flyover is within 120,000 triangles and 140 draw calls (L2-177 AC1, L2-179)', async ({
  page,
  bluetooth,
  course,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await course.pin('ultra');
  await page.clock.install({ time: RIDE_START });
  const home = await openTheClassForIbiza(page, bluetooth);
  await page.clock.pauseAt(RIDE_START + 60_000);
  await home.start.click();
  const flyover = new IbizaFlyoverPage(page);
  await expect(async () => {
    await page.clock.runFor(16);
    await expect(flyover.caption).toContainText('The waterfront', { timeout: 50 });
  }).toPass({ intervals: [0], timeout: 60_000 });

  // The flight is nine seconds: frames from its start to its end.
  for (let step = 0; step < 9; step++) {
    await page.clock.runFor(1000);
    const drawn = (await course.drawn())!;
    expect(drawn.triangles, `triangles ${step + 1} s into the flight`).toBeGreaterThan(0);
    expect(drawn.triangles, `triangles ${step + 1} s into the flight`).toBeLessThanOrEqual(120_000);
    expect(drawn.drawCalls, `draw calls ${step + 1} s into the flight`).toBeLessThanOrEqual(140);
    expect(drawn.shadowMap).toBe(false);
  }
});

test('the course’s model carries no texture and is no more than 3 MB gzipped (L2-177 AC1, AC2)', async ({
  request,
}) => {
  const response = await request.get('/courses/ibiza.glb');
  expect(response.ok()).toBe(true);
  const model = await response.body();
  // A glTF binary: a 12-byte header, then the JSON chunk (length, type, data).
  const jsonLength = model.readUInt32LE(12);
  const json = JSON.parse(model.subarray(20, 20 + jsonLength).toString('utf8')) as {
    textures?: unknown[];
    images?: unknown[];
  };
  expect(json.textures ?? []).toEqual([]);
  expect(json.images ?? []).toEqual([]);
  expect(gzipSync(model).length).toBeLessThanOrEqual(3 * MEGABYTE);
});

test('the music is no more than 4 MB (L2-177 AC2)', async ({ request }) => {
  const response = await request.get('/music/beautiful-boom-bap.mp3');
  expect(response.ok()).toBe(true);
  expect((await response.body()).length).toBeLessThanOrEqual(4 * MEGABYTE);
});
