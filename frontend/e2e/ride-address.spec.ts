// Acceptance test
// Traces to: L2-087 AC4; L2-084 AC7; L2-167 AC3; L2-080 AC4
// Description: Class Ride is at `/ride`, and only a rider with a connected bike rides there. The start button on The
// Class opens it, with the class video or in Ibiza. Opened any other way (a bookmark, a typed address, a reload
// mid-ride) there is no connected bike yet, so The Class opens instead and no ride starts. The address Telo Ride gave
// the ride is no screen.
//
// Given a connected bike on The Class, when the rider presses Start class, then Class Ride opens at `/ride` and the
// ride starts at 0:00, with the class video or with Ibiza Sunset Strip chosen.
// Given a rider with a remembered bike, when `/ride` is opened, then The Class opens at `/` and no ride starts, even
// once the bike has connected.
// Given a running ride, when the page is reloaded, then The Class opens and the ride is gone.
// Given a new rider, when `/ride` is opened, then Connect Bike opens.
// Given the address `/classes/intervals-to-the-beat/ride`, when it is opened, then it is page not found.
import { connectBike, startClassRide, startRideInIbiza } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { echelonBike } from './fixtures/echelon';
import { keptRideWith } from './fixtures/how-to-ride';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { ClassRidePage, earlierRideAddress } from './pages/class-ride.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { NotFoundPage } from './pages/not-found.page';
import { TheClassPage } from './pages/the-class.page';

const isTarget = (hex: string): boolean => hex.startsWith('F0 B1 ');

test.describe('The ride’s address', () => {
  test(
    'Start class opens Class Ride at `/ride`, and the ride starts at 0:00 (L2-087 AC4, L2-084 AC7)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      const ride = await startClassRide(page, bluetooth, api);

      expect(ride.url()).toBe('/ride');
      await expect(page).toHaveTitle('Class ride · Telo Ride 1');
      await expect(ride.clock).toHaveText('0:00 / 20:00');
      await expect(ride.heading).toHaveText('Intervals to the Beat · solo class ride');
    },
  );

  test('with Ibiza Sunset Strip chosen, Start class opens `/ride` too (L2-087 AC4, AC6)', async ({
    page,
    bluetooth,
  }) => {
    // The spec is about the address and not the course: its files are held, so nothing is drawn.
    const files = await CourseFiles.install(page);
    files.hold();

    const ride = await startRideInIbiza(page, bluetooth);

    // Class Ride itself, at the ride's address, with no screen before it (L2-175 AC1).
    expect(ride.url()).toBe('/ride');
    await expect(page).toHaveTitle('Class ride · Telo Ride 1');
    await expect(ride.heading).toHaveText('Intervals to the Beat · solo class ride');
    await expect(ride.box).toHaveClass(/class-course/);
    await files.dispose();
  });

  test('opened without a connected bike, `/ride` opens The Class and no ride starts (L2-087 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const ride = new ClassRidePage(page);

    await ride.open();

    const home = new TheClassPage(page);
    await expect(home.title).toHaveText('Intervals to the Beat');
    expect(home.url()).toBe('/');
    await expect(ride.clock).toHaveCount(0);
    // The remembered bike reconnects on The Class, as it does there, and still no ride starts by itself.
    await connectBike(bluetooth);
    await expect(home.start).toHaveText('Start class');
    expect(home.url()).toBe('/');
    expect(
      bluetooth
        .writes()
        .map((write) => write.hex)
        .filter(isTarget),
    ).toEqual([]);
  });

  test('a reload mid-ride opens The Class: the ride is gone (L2-087 AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await page.clock.fastForward('01:00');
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('1:00 / 20:00');

    await page.clock.resume();
    await page.reload();

    const home = new TheClassPage(page);
    await expect(home.title).toHaveText('Intervals to the Beat');
    expect(home.url()).toBe('/');
    await expect(ride.clock).toHaveCount(0);
  });

  test('a new rider who opens `/ride` is sent on to Connect Bike (L2-087 AC4, L2-167 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await new ClassRidePage(page).open();

    await expect(new ConnectBikePage(page).pairButton).toHaveText('Pair Echelon EX-5s');
    expect(new TheClassPage(page).url()).toBe('/connect');
    expect(bluetooth.requests()).toEqual([]);
    expect(bluetooth.log()).toEqual([]);
  });

  test('the address Telo Ride gave the ride is page not found (L2-087 AC4, L2-080 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const notFound = new NotFoundPage(page);

    await notFound.open(earlierRideAddress(theClass.id));

    await expect(notFound.heading).toHaveText('This page doesn’t exist.');
    await expect(new ClassRidePage(page).clock).toHaveCount(0);
    expect(
      bluetooth
        .writes()
        .map((write) => write.hex)
        .filter(isTarget),
    ).toEqual([]);
  });
});
