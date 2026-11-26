// Acceptance test
// Traces to: L2-008 AC2, AC3, AC4; L2-009 AC1, AC3; L2-010 AC1, AC2, AC3; L2-018
// Description: The Class in a blocked browser (docs/mocks/pages/the-class/needs-chromium, link-copied and
// needs-https). A rider who paired a bike before opens The Class in a browser that cannot reach the bike: an alert
// under the header says why and offers the one thing that helps, the start button is disabled, the rest of the screen
// works, and the ride's address opens The Class.
//
// Given a browser without Web Bluetooth on a secure page, when The Class opens, then an alert under the header reads
// "Open Telo Ride 1 in Chrome or Edge." with its line and Copy link.
// Given that alert, when the rider presses Copy link, then the page's address is copied and the button reads "Copied"
// for two seconds.
// Given a page on plain http, when The Class opens, then the alert reads "Open the secure version of this page." with
// its line and Open over HTTPS, a link to the same address on https.
// Given either, when The Class shows, then the header reads "No bike · Connect", the start button reads "Connect your
// bike" and is disabled, with its line; the video, "What the bike will do" and the choice of how to ride work.
// Given either, when the ride's address is opened, then The Class opens instead and nothing is asked of Bluetooth.
// Given a supported browser on a secure page, when any screen opens, then neither alert shows.
import { connectBike } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';
import { ClassRidePage } from './pages/class-ride.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { NotFoundPage } from './pages/not-found.page';
import { TheClassPage } from './pages/the-class.page';

const CHROMIUM = {
  icon: 'browser',
  title: 'Open Telo Ride 1 in Chrome or Edge.',
  body: 'Bluetooth to the bike only works there — you can look around, but not ride.',
  action: 'Copy link',
};
const HTTPS = {
  icon: 'lock',
  title: 'Open the secure version of this page.',
  body: 'Bluetooth is blocked on plain http, so the bike can’t connect.',
  action: 'Open over HTTPS',
};

/** The two ways a browser is blocked (L2 glossary), each with the alert The Class shows for it. */
const blocked = [
  {
    name: 'a browser without Web Bluetooth',
    block: (bluetooth: FakeBluetooth) => bluetooth.remove(),
    alert: CHROMIUM,
  },
  {
    name: 'a page on plain http',
    block: (bluetooth: FakeBluetooth) => bluetooth.servePlainHttp(),
    alert: HTTPS,
  },
] as const;

/** The windows the design draws The Class in, and 1024 × 768, the smallest the one-screen layout fits. */
const windows = [
  { width: 1024, height: 768 },
  { width: 1194, height: 834 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 834, height: 1194 },
] as const;

test.describe('The Class in a blocked browser', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test(
    'a browser without Web Bluetooth: an alert under the header sends the rider to Chrome or Edge, with Copy link, and the class stays readable (L2-008 AC2)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.remove();
      const theClass = new TheClassPage(page);
      await theClass.open();

      await expect(theClass.notice).toHaveRole('alert');
      await expect(theClass.alerts).toHaveCount(1);
      await expect(theClass.noticeIcon).toHaveAttribute('data-icon', CHROMIUM.icon);
      await expect(theClass.noticeTitle).toHaveText(CHROMIUM.title);
      await expect(theClass.noticeBody).toHaveText(CHROMIUM.body);
      await expect(theClass.noticeAction).toHaveText('Copy link');
      await expect(theClass.noticeAction).toHaveRole('button');
      await expect(theClass.notice).toHaveText(
        `${CHROMIUM.title} ${CHROMIUM.body} ${CHROMIUM.action}`,
        { useInnerText: true },
      );

      // Under the header and over the class, which is all still there.
      const notice = await theClass.box(theClass.notice);
      expect(notice.top).toBeGreaterThanOrEqual((await theClass.box(theClass.header.root)).bottom);
      expect(notice.bottom).toBeLessThanOrEqual((await theClass.box(theClass.main)).top);
      await expect(theClass.title).toHaveText('Intervals to the Beat');
      await expect(theClass.duration).toHaveText('20:00');
      await expect(theClass.planWatts).toHaveText('~254 W average');
      await theClass.videoSettled();
      expect(theClass.url()).toBe('/');
      expect(bluetooth.requests()).toEqual([]);
    },
  );

  test('Copy link copies the page’s address and reads "Copied" for two seconds (L2-008 AC3)', async ({
    page,
    bluetooth,
    clipboard,
  }) => {
    await bluetooth.remove();
    await page.clock.install();
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.noticeAction).toHaveText('Copy link');
    await expect(theClass.noticeAction).not.toHaveAttribute('data-copied');
    expect(await clipboard.copied()).toEqual([]);

    // On a paused clock, stepped by hand: the screen draws on a timer, so each read steps a millisecond first.
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    let elapsed = 0;
    const step = async (milliseconds: number): Promise<void> => {
      await page.clock.runFor(milliseconds);
      elapsed += milliseconds;
    };
    const words = async (): Promise<string> => {
      await step(1);
      return (await theClass.noticeAction.innerText()).trim();
    };

    await theClass.noticeAction.click();

    await expect.poll(words).toBe('Copied');
    await expect(theClass.noticeAction).toHaveAttribute('data-copied', '');
    await expect(theClass.noticeAction).toHaveRole('button');
    expect(await clipboard.copied()).toEqual([theClass.address()]);
    expect(theClass.address()).toMatch(/^http:\/\/localhost:\d+\/$/);
    // The alert still says why, and it is still the one alert.
    await expect(theClass.noticeTitle).toHaveText(CHROMIUM.title);
    await expect(theClass.alerts).toHaveCount(1);

    // Still "Copied" a moment before two seconds are up, and "Copy link" again a moment after.
    await step(1900 - elapsed);
    expect(await words()).toBe('Copied');
    await step(2010 - elapsed);
    await expect.poll(words).toBe('Copy link');
    expect(elapsed).toBeLessThan(2100);
    await expect(theClass.noticeAction).not.toHaveAttribute('data-copied');
  });

  test('Copy link by keyboard: Tab reaches it after the header, Enter copies, and the disabled start button takes no stop (L2-008 AC3, L2-010 AC1)', async ({
    page,
    bluetooth,
    clipboard,
  }) => {
    await bluetooth.remove();
    const theClass = new TheClassPage(page);
    await theClass.open();
    await theClass.videoSettled();

    expect(await theClass.tabStops()).toEqual([
      'Skip to content',
      'No bike · Connect',
      'Full screen',
      'Copy link',
      'Class video',
    ]);

    await theClass.tabTo(theClass.noticeAction);
    await page.keyboard.press('Enter');

    await expect(theClass.noticeAction).toHaveText('Copied');
    expect(await clipboard.copied()).toEqual([theClass.address()]);
    await expect(theClass.noticeAction).toBeFocused();
  });

  test('a browser that refuses to copy leaves "Copy link" as it was, with no error (L2-008 AC3)', async ({
    page,
    bluetooth,
    clipboard,
  }) => {
    await bluetooth.remove();
    const theClass = new TheClassPage(page);
    await theClass.open();
    await clipboard.refuse();

    await theClass.noticeAction.click();

    // The class is still drawn and can still be used, and the button never said "Copied".
    await theClass.ibiza.click();
    await expect(theClass.still).toBeVisible();
    await expect(theClass.noticeAction).toHaveText('Copy link');
    await expect(theClass.noticeAction).not.toHaveAttribute('data-copied');
    expect(await clipboard.copied()).toEqual([]);
  });

  test('a page on plain http: the alert offers the same address over HTTPS, not another browser (L2-009 AC1)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.servePlainHttp();
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.notice).toHaveRole('alert');
    await expect(theClass.alerts).toHaveCount(1);
    await expect(theClass.noticeIcon).toHaveAttribute('data-icon', HTTPS.icon);
    await expect(theClass.noticeTitle).toHaveText(HTTPS.title);
    await expect(theClass.noticeBody).toHaveText(HTTPS.body);
    await expect(theClass.noticeAction).toHaveText('Open over HTTPS');
    await expect(theClass.noticeAction).toHaveRole('link');
    const secure = new URL(theClass.address());
    secure.protocol = 'https:';
    await expect(theClass.noticeAction).toHaveAttribute('href', secure.href);
    await expect(theClass.notice).toHaveText(`${HTTPS.title} ${HTTPS.body} ${HTTPS.action}`, {
      useInnerText: true,
    });
    await expect(theClass.title).toHaveText('Intervals to the Beat');
    expect(bluetooth.requests()).toEqual([]);
  });

  for (const { name, block, alert } of blocked) {
    test(`${name}: the header reads "No bike · Connect", and the start button reads "Connect your bike", is disabled and keeps its line (L2-010 AC1)`, async ({
      page,
      bluetooth,
    }) => {
      await block(bluetooth);
      const theClass = new TheClassPage(page);
      await theClass.open();
      await expect(theClass.noticeTitle).toHaveText(alert.title);

      await expect(theClass.bike).toHaveText('No bike · Connect');
      await expect(theClass.bike).toHaveRole('link');
      await expect(theClass.start).toHaveCount(1);
      await expect(theClass.start).toHaveText('Connect your bike');
      await expect(theClass.start).toHaveRole('button');
      await expect(theClass.start).toBeDisabled();
      await expect(theClass.startHint).toHaveText('The class needs the bike to set resistance.');

      // A press on it goes nowhere.
      await theClass.start.click({ force: true });
      await expect(theClass.title).toHaveText('Intervals to the Beat');
      expect(theClass.url()).toBe('/');

      // The header's link still leads to Connect Bike, which says why in its own words.
      await theClass.bike.click();
      const connect = new ConnectBikePage(page);
      await expect(connect.title).toBeVisible();
      await expect(connect.blocker).toHaveCount(1);
      expect(bluetooth.requests()).toEqual([]);
    });

    test(`${name}: the video, "What the bike will do" and the choice of how to ride work as they do anywhere (L2-010 AC3)`, async ({
      page,
      bluetooth,
    }) => {
      await block(bluetooth);
      const theClass = new TheClassPage(page);
      await theClass.open();
      await expect(theClass.noticeTitle).toHaveText(alert.title);

      // The video is parked in its box, over the class cover.
      await theClass.videoSettled();
      await expect(theClass.cover).toBeVisible();
      await expect(theClass.player).toBeVisible();
      await expect(theClass.planTitle).toBeVisible();
      await expect(theClass.planWatts).toHaveText('~254 W average');
      await expect(theClass.profileBars).toHaveCount(33);
      await expect(theClass.planNote).toHaveText(
        '17 efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal.',
      );

      await expect(theClass.classVideo).toBeChecked();
      await theClass.ibiza.click();
      await expect(theClass.ibiza).toBeChecked();
      await expect(theClass.still).toBeVisible();

      // The choice is kept, as in any browser, and the alert and the disabled button are still there.
      await page.reload();
      await expect(theClass.ibiza).toBeChecked();
      await expect(theClass.still).toBeVisible();
      await expect(theClass.noticeTitle).toHaveText(alert.title);
      await expect(theClass.start).toBeDisabled();
    });

    test(`${name}: the ride’s address opens The Class instead, and nothing is asked of Bluetooth (L2-010 AC2)`, async ({
      page,
      bluetooth,
    }) => {
      await block(bluetooth);
      const theClass = new TheClassPage(page);

      await theClass.openRide();

      await expect(theClass.title).toHaveText('Intervals to the Beat');
      await expect(theClass.noticeTitle).toHaveText(alert.title);
      await expect(theClass.start).toBeDisabled();
      expect(theClass.url()).toBe('/');
      await expect(new ClassRidePage(page).clock).toHaveCount(0);
      expect(bluetooth.requests()).toEqual([]);
      expect(bluetooth.log()).toEqual([]);
    });

    test(`${name}: page not found works as it does anywhere, and "Back to the class" opens The Class (L2-010 AC3)`, async ({
      page,
      bluetooth,
    }) => {
      await block(bluetooth);
      const notFound = new NotFoundPage(page);
      await notFound.open('/no-such-page');

      await expect(notFound.heading).toHaveText('This page doesn’t exist.');
      await notFound.backToClass.click();

      const theClass = new TheClassPage(page);
      await expect(theClass.title).toHaveText('Intervals to the Beat');
      await expect(theClass.noticeTitle).toHaveText(alert.title);
    });

    for (const { width, height } of windows) {
      test(`${name} at ${width} × ${height}: the alert runs the width of the window under the header, its action whole and within reach of a thumb (L2-139, L2-140)`, async ({
        page,
        bluetooth,
      }) => {
        await page.setViewportSize({ width, height });
        await block(bluetooth);
        const theClass = new TheClassPage(page);
        await theClass.open();
        await expect(theClass.noticeTitle).toHaveText(alert.title);
        await theClass.videoSettled();

        const header = await theClass.box(theClass.header.root);
        const notice = await theClass.box(theClass.notice);
        const action = await theClass.box(theClass.noticeAction);
        const main = await theClass.box(theClass.main);
        expect(notice.left).toBe(0);
        expect(notice.right).toBe(width);
        expect(notice.top).toBeCloseTo(header.bottom, 0);
        expect(main.top).toBeGreaterThanOrEqual(notice.bottom - 0.5);
        expect(action.left).toBeGreaterThanOrEqual(notice.left);
        expect(action.right).toBeLessThanOrEqual(notice.right);
        expect(action.top).toBeGreaterThanOrEqual(notice.top);
        expect(action.bottom).toBeLessThanOrEqual(notice.bottom);
        // From sm the words and the action share a line; on a phone the action sits under the words.
        const text = await theClass.box(theClass.noticeBody);
        if (width >= 640) expect(action.left).toBeGreaterThanOrEqual(text.right - 0.5);
        else expect(action.top).toBeGreaterThanOrEqual(text.bottom - 0.5);

        expect(await theClass.sidewaysOverflow()).toBe(0);
        expect(await new AppDocument(page).untappable(44)).toEqual([]);
      });
    }
  }

  test('Bluetooth switched off is not a blocked browser: no alert, and the start button opens Connect Bike, which says so (L2-018, L2-084 AC6)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.adapterOff();
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.start).toHaveText('Connect your bike');
    await expect(theClass.start).toBeEnabled();
    await expect(theClass.notice).toHaveCount(0);
    await expect(theClass.alerts).toHaveCount(0);

    await theClass.start.click();

    await expect(new ConnectBikePage(page).blockerTitle).toHaveText('Bluetooth is off');
  });

  test(
    'a supported browser on a secure page shows neither alert: on The Class with and without the bike, on the class ride and on page not found (L2-008 AC4, L2-009 AC3)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      const theClass = new TheClassPage(page);
      await theClass.open();

      await expect(theClass.start).toHaveText('Connect your bike');
      await expect(theClass.start).toBeEnabled();
      await expect(theClass.notice).toHaveCount(0);
      await expect(theClass.alerts).toHaveCount(0);

      await connectBike(bluetooth);
      await expect(theClass.start).toHaveText('Start class');
      await expect(theClass.notice).toHaveCount(0);

      await theClass.start.click();
      await expect(new ClassRidePage(page).name).toContainText('Intervals to the Beat');
      await expect(theClass.notice).toHaveCount(0);

      const notFound = new NotFoundPage(page);
      await notFound.open('/no-such-page');
      await expect(notFound.heading).toHaveText('This page doesn’t exist.');
      await expect(theClass.notice).toHaveCount(0);
      await expect(theClass.alerts).toHaveCount(0);
    },
  );
});
