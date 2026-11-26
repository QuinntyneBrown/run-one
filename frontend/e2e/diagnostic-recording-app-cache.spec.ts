// Acceptance test
// Traces to: L2-178 AC1, AC2; L2-135 AC3; ADR 0032
// Description: the app's service worker keeps every script a rider needs on the device, and not the diagnostic
// recording's. Once the app is cached, none of the scripts the worker holds carries the recording's code; opened with
// ?diagnose under the same worker, the recording's code is fetched then and the mark shows. Like app-cache.spec.ts,
// this spec lets a service worker run.
import { appCached, cachedScriptsHolding } from './fixtures/app-cache';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { DiagnosticsPage } from './pages/diagnostics.page';
import { TheClassPage } from './pages/the-class.page';

test.use({ serviceWorkers: 'allow' });

test('the service worker keeps none of the recording’s code for a rider, and ?diagnose still loads it (L2-178 AC1, AC2)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const home = new TheClassPage(page);
  await home.open();
  await expect(home.title).toHaveText('Intervals to the Beat');
  await appCached(page);

  expect(await cachedScriptsHolding(page, 'Telo Ride 1 diagnostic recording')).toEqual([]);

  const diagnostics = new DiagnosticsPage(page);
  await diagnostics.open('/');
  await expect(home.title).toHaveText('Intervals to the Beat');
  await expect(diagnostics.mark).toBeVisible();
});
