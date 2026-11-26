// Acceptance test
// Traces to: L2-178 AC9, AC19; L2-134 AC1; L2-138 AC2
// Description: a ride with the diagnostic recording on is the same ride. The class is ridden to its end with the bike
// reporting, a readout still follows a notification within 250 ms, Class Done opens with 20:00 and its output, and
// the recording saved afterwards is within its stated limits and holds the ride from its first write to its last
// readout.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';
import { DiagnosticsPage, entriesOf } from './pages/diagnostics.page';

test('the class rides to its end with the recording on, and the recording stays within its limits (L2-178 AC19)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api, { diagnose: true });
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  // A minute of the bike's notifications, a second apart, as a real bike sends them.
  for (let second = 0; second < 60; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
  }
  await expect(ride.clock).toHaveText('1:00 / 20:00');

  // A readout still shows a notification within 250 ms (L2-134 AC1).
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
  await page.clock.runFor(250);
  await expect(ride.cadence).toHaveText('91');

  await page.clock.fastForward('18:58');
  await page.clock.runFor(2000);
  const done = new ClassDonePage(page);
  await done.shown();
  await expect(done.time).toHaveText('20:00');
  await expect(done.number).toHaveText(/^\d+$/);

  await page.clock.resume();
  const [file] = await new DiagnosticsPage(page).saveFiles();
  const recording = file.bytes.toString('utf8');
  const entries = entriesOf(recording);
  expect(entries.length).toBeLessThanOrEqual(20_000);
  expect(file.bytes.length).toBeLessThan(3_000_000 + 2_000);
  expect(recording).toContain('\n# dropped: 0 entries\n');
  // The ride is all there: the minute's notifications, the keepalives and the readouts the rider saw.
  expect(entries.filter((entry) => entry.includes('D1 cadence=85')).length).toBe(60);
  expect(entries.filter((entry) => entry.endsWith('F0 A0 01 01 92')).length).toBeGreaterThan(55);
  expect(entries.some((entry) => entry.startsWith('SCR  ') && entry.includes('cadence="91"'))).toBe(
    true,
  );
});
