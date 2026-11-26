// Acceptance test
// Traces to: L2-149 AC1, L2-009 AC2, L2-131 AC4; ADR 0043
// Description: Telo Ride 1 is static files. The production build carries its host's configuration
// (`staticwebapp.config.json`), and the spec server serves the build as that file says: an address that matches no file
// is answered with the app, so the ride's address is the app's (which opens The Class there, with no connected bike, L2-087 AC4) and an unknown address reaches Page not found; every
// answer carries the headers of L2-131 and a year of Strict-Transport-Security; the app's shell and its service worker
// are asked for again each time while the hashed files are kept for a year; and a file that is not there is 404, never
// the app. The redirect from plain http is the host's own and is checked on the host by a person (docs/deployment.md).
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { NotFoundPage } from './pages/not-found.page';
import { StaticHost } from './pages/static-host';
import { RIDE_ADDRESS } from './pages/class-ride.page';
import { TheClassPage } from './pages/the-class.page';

const YEAR = 'max-age=31536000';

test.describe('Static host', () => {
  test(
    'an address that matches no file is answered with the app, under its headers (L2-149 AC1, L2-009 AC2)',
    { tag: '@critical' },
    async ({ page, bluetooth, webgl }) => {
      await bluetooth.remember(echelonBike);
      await webgl.disable();
      const host = new StaticHost(page);

      const ride = await host.open(RIDE_ADDRESS);
      expect(ride.status).toBe(200);
      expect(ride.type).toBe('text/html');
      expect(ride.headers['strict-transport-security']).toBe(YEAR);
      expect(ride.headers['cache-control']).toBe('no-cache');
      expect(ride.headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(ride.headers['x-content-type-options']).toBe('nosniff');
      expect(ride.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      await expect(new TheClassPage(page).title).toHaveText('Intervals to the Beat');

      const unknown = await host.open('/no-such-screen/at-all');
      expect(unknown.status).toBe(200);
      expect(unknown.type).toBe('text/html');
      expect(unknown.headers['strict-transport-security']).toBe(YEAR);
      await expect(new NotFoundPage(page).heading).toHaveText('This page doesn’t exist.');
    },
  );

  test('the build carries the host’s configuration: the fallback, the headers and a year of HSTS (L2-149 AC1, L2-009 AC2)', () => {
    const configuration = StaticHost.configuration();

    expect(configuration.navigationFallback.rewrite).toBe('/index.html');
    // Each asset folder is kept from the fallback: a file missing from it is 404, never the app.
    expect(configuration.navigationFallback.exclude).toEqual(
      expect.arrayContaining(['/courses/*', '/music/*', '/riders/*']),
    );
    expect(configuration.globalHeaders['Strict-Transport-Security']).toBe(YEAR);
    expect(configuration.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
    expect(configuration.globalHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(configuration.globalHeaders['Content-Security-Policy']).toContain(
      "frame-ancestors 'none'",
    );
    expect(configuration.globalHeaders['Cache-Control']).toBe('no-cache');
  });

  test('the policy lets in the app and the YouTube player, and nothing else (L2-131 AC1, AC3, AC4)', () => {
    const policy = Object.fromEntries(
      StaticHost.configuration()
        .globalHeaders['Content-Security-Policy'].split(';')
        .map((directive) => directive.trim().split(/\s+/))
        .map(([name, ...sources]) => [name, sources]),
    );

    expect(policy['script-src']).toEqual([
      "'self'",
      'https://www.youtube.com',
      "'wasm-unsafe-eval'",
    ]);
    expect(policy['frame-src']).toEqual(['https://www.youtube-nocookie.com']);
    expect(policy['connect-src']).toEqual(["'self'", 'blob:']);
    expect(policy['img-src']).toEqual(["'self'", 'https://i.ytimg.com', 'blob:']);
    expect(policy['media-src']).toEqual(["'self'"]);
    expect(policy['font-src']).toEqual(["'self'"]);
    expect(policy['frame-ancestors']).toEqual(["'none'"]);
    // Nothing of Telo Ride's maps remains, and no other host is named.
    const hosts = Object.values(policy)
      .flat()
      .filter((source) => source.startsWith('https://'));
    expect(new Set(hosts)).toEqual(
      new Set([
        'https://www.youtube.com',
        'https://www.youtube-nocookie.com',
        'https://i.ytimg.com',
      ]),
    );
  });

  test('the hashed files are kept for a year; the shell, the service worker and its manifest are asked for again (L2-149 AC1)', async ({
    page,
  }) => {
    const host = new StaticHost(page);
    await host.open('/no-such-screen');
    const hashed = await host.hashedFiles();
    expect(hashed.length).toBeGreaterThan(1);

    for (const file of hashed) {
      const answer = await host.answer(file);
      expect(answer.status, file).toBe(200);
      expect(answer.headers['cache-control'], file).toBe(`public, ${YEAR}, immutable`);
      expect(answer.headers['x-content-type-options'], file).toBe('nosniff');
    }
    for (const file of ['/index.html', '/ngsw.json', '/ngsw-worker.js', '/manifest.webmanifest']) {
      const answer = await host.answer(file);
      expect(answer.status, file).toBe(200);
      expect(answer.headers['cache-control'], file).toBe('no-cache');
    }
  });

  test('the service worker has a policy of its own, which lets it fetch the YouTube player and the class cover (ADR 0043)', async ({
    page,
  }) => {
    const worker = await new StaticHost(page).answer('/ngsw-worker.js');

    expect(worker.type).toBe('text/javascript');
    expect(worker.headers['content-security-policy']).toContain(
      "connect-src 'self' https://www.youtube.com https://i.ytimg.com",
    );
    expect(worker.headers['strict-transport-security']).toBe(YEAR);
  });

  test('the course’s rider is served as a file of its own (L2-149 AC1, ADR 0045)', async ({
    page,
  }) => {
    const answer = await new StaticHost(page).answer('/riders/rider.glb');

    expect(answer.status).toBe(200);
    expect(answer.type).toBe('model/gltf-binary');
    expect(answer.headers['x-content-type-options']).toBe('nosniff');
  });

  for (const file of [
    '/chunk-GONE1234.js',
    '/fonts/no-such-font.woff2',
    '/courses/no-such.glb',
    '/riders/no-such.glb',
    '/riders/no-such-rider',
  ]) {
    test(`a file that is not there is 404, never the app: ${file} (L2-149 AC1)`, async ({
      page,
    }) => {
      const answer = await new StaticHost(page).answer(file);

      expect(answer.status).toBe(404);
      expect(answer.type).not.toBe('text/html');
    });
  }
});
