// Acceptance test
// Traces to: L2-015 AC1 to AC4; L2-011 AC5
// Description: a bike paired in this browser is remembered. Telo Ride 1 opens on The Class and reconnects to it
// through getDevices() without the chooser as soon as the bike advertises; a bike that is switched off, or a browser
// without getDevices(), leaves The Class with no bike and "Connect your bike". Pairing a different bike replaces the
// remembered one, and only its name and the browser's identifier for it are kept. Where a new rider opens is in
// where-the-app-opens.spec.ts.
//
// Given a remembered bike that is switched off, when The Class shows, then it reads "No bike" and "Connect your
// bike"; when the bike is switched on and advertises, then it connects without the chooser.
// Given a browser without getDevices(), when The Class shows, then it reads "No bike" and "Connect your bike", and
// nothing is asked of Bluetooth.
// Given a remembered bike, when the rider pairs a different one, then the record holds that bike's identifier and
// name, and nothing else.
import { ECHELON_NOTIFY, ECHELON_WRITE, echelonBike } from './fixtures/echelon';
import type { FakeBike } from './fixtures/fake-bluetooth';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { TheClassPage } from './pages/the-class.page';

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];
const KEEPALIVE = 'F0 A0 01 01 92';
const INITIALISED = [
  `subscribe ${ECHELON_NOTIFY}`,
  `write ${ECHELON_WRITE} F0 A1 00 91`,
  `write ${ECHELON_WRITE} F0 A3 00 93`,
  `write ${ECHELON_WRITE} F0 B0 01 01 A2`,
];

/** A second bike in the same room: an Echelon EX-3 the browser knows by another identifier. */
const OTHER_BIKE: FakeBike = {
  ...echelonBike,
  id: 'the-other-bike',
  name: 'ECH-EX3-208731',
  card: { name: 'Echelon EX-3', identifier: 'EX3-208731' },
};

test.describe('The remembered bike', () => {
  test(
    'a paired bike is remembered: Telo Ride 1 reopens on The Class and reconnects without the chooser (L2-015 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.offer(echelonBike);
      const connect = new ConnectBikePage(page);
      await connect.open();
      await connect.pair();
      await expect.poll(() => bluetooth.log()).toEqual(INITIALISED);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
      const start = new TheClassPage(page);
      await expect.poll(() => start.url()).toBe('/');

      await start.open();

      await expect(start.main).toBeVisible();
      expect(start.url()).toBe('/');
      // The first session's keepalives may land between the two initialisations.
      await expect
        .poll(() => bluetooth.log().filter((line) => !line.endsWith(KEEPALIVE)))
        .toEqual([...INITIALISED, ...INITIALISED]);
      expect(bluetooth.requests()).toHaveLength(1);
    },
  );

  test('a remembered bike that is switched off reconnects without the chooser as soon as it advertises (L2-015 AC1, AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await bluetooth.switchOff();
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.bike).toHaveAccessibleName('No bike · Connect');
    await expect(theClass.start).toHaveText('Connect your bike');
    expect(bluetooth.log()).toEqual([]);

    await bluetooth.switchOn();

    await expect.poll(() => bluetooth.log()).toEqual(INITIALISED);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
    await expect(theClass.bike).toHaveAccessibleName('Echelon EX-5s connected · Change');
    await expect(theClass.start).toHaveText('Start class');
    expect(bluetooth.requests()).toEqual([]);
    expect(theClass.url()).toBe('/');
  });

  test('without getDevices() The Class shows no bike and "Connect your bike", and asks nothing of Bluetooth (L2-015 AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await bluetooth.withoutGetDevices();
    const theClass = new TheClassPage(page);

    await theClass.open();

    await expect(theClass.title).toHaveText('Intervals to the Beat');
    await expect(theClass.bike).toHaveAccessibleName('No bike · Connect');
    await expect(theClass.start).toHaveText('Connect your bike');
    expect(theClass.url()).toBe('/');
    expect(bluetooth.requests()).toEqual([]);
    expect(bluetooth.log()).toEqual([]);
  });

  test('only the name and the browser’s identifier of the paired bike are kept (L2-015 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);
    await connect.open();
    expect(await bluetooth.remembered()).toBeNull();

    await connect.pair();
    await expect.poll(() => bluetooth.log()).toEqual(INITIALISED);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);

    await expect
      .poll(() => bluetooth.remembered())
      .toEqual({ id: 'fake-bike', name: 'Echelon EX-5s' });
  });

  test('pairing a different bike replaces the remembered one (L2-015 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await bluetooth.offer(OTHER_BIKE);
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();
    await expect.poll(() => bluetooth.log()).toEqual(INITIALISED);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);

    await expect
      .poll(() => bluetooth.remembered())
      .toEqual({ id: 'the-other-bike', name: 'Echelon EX-3' });
    // Connect Bike leads on to The Class, with the new bike still connected: no second pairing, no chooser again.
    const theClass = new TheClassPage(page);
    await expect(theClass.bike).toHaveAccessibleName('Echelon EX-3 connected · Change');
    expect(theClass.url()).toBe('/');
    expect(bluetooth.requests()).toHaveLength(1);
    expect(bluetooth.log().filter((line) => !line.endsWith(KEEPALIVE))).toEqual(INITIALISED);
  });
});
