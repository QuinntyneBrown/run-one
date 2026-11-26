// Acceptance test
// Traces to: L2-175 AC6, AC2 (as far as slice 37.3 goes); L2-174 AC4
// Description: the course's files are data. A colour in the course's centre-line file that is not a colour makes the
// course malformed, and it is never drawn from a bad value: no canvas, no frame, the still stays in the box, and the
// plan, the clock and the bike carry on. The notice under the still is slice 37.4's.
//
// Given a ride in Ibiza whose course file names a haze that is not a colour, when the course's files have come, then
// the course is not drawn, the clock and the plan run on, and the first level was sent.
import { startRideInIbiza } from './fixtures/class-ride';
import { COURSE_FILES, CourseFiles } from './fixtures/course-files';
import { expect, test } from './fixtures/test';

test.describe('A ride in Ibiza from a malformed course', () => {
  let files: CourseFiles;

  test.beforeEach(async ({ page }) => {
    files = await CourseFiles.install(page);
  });

  test.afterEach(async () => {
    await files.dispose();
  });

  test('a haze that is not a colour makes the course malformed: it is not drawn and the ride carries on (L2-175 AC6)', async ({
    page,
    bluetooth,
    course,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await course.pin('low');
    files.alter((file) => {
      file['haze'] = 'sunset';
    });
    await page.clock.install();

    const ride = await startRideInIbiza(page, bluetooth);

    // Every file came, the course's among them, and was read.
    await expect.poll(() => [...files.paths()].sort()).toEqual([...COURSE_FILES]);
    await page.waitForLoadState('networkidle');
    await page.clock.fastForward(20_000);

    // The ride runs on without the course, and the course is never drawn from the bad value.
    await expect(ride.clock).toHaveAccessibleName(/^0:(1\d|2\d) of 20:00$/);
    await expect(ride.segmentKind).toHaveText('Warm-up');
    await expect(ride.courseStill).toBeVisible();
    await expect(ride.course).toHaveCount(0);
    expect(await course.drawn()).toBeNull();
  });
});
