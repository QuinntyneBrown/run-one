// Acceptance test
// Traces to: L2-019 AC1 to AC5
// Description: The Class's header carries the bike status as a link to Connect Bike. With no connected bike it reads
// "No bike · Connect" with the Bluetooth-off icon; once the bike connects it reads the bike's name, "connected" and
// "· Change" with the Bluetooth icon, within a second, and goes back within a second of the bike dropping. On a phone
// "· Change" is hidden from sight but still read, and the link is 44 px tall.
import { ECHELON_NOTIFY, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { TheClassPage } from './pages/the-class.page';

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];

test.describe('Bike status in the header', () => {
  test(
    'reads "No bike · Connect" until the bike connects, then its name, "connected" and "· Change", and follows a bike that drops (L2-019 AC1, AC2, AC5)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.remember(echelonBike);
      const theClass = new TheClassPage(page);
      await theClass.open();

      await expect(theClass.bike).toHaveAccessibleName('No bike · Connect');
      await expect(theClass.bikeIcon).toHaveClass(/the-class__bike-icon--off/);

      await expect.poll(() => bluetooth.writes().length).toBe(3);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);

      await expect(theClass.bike).toHaveAccessibleName('Echelon EX-5s connected · Change', {
        timeout: 1000,
      });
      // A different icon, so colour is not the only difference (AC2).
      await expect(theClass.bikeIcon).not.toHaveClass(/the-class__bike-icon--off/);

      await bluetooth.drop();
      await expect(theClass.bike).toHaveAccessibleName('No bike · Connect', { timeout: 1000 });
      await expect(theClass.bikeIcon).toHaveClass(/the-class__bike-icon--off/);
    },
  );

  test('opens Connect Bike (L2-019 AC3)', async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    const theClass = new TheClassPage(page);
    await theClass.open();

    await theClass.bike.click();

    await expect(page).toHaveURL('/connect');
    await expect(new ConnectBikePage(page).title).toBeVisible();
  });

  test('on a phone hides "· Change" from sight but not from a screen reader, in a link 44 px tall (L2-019 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bluetooth.remember(echelonBike);
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect.poll(() => bluetooth.writes().length).toBe(3);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);

    await expect(theClass.bike).toHaveAccessibleName('Echelon EX-5s connected · Change');
    await expect(theClass.bike).toBeVisible();
    expect(await theClass.width(theClass.bikeAction)).toBeLessThanOrEqual(1);
    expect(await theClass.height(theClass.bike)).toBeGreaterThanOrEqual(44);

    await page.setViewportSize({ width: 1024, height: 768 });
    expect(await theClass.width(theClass.bikeAction)).toBeGreaterThan(1);
  });
});
