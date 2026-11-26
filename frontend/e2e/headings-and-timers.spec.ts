// Acceptance test
// Traces to: L2-141 AC1, AC2, AC5
// Description: every screen has exactly one `h1`, in the words the requirement names; the ride's clock is a `timer`
// outside any live region, so it is not read out every second; and the resistance profile is one named image.
//
// Given each screen, when it opens, then it has one h1 reading: the class's title (The Class), "Connect your bike",
// "This page doesn’t exist.", the verdict (Class Done) and the visually hidden heading on Class Ride.
// Given a running ride, then its clock has role "timer" and no ancestor or itself is a live region.
// Given The Class, then its resistance profile is one image with a name and the page holds no list of its bars.
import { screens } from './fixtures/screens';
import { echelonBike } from './fixtures/echelon';
import { startClassRide } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { TheClassPage } from './pages/the-class.page';

const HEADINGS: Record<string, string | RegExp> = {
  'The Class': 'Intervals to the Beat',
  'Connect Bike': 'Connect your bike',
  'Page not found': 'This page doesn’t exist.',
  'Class Done': /\S/,
  'a class ride': /Intervals to the Beat/,
};

test.describe('One heading a screen', () => {
  for (const [screen, open] of Object.entries(screens)) {
    test(`${screen} has one h1 (L2-141 AC1)`, async ({ page, bluetooth, api }) => {
      const shown = await open({ page, bluetooth, api });
      await expect(shown).toBeAttached();
      await expect(page.locator('main')).toBeAttached();

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(HEADINGS[screen]);
    });
  }
});

test('the ride’s clock is a timer outside any live region (L2-141 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  const timer = page.getByRole('timer');
  await expect(timer.first()).toBeVisible();
  await expect(ride.clock).toBeVisible();

  const live = await timer.evaluateAll((all) =>
    all.map(
      (element) =>
        element.closest('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"]') !==
        null,
    ),
  );
  expect(live.length).toBeGreaterThan(0);
  expect(live).not.toContain(true);
});

test('the resistance profile is one named image, not a list of bars (L2-141 AC5)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const home = new TheClassPage(page);
  await home.open();
  await expect(home.profile).toBeVisible();

  await expect(home.profile).toHaveAccessibleName('Resistance profile');
  await expect(home.profile.getByRole('listitem')).toHaveCount(0);
});
