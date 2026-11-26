// Acceptance test
// Traces to: L2-173 AC8; L2-168 AC1, AC5
// Description: a ride finished in Ibiza counts toward the one record, whichever way it was ridden; Ibiza has no count
// or best of its own. The course's files are held, so nothing is drawn: the spec is about the record. It is seen by
// where the app opens with the bike forgotten (as ride-record.spec.ts), and by what the device keeps.
//
// Given the class ridden to its end in Ibiza, when the app opens again with no remembered bike, then The Class opens,
// and the device keeps one record, with nothing of its own for Ibiza.
import { startRideInIbizaOnPausedClock } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';
import { TheClassPage } from './pages/the-class.page';

test('a ride finished in Ibiza counts toward the one record, with none of its own (L2-173 AC8)', async ({
  page,
  bluetooth,
}) => {
  test.setTimeout(120_000);
  const files = await CourseFiles.install(page);
  files.hold();
  try {
    await startRideInIbizaOnPausedClock(page, bluetooth);
    await page.clock.fastForward('19:58');
    await page.clock.runFor(2000);
    await new ClassDonePage(page).shown();
  } finally {
    await files.dispose();
  }

  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) => key.startsWith('telo-ride.')),
  );
  expect(keys.filter((key) => /record/.test(key))).toEqual(['telo-ride.record']);
  expect(keys.filter((key) => /ibiza/i.test(key))).toEqual([]);
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('telo-ride.record')!));
  expect(Object.keys(record)).toEqual(['rides', 'best', 'last']);
  expect(record.rides).toBe(1);

  await page.addInitScript(() => localStorage.removeItem('telo-ride.bike'));
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return new TheClassPage(page).title.isVisible();
    })
    .toBe(true);
});
