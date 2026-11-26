// Acceptance test
// Traces to: L2-172 AC1, AC2, AC3; L2-010 AC1
// Description: every screen's header carries the wordmark TELO RIDE 1, the Telo lockup with "RIDE 1" in the signal
// colour, one image named "Telo Ride 1" for a screen reader; every document title and message that names the product
// says "Telo Ride 1"; and only the class ride below 384 px hides the words and keeps the mark.
import { startClassRide } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { openClassDone, soloClass } from './fixtures/class-done';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { NotFoundPage } from './pages/not-found.page';
import { ClassDonePage } from './pages/class-done.page';
import { Wordmark } from './pages/wordmark';

/** `--color-volt-fg`, the signal as text on the dark theme (L2-143 AC2). */
const SIGNAL = 'rgb(255, 82, 51)';

/** The header reads TELO RIDE 1, with RIDE 1 in the signal colour, as one image named "Telo Ride 1". */
async function expectWordmark(wordmark: Wordmark): Promise<void> {
  await expect(wordmark.lockup).toHaveCount(1);
  await expect(wordmark.lockup).toHaveAttribute('role', 'img');
  await expect(wordmark.lockup).toHaveAccessibleName('Telo Ride 1');
  await expect(wordmark.words).toHaveText(/^TELO\s*RIDE 1$/, { useInnerText: true });
  await expect(wordmark.product).toHaveText('RIDE 1', { useInnerText: true });
  expect(await wordmark.productColour()).toBe(SIGNAL);
}

test.describe('Wordmark', () => {
  test('Connect Bike carries TELO RIDE 1, and its title and lead say "Telo Ride 1" (L2-172 AC1, AC2) @critical', async ({
    page,
  }) => {
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.title).toHaveText('Connect your bike');

    await expectWordmark(new Wordmark(page));
    await expect(page).toHaveTitle('Connect your bike · Telo Ride 1');
    await expect(connect.lead).toHaveText(
      'Pedal once to wake it up. Telo Ride 1 reads your power and sets resistance for every hill and interval.',
    );
  });

  test('the class at `/` carries TELO RIDE 1, and its title is "Telo Ride 1" (L2-172 AC1, AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const start = new TheClassPage(page);
    await start.open();
    await expect(start.title).toBeVisible();

    await expectWordmark(new Wordmark(page));
    await expect(page).toHaveTitle('Telo Ride 1');
  });

  test('the class ride carries TELO RIDE 1, and its title says "Telo Ride 1" (L2-172 AC1, AC2)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);

    await expectWordmark(new Wordmark(page));
    await expect(page).toHaveTitle('Class ride · Telo Ride 1');
  });

  test('Class Done carries TELO RIDE 1, and its title says "Telo Ride 1" (L2-172 AC1, AC2)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await openClassDone(page, soloClass());
    await expect(new ClassDonePage(page).time).toHaveText('20:00');

    await expectWordmark(new Wordmark(page));
    await expect(page).toHaveTitle('Class Done · Telo Ride 1');
  });

  test('page not found carries TELO RIDE 1, and its title says "Telo Ride 1" (L2-172 AC1, AC2)', async ({
    page,
  }) => {
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');
    await expect(notFound.heading).toBeVisible();

    await expectWordmark(new Wordmark(page));
    await expect(page).toHaveTitle('Page not found · Telo Ride 1');
  });

  test('below 384 px only the class ride hides the words; the mark keeps the name (L2-172 AC3)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await page.setViewportSize({ width: 383, height: 800 });
    const wordmark = new Wordmark(page);
    await bluetooth.remember(echelonBike);
    const start = new TheClassPage(page);
    await start.open();
    await expect(start.title).toBeVisible();
    await expect(wordmark.words).toBeVisible();
    await expect(wordmark.product).toHaveText('RIDE 1', { useInnerText: true });

    await startClassRide(page, bluetooth, api);
    await expect(wordmark.lockup).toBeVisible();
    await expect(wordmark.lockup).toHaveAccessibleName('Telo Ride 1');
    await expect(wordmark.words).toBeHidden();

    await page.setViewportSize({ width: 384, height: 800 });
    await expect(wordmark.words).toBeVisible();
  });
});
