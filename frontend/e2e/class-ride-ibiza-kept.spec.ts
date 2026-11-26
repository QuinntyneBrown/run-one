// Acceptance test
// Traces to: L2-175 AC4, AC5; L2-135 AC1
// Description: the course is kept on the device after its first load. With the service worker in control, a ride in
// Ibiza fetches the course's files once; a second ride, with the network gone, still draws the course from what the
// worker kept. The only other spec that lets a service worker run is app-cache.spec.ts (playwright.config.ts).
//
// Given the course has been loaded once on this device, when the network is lost and the rider rides in Ibiza again,
// then all three of the course's files are served by the worker and the course is not given up (no notice that it cannot be drawn). That the course draws from good files is proved by class-ride-ibiza.spec.ts.
import { appCached } from './fixtures/app-cache';
import { openTheClassForIbiza, skipFlyover } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';

const WANTED = ['/courses/ibiza.course.json', '/courses/ibiza.glb', '/riders/rider.glb'];

test.use({ serviceWorkers: 'allow' });

test('a ride in Ibiza with no network gets the course from what the first ride kept (L2-175 AC4, AC5)', async ({
  page,
  context,
  bluetooth,
}) => {
  // The worker caches the app and then the course on a machine that may be busy with other specs.
  test.setTimeout(90_000);

  // The app is cached on the device, and the worker is in control of the page.
  let home = await openTheClassForIbiza(page, bluetooth);
  await appCached(page);
  await page.reload();
  home = await openTheClassForIbiza(page, bluetooth);

  // The first ride loads the course from the network, and the worker keeps what it fetched: the rider leaves once
  // all three files are on the device, without waiting for the course to be drawn.
  await home.start.click();
  await skipFlyover(page);
  const first = new ClassRidePage(page);
  await expect(first.clock).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate(async (wanted) => {
          const name = (await caches.keys()).find((key) => key.endsWith(':assets:assets:cache'));
          if (name === undefined) return 'no cache of the lazy assets';
          const cache = await caches.open(name);
          const kept = await Promise.all(wanted.map((path) => cache.match(path)));
          return kept.every((response) => response !== undefined) ? 'kept' : 'not all kept yet';
        }, WANTED),
      { message: 'the worker keeps the course’s files', timeout: 60_000 },
    )
    .toBe('kept');
  await first.leave.click();
  await expect(page).toHaveURL('/');

  // The network is gone: the second ride gets all three files from the worker, and the course is not given up.
  await context.setOffline(true);
  const served: string[] = [];
  page.on('response', (response) => {
    const { pathname } = new URL(response.url());
    if (response.ok() && response.fromServiceWorker() && WANTED.includes(pathname)) {
      served.push(pathname);
    }
  });
  await expect(home.start).toBeEnabled();
  await home.start.click();
  await skipFlyover(page);
  const second = new ClassRidePage(page);
  await expect(second.clock).toBeVisible();
  await expect.poll(() => [...new Set(served)].sort()).toEqual([...WANTED].sort());
  await expect(second.courseNotice).toHaveCount(0);
});
