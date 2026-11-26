// Acceptance test
// Traces to: L2-007 AC1, AC4; L2-011 AC1 to AC6; L2-012 AC1 to AC3; L2-013 AC1, AC2, AC4; L2-014 AC1
// Description: Connect Bike as designed (docs/mocks/pages/connect-bike/): at rest it has the wordmark and Full screen
// above its content, the photo, the title, the lead, the offered bike with no identifier, the pair button and the
// works-with list, and nothing else; while the browser's list of bikes is open it searches; the bike picked there is
// named as text and paired; and half a second after the check The Class opens with the bike connected.
//
// Given a new rider on Connect Bike, when nothing has been pressed, then the screen is at rest as `default.html`.
// Given the rider presses the pair button, by touch or by keyboard, when the chooser is open, then the card searches.
// Given the rider picks a bike, when pairing runs, then the card names the bike and the button is busy.
// Given the bike's first notification, when pairing succeeds, then the card has a check, and The Class opens.
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  ECHELON_SERVICE,
  echelonBike,
} from './fixtures/echelon';
import { INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME, ftmsBike } from './fixtures/ftms';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { Wordmark } from './pages/wordmark';

const FTMS = 0x1826;
/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];
const LEAD =
  'Pedal once to wake it up. Telo Ride 1 reads your power and sets resistance for every hill and interval.';

test.describe('Connect Bike', () => {
  test(
    'at rest: the wordmark and Full screen above the content, the offered bike, the pair button and the works-with list, and nothing else (L2-011 AC1, AC3; L2-007 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      const connect = new ConnectBikePage(page);
      await connect.open();

      await expect(new Wordmark(page).lockup).toHaveAccessibleName('Telo Ride 1');
      await expect(connect.fullScreen).toBeVisible();
      await expect(connect.navigation).toHaveCount(0);
      await expect(connect.photo).toHaveAccessibleName('An Echelon EX-5s bike');
      await expect(connect.title).toHaveText('Connect your bike');
      await expect(connect.lead).toHaveText(LEAD);
      await expect(connect.deviceName).toHaveText('Echelon EX-5s');
      await expect(connect.deviceIdentifier).toHaveCount(0);
      await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
      await expect(connect.pairButton).toBeEnabled();
      await expect(connect.pairButton).not.toHaveAttribute('aria-busy');
      await expect(connect.worksWithBikes).toHaveText([
        'Echelon EX-5s',
        'Echelon EX-3',
        'Echelon EX-8s',
        'Echelon Connect Sport',
        'Other FTMS smart bikes',
      ]);
      await expect(connect.worksWithStatuses).toHaveText([
        'Full control',
        'Full control',
        'Full control',
        'Full control',
        'Beta',
      ]);
      // The header is above the content, not part of it, and the content is the title, the lead, the card, the
      // button and the list: no hint and no other words.
      expect(await connect.headerInMain()).toBe(false);
      await expect(connect.content).toHaveText(
        [
          'Connect your bike',
          LEAD,
          'Echelon EX-5s',
          'Pair Echelon EX-5s',
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
        ].join(' '),
        { useInnerText: true },
      );
      // Nothing was asked of Bluetooth without the rider's press (L2-012 AC2).
      expect(bluetooth.requests()).toEqual([]);
    },
  );

  test('from lg it is two columns, the photo on the left, centred under the header in a 64 rem body (L2-011 AC6)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.pairButton).toBeVisible();

    const { photo, content, body, headerBottom } = await connect.layout();

    expect(photo.x + photo.width).toBeLessThan(content.x);
    expect(Math.round(photo.width)).toBe(Math.round(photo.height));
    expect(Math.round(photo.width)).toBe(Math.round(content.width));
    expect(body.width).toBeLessThanOrEqual(1024);
    // The photo and the content share the middle of the space under the header.
    const middle = (headerBottom + 900) / 2;
    expect(Math.abs(photo.y + photo.height / 2 - (content.y + content.height / 2))).toBeLessThan(2);
    expect(Math.abs(photo.y + photo.height / 2 - middle)).toBeLessThan(40);
  });

  for (const width of [390, 768, 1023]) {
    test(`below lg, at ${width} px, the photo follows the content, square, at up to 28 rem (L2-011 AC6)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const connect = new ConnectBikePage(page);
      await connect.open();
      await expect(connect.pairButton).toBeVisible();

      const { photo, content } = await connect.layout();

      expect(photo.y).toBeGreaterThanOrEqual(content.y + content.height);
      expect(Math.round(photo.width)).toBe(Math.round(photo.height));
      expect(photo.width).toBeLessThanOrEqual(448);
      expect(Math.round(photo.x)).toBe(Math.round(content.x));
    });
  }

  test('while the chooser is open the card searches, and the bike picked is named as text (L2-011 AC2, AC3; L2-012 AC1)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(echelonBike);
    await bluetooth.holdChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect(connect.searching).toHaveText('Looking for bikes nearby…');
    await expect(connect.searching).toHaveRole('status');
    await expect(connect.deviceName).toHaveCount(0);
    await expect(connect.pairButton).toHaveText('Searching…');
    await expect(connect.pairButton).toBeDisabled();
    // Searching is not pairing: only the pairing button is busy, as the mocks draw the two.
    await expect(connect.pairButton).not.toHaveAttribute('aria-busy');
    await expect(connect.pairSpinner).toHaveCount(0);
    expect(bluetooth.requests()).toEqual([
      {
        filters: [{ services: [ECHELON_SERVICE] }, { services: [FTMS] }, { namePrefix: 'ECH' }],
        optionalServices: [ECHELON_SERVICE, FTMS],
      },
    ]);
    expect(bluetooth.log()).toEqual([]);

    await bluetooth.pickFromChooser();

    await expect(connect.searching).toHaveCount(0);
    await expect(connect.deviceName).toHaveText('Echelon EX-5s');
    await expect(connect.deviceIdentifier).toHaveText('EX5S-141844');
  });

  test('the pair button opens the chooser from the keyboard, and a closed chooser returns to rest (L2-012 AC1, AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.holdChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pairByKeyboard();

    await expect(connect.pairButton).toHaveText('Searching…');
    expect(bluetooth.requests()).toHaveLength(1);

    await bluetooth.closeChooser();

    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
    await expect(connect.pairButton).toBeEnabled();
    await expect(connect.deviceName).toHaveText('Echelon EX-5s');
    await expect(connect.deviceIdentifier).toHaveCount(0);
    await expect(connect.blocker).toHaveCount(0);
  });

  test('while pairing runs the card names the bike and the button is busy with a spinner (L2-011 AC4; L2-013 AC1, AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect(connect.pairButton).toHaveText('Pairing…');
    await expect(connect.pairButton).toBeDisabled();
    await expect(connect.pairButton).toHaveAttribute('aria-busy', 'true');
    await expect(connect.pairSpinner).toBeVisible();
    await expect(connect.deviceName).toHaveText('Echelon EX-5s');
    await expect(connect.deviceIdentifier).toHaveText('EX5S-141844');
    await expect(connect.pairedCheck).toHaveCount(0);
    await expect(connect.worksWith).toBeVisible();
    await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
    // Initialised, but the bike has not answered: still pairing.
    await expect(connect.pairButton).toHaveText('Pairing…');
  });

  test('an FTMS bike is named by its own name, with no identifier (L2-011 AC3; L2-013 AC4; L2-014 AC1)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(ftmsBike);
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect(connect.pairButton).toHaveText('Pairing…');
    await expect(connect.deviceName).toHaveText('KICKR BIKE 1A2B');
    await expect(connect.deviceIdentifier).toHaveCount(0);

    await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);

    await expect(connect.pairedCheck).toBeVisible();
    await expect(connect.deviceName).toHaveText('KICKR BIKE 1A2B');
  });

  test(
    'paired: a check and a disabled "Paired", then half a second later The Class with the bike connected (L2-011 AC5)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.clock.install();
      await bluetooth.offer(echelonBike);
      const connect = new ConnectBikePage(page);
      await connect.open();
      await expect(connect.pairButton).toBeVisible();
      // From here the clock moves only when the spec steps it, so the half second can be counted.
      await page.clock.pauseAt(Date.now() + 60_000);
      let stepped = 0;
      const step = async (ms: number) => {
        await page.clock.runFor(ms);
        stepped += ms;
      };
      await connect.pair();
      await expect
        .poll(async () => {
          await page.clock.runFor(100);
          return bluetooth.log();
        })
        .toEqual(ECHELON_INITIALISED);

      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);

      await expect
        .poll(async () => {
          await step(20);
          return connect.pairedCheck.count();
        })
        .toBe(1);
      await expect(connect.pairedCheck).toBeVisible();
      await expect(connect.deviceName).toHaveText('Echelon EX-5s');
      await expect(connect.deviceIdentifier).toHaveText('EX5S-141844');
      await expect(connect.pairButton).toHaveText('Paired');
      await expect(connect.pairButton).toBeDisabled();
      await expect(connect.pairButton).not.toHaveAttribute('aria-busy');
      await expect(connect.pairSpinner).toHaveCount(0);

      // Still Connect Bike just short of half a second after the bike answered.
      expect(stepped).toBeLessThan(450);
      await step(450 - stepped);
      const start = new TheClassPage(page);
      expect(start.url()).toBe('/connect');
      await expect(connect.pairButton).toHaveText('Paired');

      await expect
        .poll(async () => {
          await page.clock.runFor(50);
          return start.url();
        })
        .toBe('/');
      await expect
        .poll(async () => {
          await page.clock.runFor(50);
          return (await start.header.bike.textContent())?.trim();
        })
        .toBe('Echelon EX-5s connected\u00a0· Change');
    },
  );
});
