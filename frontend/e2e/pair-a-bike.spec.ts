// Acceptance test
// Traces to: L2-011 AC3 to AC5; L2-012 AC1 to AC3; L2-013 AC1, AC2, AC4; L2-014 AC1
// Description: Connect Bike opens the browser's chooser only when the rider presses Pair, asks for the Echelon
// service and FTMS and no other service, and takes a cancelled chooser back to the start with no error. The screen
// as designed is in connect-bike.spec.ts, and a chooser that cannot open in connect-bike-alerts.spec.ts.
import { ECHELON_NOTIFY, ECHELON_SERVICE, ECHELON_WRITE, echelonBike } from './fixtures/echelon';
import {
  CONTROL_POINT,
  INDOOR_BIKE_DATA,
  INDOOR_BIKE_FRAME,
  RESISTANCE_RANGE,
  ftmsBike,
} from './fixtures/ftms';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { TheClassPage } from './pages/the-class.page';

const FTMS = 0x1826;
/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];

test.describe('Pair a bike', () => {
  test('opens the chooser only from Pair, for the Echelon service and FTMS (L2-012 AC1, AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);
    await connect.open();

    expect(bluetooth.requests()).toEqual([]);

    await connect.pair();

    await expect
      .poll(() => bluetooth.requests())
      .toEqual([
        {
          filters: [{ services: [ECHELON_SERVICE] }, { services: [FTMS] }, { namePrefix: 'ECH' }],
          optionalServices: [ECHELON_SERVICE, FTMS],
        },
      ]);
  });

  test('a cancelled chooser returns to the start with no error (L2-012 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.cancelChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect.poll(() => bluetooth.requests().length).toBe(1);
    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
    await expect(connect.pairButton).toBeEnabled();
    await expect(connect.blocker).toHaveCount(0);
  });

  test(
    'pairs an Echelon: subscribes, initialises in order, and is paired on its first notification (L2-011, L2-013)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.offer(echelonBike);
      const connect = new ConnectBikePage(page);
      await connect.open();

      await connect.pair();

      await expect(connect.deviceName).toHaveText('Echelon EX-5s');
      await expect(connect.deviceIdentifier).toHaveText('EX5S-141844');
      await expect(connect.pairButton).toHaveText('Pairing…');
      await expect(connect.pairButton).toHaveAttribute('aria-busy', 'true');
      await expect(connect.pairButton).toBeDisabled();
      await expect
        .poll(() => bluetooth.log())
        .toEqual([
          `subscribe ${ECHELON_NOTIFY}`,
          `write ${ECHELON_WRITE} F0 A1 00 91`,
          `write ${ECHELON_WRITE} F0 A3 00 93`,
          `write ${ECHELON_WRITE} F0 B0 01 01 A2`,
        ]);
      expect(bluetooth.writes().every((write) => write.withResponse)).toBe(true);
      await expect(connect.pairButton).toHaveText('Pairing…');

      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);

      await expect(connect.pairedCheck).toBeVisible();
      await expect(connect.pairButton).toHaveText('Paired');
      await expect.poll(() => new TheClassPage(page).url()).toBe('/');
    },
  );

  test('pairs an FTMS bike: subscribes to its data and control point and reads its range (L2-014 AC1)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(ftmsBike);
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect(connect.deviceName).toHaveText('KICKR BIKE 1A2B');
    await expect
      .poll(() => bluetooth.log())
      .toEqual([
        `subscribe ${INDOOR_BIKE_DATA}`,
        `subscribe ${CONTROL_POINT}`,
        `read ${RESISTANCE_RANGE}`,
      ]);
    await expect(connect.pairButton).toHaveText('Pairing…');

    await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);

    await expect(connect.pairButton).toHaveText('Paired');
    expect(bluetooth.writes()).toEqual([]);
  });
});
