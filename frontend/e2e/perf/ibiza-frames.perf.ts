// Performance check, run only when a person asks (`npm run perf -- ibiza-frames`)
// Traces to: L2-174 AC12; L2-177 AC3, AC4
// Description: how fast the course is drawn with the rider's shadow and without it, at each of the steps a spec can
// pin, on the reference tablet's screen (1194 × 834) with the CPU slowed 4 times. For each it rides ten seconds on the
// running clock and reads the page's own animation frames: the frames a second, the middle frame time and the 95th
// percentile, and the page's own time spent on the shadow a frame. It asks Chromium for the machine's own GPU (ANGLE
// on D3D11) and lifts the display's limit on frames, so a frame is as long as it takes to draw; the report names the
// GPU it got, because a frame is only as real as the GPU that drew it. It fails where the shadow takes more than
// 1.5 ms of the page's own time a frame at any step (a frame at 60 a second is 16.7 ms). Whether a device then holds
// 60 frames a second is the frame budget's work (frame-budget.ts), which steps the course down until it does.
import { writeFileSync } from 'node:fs';
import { rideInIbiza } from '../fixtures/class-ride';
import type { Tier } from '../fixtures/course-probe';
import { expect, test } from '../fixtures/test';

const SLOWDOWN = Number(process.env['PERF_SLOWDOWN'] ?? 4);
const SECONDS = Number(process.env['PERF_SECONDS'] ?? 10);
const TIERS = (process.env['PERF_TIERS'] ?? 'low,medium,high,ultra').split(',') as Tier[];
/** The most of the page's own time the shadow may take a frame, in milliseconds, with the CPU slowed. */
const SHADOW_MS = 1.5;

test.use({
  viewport: { width: 1194, height: 834 },
  hasTouch: true,
  launchOptions: {
    args: [
      '--use-angle=d3d11',
      '--enable-gpu',
      '--ignore-gpu-blocklist',
      '--disable-frame-rate-limit',
    ],
  },
});

interface Frames {
  fps: number;
  middle: number;
  slow: number;
  gpu: string;
}

const results: Record<string, Frames> = {};

for (const tier of TIERS) {
  for (const shadow of [true, false]) {
    test(`the course at the ${tier} step ${shadow ? 'with' : 'without'} the rider’s shadow`, async ({
      page,
      bluetooth,
      course,
    }) => {
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: SLOWDOWN });
      await course.pin(tier, 0, shadow);
      await rideInIbiza(page, bluetooth);
      // The map's programs and chunks settle in the first seconds of a ride.
      await page.waitForTimeout(3000);
      const before = (await course.drawn())!;
      const frames = await page.evaluate(
        (seconds) =>
          new Promise<Frames>((resolve) => {
            const times: number[] = [];
            const started = performance.now();
            let last = started;
            const frame = (now: number) => {
              times.push(now - last);
              last = now;
              if (now - started < seconds * 1000) requestAnimationFrame(frame);
              else {
                const sorted = [...times].sort((a, b) => a - b);
                const gl = document.createElement('canvas').getContext('webgl2');
                const info = gl?.getExtension('WEBGL_debug_renderer_info');
                resolve({
                  fps: Math.round((times.length / (now - started)) * 10000) / 10,
                  middle: Math.round(sorted[Math.floor(sorted.length / 2)]! * 100) / 100,
                  slow: Math.round(sorted[Math.floor(sorted.length * 0.95)]! * 100) / 100,
                  gpu: String(info ? gl!.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'),
                });
              }
            };
            requestAnimationFrame(frame);
          }),
        SECONDS,
      );
      const drawn = (await course.drawn())!;
      const own =
        Math.round(((drawn.shadow.ms - before.shadow.ms) / (drawn.frames - before.frames)) * 100) /
        100;
      results[`${tier} ${shadow ? 'shadow' : 'none'}`] = frames;
      console.log(
        `${tier.padEnd(6)} ${shadow ? 'with shadow   ' : 'without shadow'} ${frames.fps} fps, middle ${frames.middle} ms, 95th ${frames.slow} ms, shadow’s own ${own} ms a frame, ${drawn.backend}, ${drawn.drawCalls} draw calls, ${frames.gpu}`,
      );
      // The page's own time on the shadow is steady from run to run; the frames a second are not, on a machine doing
      // other things, so they are reported and only the shadow's own time is held to a number.
      expect(own, 'the shadow’s own milliseconds a frame').toBeLessThanOrEqual(SHADOW_MS);
    });
  }
}

test.afterAll(() => {
  if (process.env['PERF_OUT'])
    writeFileSync(process.env['PERF_OUT'], JSON.stringify(results, null, 2));
});
