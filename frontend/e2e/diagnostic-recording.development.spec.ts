// Acceptance test
// Traces to: L2-178 AC18; L2-024 AC4
// Description: the simulated bike is recorded exactly as a real one. A development build opened with ?simulate and
// ?diagnose pairs the simulated Echelon EX-5s and starts the class; the saved recording holds the frames it sent,
// decoded, and the resistance command it was given with its target resistance, and no Bluetooth call was made (the
// shared fixture fails the spec on any).
import { ECHELON_NOTIFY, ECHELON_WRITE, targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { ClassRidePage } from './pages/class-ride.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { DiagnosticsPage, entriesOf } from './pages/diagnostics.page';
import { TheClassPage } from './pages/the-class.page';

test('the simulated bike is recorded as a real one is (L2-178 AC18)', async ({ page }) => {
  const connect = new ConnectBikePage(page);
  await connect.open({ simulate: true, diagnose: true });
  const diagnostics = new DiagnosticsPage(page);
  await expect(diagnostics.mark).toBeVisible();
  await connect.pair();
  const home = new TheClassPage(page);
  await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/);
  await home.start.click();
  const ride = new ClassRidePage(page);
  // The simulated bike reports the level the class asked for in its next D2 (L2-024 AC2).
  const level = theClass.segments[0].level;
  await expect(ride.level).toHaveText(String(level));

  const entries = entriesOf(await diagnostics.savedRecording());

  expect(entries).toContain(
    'EVT  bike name="Echelon EX-5s" identifier="EX5S-0bf669f1" kind=echelon',
  );
  expect(entries).toContain('EVT  link simulated');
  expect(entries).toContain('EVT  ble connected');
  const command = entries.findIndex((entry) =>
    new RegExp(
      `^TX   #\\d+ ${ECHELON_WRITE} ${targetResistanceWrite(level)} \\| target-resistance=${level}$`,
    ).test(entry),
  );
  expect(command).toBeGreaterThan(-1);
  expect(entries[command + 1]).toMatch(/^ACK {2}#\d+ ok 0ms$/);
  const frames = entries.filter((entry) =>
    entry.startsWith(`RX   notification ${ECHELON_NOTIFY} `),
  );
  expect(
    frames.some((entry) => / \| EchelonFrameDecoder D1 cadence=\d+ checksum=ok$/.test(entry)),
  ).toBe(true);
  expect(
    entries
      .slice(command)
      .some((entry) => entry.endsWith(`| EchelonFrameDecoder D2 resistance=${level} checksum=ok`)),
  ).toBe(true);
});
