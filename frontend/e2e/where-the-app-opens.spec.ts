// Acceptance test
// Traces to: L2-167 AC1 to AC3; L2-145 AC2
// Description: the app opens where the rider belongs. A new rider, with no remembered bike and no finished ride,
// opens on Connect Bike and never sees The Class on the way; in a blocked browser Connect Bike says why the bike cannot
// be reached. A rider with a remembered bike opens on The Class and never sees Connect Bike, whether or not the bike
// is connected, and still reaches Connect Bike at `/connect` from the bike status. A rider with a finished ride and
// no bike has no record to show until slice 32.1; the guard's unit test covers that row.
//
// Given a new rider, when the app opens at `/`, then Connect Bike opens and The Class is never drawn.
// Given a new rider in a browser without Web Bluetooth, or on plain http, when the app opens at `/`, then Connect
// Bike opens with the alert that says why.
// Given a rider with a remembered bike, when the app opens at `/`, then The Class opens and Connect Bike is never
// drawn, with the bike connected or switched off.
import { ECHELON_NOTIFY, echelonBike, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { FirstScreen } from './pages/first-screen';
import { NotFoundPage } from './pages/not-found.page';
import { TheClassPage } from './pages/the-class.page';

const WINDOWS = [
  { name: 'a phone', width: 390, height: 844 },
  { name: 'a tablet in portrait', width: 768, height: 1024 },
  { name: 'a tablet in landscape', width: 1024, height: 768 },
  { name: 'a desktop', width: 1440, height: 900 },
];

test.describe('Where the app opens: a new rider', () => {
  for (const { name, width, height } of WINDOWS) {
    test(
      `opens on Connect Bike and never sees The Class, on ${name} (L2-167 AC1)`,
      { tag: width === 390 ? '@critical' : [] },
      async ({ page, bluetooth }) => {
        await page.setViewportSize({ width, height });
        const screens = await FirstScreen.watch(page);
        const theClass = new TheClassPage(page);

        await theClass.open();

        const connect = new ConnectBikePage(page);
        await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
        expect(theClass.url()).toBe('/connect');
        expect(await screens.drawn()).toEqual(['Connect Bike']);
        // Nothing is asked of Bluetooth until the rider presses Pair.
        expect(bluetooth.requests()).toEqual([]);
        expect(bluetooth.log()).toEqual([]);
      },
    );
  }

  test('in a browser without Web Bluetooth, opens on Connect Bike with its alert (L2-167 AC3, L2-008 AC1)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remove();
    const screens = await FirstScreen.watch(page);
    const theClass = new TheClassPage(page);

    await theClass.open();

    const connect = new ConnectBikePage(page);
    await expect(connect.blockerTitle).toHaveText("This browser can't reach the bike");
    await expect(connect.blockerAction).toHaveText('Try again');
    await expect(connect.pairArea).toHaveCount(0);
    expect(theClass.url()).toBe('/connect');
    expect(await screens.drawn()).toEqual(['Connect Bike']);
  });

  test('on plain http, opens on Connect Bike with its alert (L2-167 AC3, L2-009 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.servePlainHttp();
    const screens = await FirstScreen.watch(page);
    const theClass = new TheClassPage(page);

    await theClass.open();

    const connect = new ConnectBikePage(page);
    await expect(connect.blockerTitle).toHaveText('Open the secure version of this page');
    await expect(connect.blockerAction).toHaveText('Open over HTTPS');
    await expect(connect.pairArea).toHaveCount(0);
    expect(theClass.url()).toBe('/connect');
    expect(await screens.drawn()).toEqual(['Connect Bike']);
  });

  test('“Back to the class” on page not found opens Connect Bike too (L2-145 AC2)', async ({
    page,
  }) => {
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');

    await notFound.backToClass.focus();
    await page.keyboard.press('Enter');

    await expect(new ConnectBikePage(page).pairButton).toBeVisible();
    expect(new TheClassPage(page).url()).toBe('/connect');
  });
});

test.describe('Where the app opens: a rider with a remembered bike', () => {
  for (const { name, width, height } of WINDOWS) {
    test(
      `opens on The Class and never sees Connect Bike, on ${name} (L2-167 AC2)`,
      { tag: width === 1440 ? '@critical' : [] },
      async ({ page, bluetooth }) => {
        await page.setViewportSize({ width, height });
        await bluetooth.remember(echelonBike);
        const screens = await FirstScreen.watch(page);
        const theClass = new TheClassPage(page);

        await theClass.open();

        await expect(theClass.title).toHaveText('Intervals to the Beat');
        // The bike has not answered yet: The Class is there all the same.
        await expect(theClass.bike).toHaveAccessibleName('No bike · Connect');
        await expect(theClass.start).toHaveText('Connect your bike');
        await expect.poll(() => bluetooth.writes().length).toBe(3);
        await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
        await expect(theClass.bike).toHaveAccessibleName('Echelon EX-5s connected · Change');
        await expect(theClass.start).toHaveText('Start class');
        expect(theClass.url()).toBe('/');
        expect(await screens.drawn()).toEqual(['The Class']);
        expect(bluetooth.requests()).toEqual([]);
      },
    );
  }

  test('opens on The Class with the bike switched off (L2-167 AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await bluetooth.switchOff();
    const screens = await FirstScreen.watch(page);
    const theClass = new TheClassPage(page);

    await theClass.open();

    await expect(theClass.title).toHaveText('Intervals to the Beat');
    await expect(theClass.bike).toHaveAccessibleName('No bike · Connect');
    await expect(theClass.start).toHaveText('Connect your bike');
    expect(theClass.url()).toBe('/');
    expect(await screens.drawn()).toEqual(['The Class']);
  });

  test('still reaches Connect Bike from the bike status and from the start button, by keyboard (L2-019 AC3, L2-084 AC6)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await bluetooth.switchOff();
    const theClass = new TheClassPage(page);
    const connect = new ConnectBikePage(page);
    await theClass.open();

    await theClass.bike.focus();
    await page.keyboard.press('Enter');
    await expect(connect.pairButton).toBeVisible();
    expect(theClass.url()).toBe('/connect');

    await theClass.open();
    await theClass.start.focus();
    await page.keyboard.press('Enter');
    await expect(connect.pairButton).toBeVisible();
    expect(theClass.url()).toBe('/connect');
  });
});
