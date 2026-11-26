// Acceptance test
// Traces to: L2-175 AC2, L2-174 AC4, L2-089 AC6
// Description: a ride in Ibiza whose course cannot be drawn (docs/mocks/pages/class-ride/ibiza-unavailable). The
// course's files cannot be loaded, or a file is malformed: the still stays in the box, "Loading Ibiza Sunset Strip"
// goes, a notice under the box says so, and the clock, the plan and the bike carry on.
//
// Given a ride in Ibiza whose course's files cannot be loaded or are malformed, when the files have been asked for,
// then the still stays in the box with no loading words and no canvas, the notice reads "Ibiza can’t be drawn. The
// bike will still follow the class." as a status, the clock runs on, and the stepper works.
import { startRideInIbiza } from './fixtures/class-ride';
import { COURSE_FILES, CourseFiles } from './fixtures/course-files';
import { expect, test } from './fixtures/test';

const NOTICE = 'Ibiza can’t be drawn. The bike will still follow the class.';

test.describe('A ride in Ibiza whose course cannot be drawn', () => {
  let files: CourseFiles;

  test.beforeEach(async ({ page }) => {
    files = await CourseFiles.install(page);
  });

  test.afterEach(async () => {
    await files.dispose();
  });

  const cases: [string, () => void][] = [
    ['the map is not on the host', () => files.refuse('/courses/ibiza.glb')],
    ['the rider is not on the host', () => files.refuse('/riders/rider.glb')],
    ['the centre line is not on the host', () => files.refuse('/courses/ibiza.course.json')],
    [
      'the centre line is malformed',
      () =>
        files.alter((file) => {
          delete file['lengthMetres'];
        }),
    ],
  ];

  for (const [name, break_] of cases) {
    test(`when ${name}, the still stays under a notice and the ride carries on (L2-175 AC2)`, async ({
      page,
      bluetooth,
    }) => {
      break_();

      const ride = await startRideInIbiza(page, bluetooth);

      await expect.poll(() => [...new Set(files.paths())].sort()).toEqual([...COURSE_FILES]);
      await expect(ride.courseNotice).toHaveText(NOTICE, { timeout: 30_000 });
      await expect(ride.courseNotice).toHaveAttribute('role', 'status');
      await expect(ride.courseStill).toBeVisible();
      await expect(ride.courseLoading).toHaveCount(0);
      await expect(ride.course).toHaveCount(0);
      await expect(ride.video).toHaveCount(0);
      // The ride carries on without the course.
      await expect(ride.clock).toHaveAccessibleName(/^0:0[2-9] of 20:00$/);
      await expect(ride.segmentKind).toHaveText('Warm-up');
      await expect(ride.raise).toBeEnabled();
      await expect(ride.courseNotice).toHaveCount(1);
    });
  }
});
