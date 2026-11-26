// Acceptance test
// Traces to: L2-181 AC1 to AC6; L2-168 AC1
// Description: when the clock reaches 20:00 a banner lies across the video's box, "Finish!" with the output Class Done
// will show and the ride's time, for 3.2 seconds; the clock holds at 20:00, the header has neither Pause nor Leave, the
// record is already written, and Class Done opens when the ending is over.
//
// Given a ride at its last seconds, when the clock reaches 20:00, then the banner shows the output and the time.
// Given the banner shows, then the clock reads 20:00 / 20:00, Pause and Leave are gone, Full screen stays, and a screen
//   reader hears "Finished. N kJ." once.
// Given the banner shows, then the record already counts the ride.
// Given the ending is over, then Class Done opens with the same output.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';
import { ClassDonePage } from './pages/class-done.page';

test.describe('The finish banner', () => {
  test(
    'shows the output and time at 20:00 with the clock held and no Pause or Leave, the record already kept, then Class Done opens (L2-181 AC1 to AC6, L2-168 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      const ride = await startClassRide(page, bluetooth, api);
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
      for (let second = 0; second < 40; second += 4) {
        await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
        await page.clock.runFor(4000);
      }
      await page.clock.fastForward('19:18');
      await page.clock.runFor(2500);

      await expect(ride.finishBanner).toBeVisible();
      await expect(ride.finishTitle).toHaveText('Finish!');
      await expect(ride.finishResult).toHaveText(/^[1-9]\d*\s*kJ output\s*· 20:00$/);
      const kj = (await ride.finishOutput.textContent())!;
      await expect(ride.clock).toHaveText('20:00 / 20:00');
      await expect(ride.pause).toHaveCount(0);
      await expect(ride.leave).toHaveCount(0);
      await expect(new AppDocument(page).fullScreen).toBeVisible();
      await expect(ride.finishStatus).toHaveText(`Finished. ${kj} kJ.`);
      await expect(ride.segmentKind).toHaveText('Cool-down');
      expect(await page.evaluate(() => localStorage.getItem('telo-ride.record'))).not.toBeNull();

      const done = new ClassDonePage(page);
      await done.shown();
      await expect(page).toHaveURL('/done');
      await expect(done.number).toHaveText(kj);
    },
  );
});
