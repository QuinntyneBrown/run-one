// Acceptance test
// Traces to: L2-008 AC1, AC4; L2-009 AC3, AC4; L2-012 AC4; L2-018 AC1 to AC3; L2-007 AC1
// Description: when Connect Bike cannot reach the bike it says why (docs/mocks/pages/connect-bike/bluetooth-off,
// unsupported-browser, needs-https, chooser-blocked and chooser-failed): an alert stands in for the device card and
// the pair button, named by its title, with one sentence on the way forward and one action, and the works-with list
// stays. Nothing is asked of Bluetooth until the rider acts.
//
// Given Bluetooth is off, when Connect Bike opens, then the alert says so, and Try again finds it back on.
// Given a browser without Web Bluetooth, when Connect Bike opens, then the alert sends the rider to Chrome or Edge.
// Given a page on plain http, when Connect Bike opens, then the alert offers the same page over HTTPS.
// Given the chooser cannot open, when the rider presses Pair, then the alert says whether a policy blocked it, and
// Try again opens the chooser again.
import { ECHELON_SERVICE } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';
import { ConnectBikePage } from './pages/connect-bike.page';

const FTMS = 0x1826;
const REQUEST = {
  filters: [{ services: [ECHELON_SERVICE] }, { services: [FTMS] }, { namePrefix: 'ECH' }],
  optionalServices: [ECHELON_SERVICE, FTMS],
};
const LEAD =
  'Pedal once to wake it up. Telo Ride 1 reads your power and sets resistance for every hill and interval.';
const WORKS_WITH = [
  'Works with',
  'Echelon EX-5s',
  'Full control',
  'Echelon EX-3',
  'Full control',
  'Echelon EX-8s',
  'Full control',
  'Echelon Connect Sport',
  'Full control',
  'Other FTMS smart bikes',
  'Beta',
];
/** Everything the content column reads when an alert stands in for the card: nothing else is on the screen. */
const content = (title: string, body: string, action: string): string =>
  ['Connect your bike', LEAD, title, body, action, ...WORKS_WITH].join(' ');

const OFF = {
  title: 'Bluetooth is off',
  body: 'Turn on Bluetooth on this computer, then try again.',
};
const UNSUPPORTED = {
  title: "This browser can't reach the bike",
  body: "Open Telo Ride 1 in Chrome or Edge on a laptop or Android tablet. Safari and Firefox don't support Web Bluetooth yet.",
};
const HTTP = {
  title: 'Open the secure version of this page',
  body: 'Bluetooth is blocked on plain http, so the bike can’t connect.',
};
const BLOCKED = {
  title: 'Bluetooth is blocked for this page',
  body: 'Allow Bluetooth for this site in your browser’s settings, then try again.',
};
const FAILED = {
  title: 'The bike list didn’t open',
  body: 'Something went wrong opening your browser’s list of bikes. Try again.',
};

test.describe('Say why the bike cannot be reached', () => {
  test(
    'Bluetooth off: an alert says so in place of the card, never that no bike was found, and Try again finds it back on (L2-018)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.adapterOff();
      const connect = new ConnectBikePage(page);
      await connect.open();

      await expect(connect.blocker).toHaveAccessibleName(OFF.title);
      await expect(connect.blocker).toHaveCount(1);
      await expect(connect.blockerIcon).toHaveAttribute('data-icon', 'bluetooth-off');
      await expect(connect.blockerTitle).toHaveText(OFF.title);
      await expect(connect.blockerBody).toHaveText(OFF.body);
      await expect(connect.blockerAction).toHaveText('Try again');
      await expect(connect.blockerAction).toHaveRole('button');
      await expect(connect.pairArea).toHaveCount(0);
      await expect(connect.deviceName).toHaveCount(0);
      await expect(connect.pairButton).toHaveCount(0);
      // The whole column: no "no bike found", no search and no second message (AC2).
      await expect(connect.content).toHaveText(content(OFF.title, OFF.body, 'Try again'), {
        useInnerText: true,
      });
      expect(bluetooth.requests()).toEqual([]);

      // Still off: Try again leaves the alert where it is.
      await connect.blockerAction.click();
      await expect(connect.blockerTitle).toHaveText(OFF.title);
      await expect(connect.pairButton).toHaveCount(0);

      await bluetooth.adapterOn();
      await connect.pressBlockerAction();

      await expect(connect.blocker).toHaveCount(0);
      await expect(connect.deviceName).toHaveText('Echelon EX-5s');
      await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
      await expect(connect.pairButton).toBeEnabled();
      expect(bluetooth.requests()).toEqual([]);
    },
  );

  test(
    'a browser without Web Bluetooth: an alert sends the rider to Chrome or Edge, with Try again (L2-008 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.remove();
      const connect = new ConnectBikePage(page);
      await connect.open();

      await expect(connect.blocker).toHaveAccessibleName(UNSUPPORTED.title);
      await expect(connect.blockerIcon).toHaveAttribute('data-icon', 'browser');
      await expect(connect.blockerTitle).toHaveText(UNSUPPORTED.title);
      await expect(connect.blockerBody).toHaveText(UNSUPPORTED.body);
      await expect(connect.blockerAction).toHaveText('Try again');
      await expect(connect.blockerAction).toHaveRole('button');
      await expect(connect.pairArea).toHaveCount(0);
      await expect(connect.content).toHaveText(
        content(UNSUPPORTED.title, UNSUPPORTED.body, 'Try again'),
        { useInnerText: true },
      );

      // The same browser: Try again changes nothing.
      await connect.blockerAction.click();
      await expect(connect.blockerTitle).toHaveText(UNSUPPORTED.title);

      await bluetooth.restore();
      await connect.blockerAction.click();

      await expect(connect.blocker).toHaveCount(0);
      await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
    },
  );

  test('plain http: an alert offers the same page over HTTPS, not another browser (L2-009 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.servePlainHttp();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await expect(connect.blocker).toHaveAccessibleName(HTTP.title);
    await expect(connect.blockerIcon).toHaveAttribute('data-icon', 'lock');
    await expect(connect.blockerTitle).toHaveText(HTTP.title);
    await expect(connect.blockerBody).toHaveText(HTTP.body);
    await expect(connect.blockerAction).toHaveText('Open over HTTPS');
    await expect(connect.blockerAction).toHaveRole('link');
    const secure = new URL(page.url());
    secure.protocol = 'https:';
    await expect(connect.blockerAction).toHaveAttribute('href', secure.href);
    await expect(connect.pairArea).toHaveCount(0);
    await expect(connect.content).toHaveText(content(HTTP.title, HTTP.body, 'Open over HTTPS'), {
      useInnerText: true,
    });
  });

  test('a supported browser on a secure page with Bluetooth on shows no alert (L2-008 AC4; L2-009 AC3)', async ({
    page,
  }) => {
    const connect = new ConnectBikePage(page);
    await connect.open();

    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
    await expect(connect.blocker).toHaveCount(0);
  });

  test('a chooser a policy blocks: an alert says how to allow Bluetooth, and Try again opens the chooser again (L2-012 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.blockChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.blocker).toHaveCount(0);

    await connect.pair();

    await expect(connect.blocker).toHaveAccessibleName(BLOCKED.title);
    await expect(connect.blockerIcon).toHaveAttribute('data-icon', 'blocked');
    await expect(connect.blockerTitle).toHaveText(BLOCKED.title);
    await expect(connect.blockerBody).toHaveText(BLOCKED.body);
    await expect(connect.blockerAction).toHaveText('Try again');
    await expect(connect.pairArea).toHaveCount(0);
    await expect(connect.content).toHaveText(content(BLOCKED.title, BLOCKED.body, 'Try again'), {
      useInnerText: true,
    });
    expect(bluetooth.requests()).toEqual([REQUEST]);

    // Still blocked: the alert comes back after the second request.
    await connect.blockerAction.click();
    await expect.poll(() => bluetooth.requests()).toEqual([REQUEST, REQUEST]);
    await expect(connect.blockerTitle).toHaveText(BLOCKED.title);

    await bluetooth.allowChooser();
    await bluetooth.holdChooser();
    await connect.pressBlockerAction();

    await expect(connect.blocker).toHaveCount(0);
    await expect(connect.searching).toHaveText('Looking for bikes nearby…');
    await expect(connect.pairButton).toHaveText('Searching…');
    expect(bluetooth.requests()).toEqual([REQUEST, REQUEST, REQUEST]);

    await bluetooth.closeChooser();

    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
    await expect(connect.blocker).toHaveCount(0);
  });

  test('a chooser that fails for another reason: an alert says the bike list did not open, with Try again (L2-012 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.failChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect(connect.blocker).toHaveAccessibleName(FAILED.title);
    await expect(connect.blockerIcon).toHaveAttribute('data-icon', 'blocked');
    await expect(connect.blockerTitle).toHaveText(FAILED.title);
    await expect(connect.blockerBody).toHaveText(FAILED.body);
    await expect(connect.blockerAction).toHaveText('Try again');
    await expect(connect.pairArea).toHaveCount(0);
    await expect(connect.content).toHaveText(content(FAILED.title, FAILED.body, 'Try again'), {
      useInnerText: true,
    });

    await bluetooth.allowChooser();
    await bluetooth.cancelChooser();
    await connect.blockerAction.click();

    await expect.poll(() => bluetooth.requests()).toEqual([REQUEST, REQUEST]);
    await expect(connect.blocker).toHaveCount(0);
    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
  });

  for (const width of [390, 768, 1024, 1440]) {
    test(`at ${width} px the alert fits the window and a tap within 44 px reaches its action (L2-018 AC1)`, async ({
      page,
      bluetooth,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await bluetooth.adapterOff();
      const connect = new ConnectBikePage(page);
      await connect.open();

      await expect(connect.blockerAction).toBeVisible();
      expect(await new AppDocument(page).untappable(44)).toEqual([]);
      expect(await connect.sidewaysOverflow()).toBe(0);
      const { photo, content: column } = await connect.layout();
      if (width >= 1024) expect(photo.x + photo.width).toBeLessThan(column.x);
      else expect(photo.y).toBeGreaterThanOrEqual(column.y + column.height);
    });
  }
});
