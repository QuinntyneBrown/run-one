// Heap check, run only when a person asks (`npm run heap`)
// Traces to: L2-138 AC1; AGENTS.md "Prove it"
// Description: leaving a screen returns its memory (L2-138 AC3). The rider goes from The Class to Class Ride and back ten
// times, with the class video and in Ibiza alike; the used heap read after each return may grow by at most 5 MB from
// the third return to the tenth, once every lazy chunk and cache is warm. A leaked course (its scene, materials and renderer) or a leaked ride (its ticker,
// recorder and listeners) costs far more than that each round.
import { startClassRide } from '../fixtures/class-ride';
import { expect, test } from '../fixtures/test';
import { TheClassPage } from '../pages/the-class.page';
import { expectHeldHeap, usedHeap } from './heap';

const ROUNDS = 10;
const WARM = 3;
const LIMIT_MB = 5;
const COURSE_DRAWN = 60_000;

for (const way of ['video', 'ibiza'] as const)
  test(`a class ride with ${way === 'ibiza' ? 'Ibiza' : 'the class video'}, entered and left ten times, holds the heap (L2-138 AC3)`, async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await page.clock.resume();
    const start = new TheClassPage(page);
    const leave = async () => {
      await expect(ride.clock).toBeVisible();
      await ride.leave.click();
      await expect(start.start).toBeVisible();
    };

    await leave();
    if (way === 'ibiza') await start.ibiza.click();
    let warm = 0;
    for (let round = 1; round <= ROUNDS; round++) {
      await start.start.click();
      if (way === 'ibiza') await expect(ride.course).toBeVisible({ timeout: COURSE_DRAWN });
      await leave();
      if (round === WARM) warm = await usedHeap(page);
    }

    expectHeldHeap(`The class ride with ${way}`, warm, await usedHeap(page), LIMIT_MB);
  });
