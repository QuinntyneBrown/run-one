// Acceptance test
// Traces to: L2-178 AC6, AC7, AC18; L2-115 AC4; L2-012; L2-014; L2-017
// Description: with the recording on, a saved recording explains the link by itself. Pairing leaves the chooser's
// filters and outcome, the device, each service with its characteristics, the link chosen and each `ble` state, in
// order. A drop leaves the drop, each reconnect attempt with its outcome and the error the app logged. An FTMS bike is
// recorded as an Echelon is: the range it read, its Indoor Bike Data, its control point's answer and its commands.
//
// Given Connect Bike with the recording on, when a bike is paired, then the recording holds the chooser, the device,
// the services, the link and the `ble` states, in the order they happened.
// Given the chooser is closed or fails, when it ends, then the recording says which.
// Given a connected bike, when it drops and comes back, then the recording holds the drop, each attempt, the logged
// error and the reconnection.
// Given an FTMS bike, when it is ridden, then its bytes and commands are recorded with what the app made of them.
import { bikeBack, connectBike, loseBike, startClassRideOnFtms } from './fixtures/class-ride';
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  ECHELON_SERVICE,
  ECHELON_WRITE,
  echelonBike,
  resistanceFrame,
} from './fixtures/echelon';
import {
  CONTROL_GRANTED,
  CONTROL_POINT,
  FTMS_SERVICE,
  INDOOR_BIKE_DATA,
  RESISTANCE_RANGE,
} from './fixtures/ftms';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { ConnectBikePage } from './pages/connect-bike.page';
import { DiagnosticsPage } from './pages/diagnostics.page';
import { TheClassPage } from './pages/the-class.page';

/** The entries of `kinds`, in the recording's order. */
const of = (entries: string[], ...kinds: string[]): string[] =>
  entries.filter((entry) => kinds.includes(entry.split(' ')[0]));

test.describe('Diagnostic recording of the link’s events', () => {
  test('pairing a bike leaves the chooser, the device, its services, the link and each ble state (L2-178 AC6)', async ({
    page,
    bluetooth,
  }) => {
    const diagnostics = new DiagnosticsPage(page);
    await diagnostics.open('/connect');
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);

    await connect.pair();
    await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await expect(connect.pairButton).toHaveText('Paired');

    const events = of(await diagnostics.entries(), 'EVT');
    expect(events).toEqual([
      'EVT  recording-started',
      `EVT  chooser-opened filters=[{"services":["${ECHELON_SERVICE}"]},{"services":[6182]},{"namePrefix":"ECH"}] optional-services=["${ECHELON_SERVICE}",6182]`,
      'EVT  chooser-picked name="ECH-EX5S-141844" id="fake-bike"',
      'EVT  bike name="Echelon EX-5s" identifier="EX5S-141844" kind=echelon',
      'EVT  ble connecting',
      `EVT  service ${ECHELON_SERVICE} characteristics=${ECHELON_WRITE}(write),${ECHELON_NOTIFY}(notify)`,
      'EVT  link echelon',
      'EVT  ble connected',
    ]);
  });

  test('a chooser that is closed, and one that fails, are recorded with which (L2-178 AC6, AC7)', async ({
    page,
    bluetooth,
  }) => {
    const diagnostics = new DiagnosticsPage(page);
    await diagnostics.open('/connect');
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);

    await bluetooth.cancelChooser();
    await connect.pair();
    await expect.poll(() => bluetooth.requests().length).toBe(1);
    await bluetooth.failChooser();
    await connect.pair();
    await expect(connect.blocker).toBeVisible();

    const events = of(await diagnostics.entries(), 'EVT').filter(
      (entry) => !entry.startsWith('EVT  chooser-opened'),
    );
    expect(events.slice(1)).toEqual([
      'EVT  chooser-closed',
      'EVT  chooser-failed "NotSupportedError: Bluetooth adapter not available."',
    ]);
  });

  test('a drop leaves the drop, each reconnect attempt, the logged error and the reconnection (L2-178 AC6, AC7; L2-115 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await page.clock.install();
    await bluetooth.remember(echelonBike);
    const logged: string[] = [];
    page.on('console', (message) => message.type() === 'error' && logged.push(message.text()));
    const home = new TheClassPage(page);
    await home.open({ diagnose: true });
    await connectBike(bluetooth);
    await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/);

    const lost = await loseBike(bluetooth);
    await page.clock.runFor(3100);
    await expect.poll(() => logged).toHaveLength(1);
    await bluetooth.switchOn();
    await page.clock.runFor(3100);
    await page.clock.resume();
    await bikeBack(bluetooth, lost);
    await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/);

    const entries = of(await new DiagnosticsPage(page).entries(), 'EVT', 'ERR');
    const sinceDrop = entries.slice(entries.indexOf('EVT  dropped'));
    expect(sinceDrop.filter((entry) => !entry.startsWith('EVT  service '))).toEqual([
      'EVT  dropped',
      'EVT  ble disconnected',
      'EVT  reconnect-attempt',
      'ERR  "[bluetooth] NetworkError: Bluetooth Device is no longer in range."',
      'EVT  reconnect-failed',
      'EVT  reconnect-attempt',
      'EVT  link echelon',
      'EVT  reconnect-ok',
      'EVT  ble connected',
    ]);
    // The console got the same line, and no line for any Bluetooth message (L2-115 AC2, AC4).
    expect(logged).toEqual(['[bluetooth] NetworkError: Bluetooth Device is no longer in range.']);
  });

  test('an FTMS bike is recorded as an Echelon is: its range, its data, its control point and its commands (L2-178 AC18)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startClassRideOnFtms(page, bluetooth, undefined, { diagnose: true });
    // The ride's first target asks for control; the bike grants it, and the target follows.
    await expect
      .poll(async () => {
        await page.clock.runFor(16);
        return bluetooth.writes().map((write) => write.hex);
      })
      .toContain('00');
    await bluetooth.notify(CONTROL_POINT, CONTROL_GRANTED);
    await expect
      .poll(async () => {
        await page.clock.runFor(16);
        return bluetooth.writes().length;
      })
      .toBeGreaterThanOrEqual(2);
    await page.clock.runFor(100);
    await expect(ride.clock).toBeVisible();

    await page.clock.resume();
    const entries = await new DiagnosticsPage(page).entries();
    const level = theClass.segments[0].level;
    expect(of(entries, 'EVT')).toContain(
      `EVT  service ${FTMS_SERVICE} characteristics=${INDOOR_BIKE_DATA}(notify),${CONTROL_POINT}(write,indicate),${RESISTANCE_RANGE}(read)`,
    );
    expect(of(entries, 'EVT')).toContain('EVT  link ftms');
    expect(of(entries, 'EVT')).toContain(
      'EVT  bike name="KICKR BIKE 1A2B" identifier=null kind=ftms',
    );
    const bytes = of(entries, 'RX', 'TX').map((entry) => entry.replace(/#\d+ /, ''));
    expect(bytes).toContain(
      `RX   read ${RESISTANCE_RANGE} 0A 00 E8 03 0A 00 | FtmsResistanceRange minimum=10 maximum=1000 increment=10`,
    );
    expect(bytes).toContain(
      `RX   notification ${INDOOR_BIKE_DATA} 04 00 D0 07 A0 00 | IndoorBikeDataDecoder IndoorBikeData flags=0x0004 cadence=80 speed=20.00`,
    );
    const asked = bytes.indexOf(`TX   ${CONTROL_POINT} 00`);
    const granted = bytes.indexOf(
      `RX   indication ${CONTROL_POINT} 80 00 01 | FtmsControlPoint response to=0x00 success`,
    );
    const target = bytes.findIndex(
      (entry) =>
        entry.startsWith(`TX   ${CONTROL_POINT} 04 `) &&
        entry.endsWith(` | target-resistance=${level}`),
    );
    expect(asked).toBeGreaterThan(-1);
    expect(granted).toBeGreaterThan(asked);
    expect(target).toBeGreaterThan(granted);
  });
});
