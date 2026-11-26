// Acceptance test
// Traces to: L2-141 AC2, L2-142 AC2
// Description: a screen reader hears each step of a ride once, as it starts (the class ride's "Work, 0:45"), and the
// result when Class Done opens. With the device asking for reduced motion, nothing on any screen moves but
// an opacity fade: the interval and segment bars jump to their place.
import { startClassRide } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { openClassDone, soloClass } from './fixtures/class-done';
import { screens } from './fixtures/screens';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';

test.describe('Screen readers', () => {
  test('the class ride says each step once, as it starts (L2-141 AC2) @critical', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    const app = new AppDocument(page);

    await page.clock.fastForward('02:30');
    // The live region takes its words a beat after the step (100 ms), so a screen reader hears it as a change.
    await page.clock.runFor(1000);

    await expect(ride.segmentKind).toHaveText('Work');
    await expect(app.announcement).toHaveText('Work, 0:45');
  });

  test('Class Done says the result as it opens (L2-141 AC2)', async ({ page }) => {
    await openClassDone(page, soloClass());

    await expect(new AppDocument(page).announcement).toHaveText(
      'Your best is still 342 kJ. 342 kJ in 20:00.',
    );
  });
});

test.describe('Reduced motion', () => {
  for (const [screen, open] of Object.entries(screens)) {
    test(`nothing on ${screen} moves when the device asks for reduced motion (L2-142 AC2)`, async ({
      page,
      bluetooth,
      api,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(await open({ page, bluetooth, api })).toBeAttached();

      expect(await new AppDocument(page).moving()).toEqual([]);
    });
  }
});
