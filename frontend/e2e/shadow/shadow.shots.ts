// The rider's shadow, looked at (L2-174 AC12): one sheet of pictures of the course's box at seconds of the ride where
// the sun stands differently to the bike (ahead, abeam on each side, behind, and between). Run only when a person
// asks (playwright.shadow.config.ts); it proves nothing and keeps no baseline. SHADOW_OUT names the folder the sheet
// and each picture are written to, SHADOW_AT the seconds (comma separated, or `from:to:step`), SHADOW_TIER the
// course's step, SHADOW_NONE=1 leaves the shadow out (to measure it by the difference), SHADOW_SHEET=0 writes no sheet.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { courseDrawnOnPausedClock, startRideInIbizaOnPausedClock } from '../fixtures/class-ride';
import type { Tier } from '../fixtures/course-probe';
import { test } from '../fixtures/test';

/** Seconds of the ride, and where the sun stands to the bike at each (degrees right of dead ahead). */
const ASKED = process.env['SHADOW_AT'] ?? '46,75,150,300,350,500,875,1000';
const AT = ASKED.includes(':')
  ? (([from, to, step]) =>
      Array.from({ length: Math.floor((to! - from!) / step!) + 1 }, (_, i) => from! + i * step!))(
      ASKED.split(':').map(Number),
    )
  : ASKED.split(',').map(Number);
const OUT = process.env['SHADOW_OUT'] ?? 'test-results/shadow';
const TIER = (process.env['SHADOW_TIER'] ?? 'high') as Tier;
/** SHADOW_COST=1 times twenty frames at each place; otherwise none are timed. */
const COST_FRAMES = process.env['SHADOW_COST'] ? 20 : 0;
/** How many pictures stand side by side in the sheet. */
const COLUMNS = Number(process.env['SHADOW_COLUMNS'] ?? 4);
/** Metres above the rider the camera looks straight down from; 0 is the ride's own chase camera. */
const ABOVE = Number(process.env['SHADOW_ABOVE'] ?? 0);
/** The share of the box kept in the sheet, round the rider: left, top, width, height. */
const CROP = (process.env['SHADOW_CROP'] ?? '0.1,0.25,0.8,0.75').split(',').map(Number);

// Two device pixels a CSS pixel, so a picture keeps what the course's higher steps draw.
test.use({ deviceScaleFactor: Number(process.env['SHADOW_SCALE'] ?? 2) });

test('the rider’s shadow round the course', async ({ page, bluetooth, course, browser }) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await course.pin(TIER, ABOVE, !process.env['SHADOW_NONE']);
  const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
  await courseDrawnOnPausedClock(page, ride, 30);
  mkdirSync(OUT, { recursive: true });

  const shots: { second: number; data: string }[] = [];
  const costs: number[] = [];
  const metres: number[] = [];
  let at = 0;
  for (const second of AT) {
    await page.clock.fastForward(Math.max(second - at, 0) * 1000);
    at = second;
    // The map's chunks near the new place are chosen within a few frames.
    for (let frame = 0; frame < 14; frame++) await page.clock.runFor(16);
    metres.push((await course.drawn())!.metres);
    // How long a frame takes to draw here, in software: a rough measure of what the shadow costs to fill.
    const before = (await course.drawn())!.frames;
    const started = Date.now();
    for (let frame = 0; frame < COST_FRAMES; frame++) await page.clock.runFor(16);
    const frames = (await course.drawn())!.frames - before;
    costs.push(Math.round(((Date.now() - started) / Math.max(frames, 1)) * 10) / 10);
    const box = (await ride.courseCanvas.boundingBox())!;
    const [left, top, width, height] = CROP as [number, number, number, number];
    const shot = await page.screenshot({
      clip: {
        x: box.x + box.width * left,
        y: box.y + box.height * top,
        width: box.width * width,
        height: box.height * height,
      },
    });
    writeFileSync(join(OUT, `at-${String(second).padStart(4, '0')}.png`), shot);
    shots.push({ second, data: shot.toString('base64') });
  }
  const drawn = await course.drawn();
  writeFileSync(
    join(OUT, 'drawn.json'),
    JSON.stringify({ ...drawn, msPerFrame: costs, at: AT, metresAt: metres }, null, 2),
  );

  if (process.env['SHADOW_SHEET'] === '0') return;
  // The sheet: every picture side by side, each with its second.
  const sheet = await browser.newPage({ viewport: { width: 1920, height: 400 } });
  await sheet.setContent(
    `<body style="margin:0;background:#111"><main style="display:grid;grid-template-columns:repeat(${Math.min(shots.length, COLUMNS)},1fr);gap:4px;font:16px sans-serif;color:#fff">${shots
      .map(
        ({ second, data }) =>
          `<figure style="margin:0;position:relative"><img style="width:100%;display:block" src="data:image/png;base64,${data}"><figcaption style="position:absolute;left:6px;top:4px;text-shadow:0 0 3px #000">${second} s</figcaption></figure>`,
      )
      .join('')}</main></body>`,
  );
  writeFileSync(join(OUT, 'sheet.png'), await sheet.locator('main').screenshot());
  await sheet.close();
});
