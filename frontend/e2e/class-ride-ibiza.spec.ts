// Acceptance test
// Traces to: L2-089 AC6; L2-173 AC9; L2-174 AC1, AC6, AC11; L2-175 AC1, AC3; L2-136 AC1
// Description: a ride in Ibiza opens Class Ride at once (docs/mocks/pages/class-ride/ibiza-loading and ibiza). There
// is no loading screen and no video player: the clock starts and the first level goes to the bike while the 3D
// renderer and the course's files are fetched, the box reads "Loading Ibiza Sunset Strip" over the course's still,
// and then the course is drawn in the box with the rider alone on its road, where the clock puts them. Where a spec
// is about the page, the course's files are held and nothing is drawn; the one spec that draws the course rides in
// the smallest landscape window, at the course's lowest step, and never resizes.
//
// Given The Class with "Ibiza Sunset Strip" chosen, when it shows, then none of the course's files and no 3D code
// has been fetched.
// Given the rider presses the start button, when Class Ride opens, then the clock runs from 0:00, the first segment's
// level is sent, the course's three files and the 3D renderer are fetched from the app's own origin, the box reads
// "Loading Ibiza Sunset Strip" over the still, and there is no loading screen and no video player.
// Given the course's rider has not come, when the map has, then the course is not drawn.
// Given the course is ready after the ride has started, when its first frame is drawn, then the rider is where the
// clock puts them, alone on the road, on a canvas named "Ibiza Sunset Strip", and the still and its words are gone.
// Given a ride in Ibiza whose course is still loading, when the rider leaves, then The Class opens.
import { openTheClassForIbiza, startRideInIbiza } from './fixtures/class-ride';
import { COURSE_FILES, CourseFiles } from './fixtures/course-files';
import { ScriptLog } from './fixtures/scripts';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { YouTubeFixture } from './fixtures/youtube';
import { TheClassPage } from './pages/the-class.page';

/** The warm-up's stretch is ridden evenly: its metres a second (L2-174 AC2, AC3). */
const WARM_UP = theClass.segments[0];
const WARM_UP_SPEED = (WARM_UP.cadenceAim / 60) * 5;

test.describe('A ride in Ibiza', () => {
  let files: CourseFiles;

  test.beforeEach(async ({ page }) => {
    files = await CourseFiles.install(page);
  });

  test.afterEach(async () => {
    await files.dispose();
  });

  test(
    'Start class opens Class Ride at once: the clock runs, the first level is sent and the box reads "Loading Ibiza Sunset Strip" over the still, with no loading screen and no video player (L2-175 AC1, L2-174 AC1, L2-136 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      const scripts = new ScriptLog(page);
      const asked: URL[] = [];
      page.on('request', (request) => asked.push(new URL(request.url())));
      files.hold();
      await page.clock.install();

      const ride = await startRideInIbiza(page, bluetooth);

      // Class Ride, and nothing between the start button and it.
      expect(ride.url()).toBe('/ride');
      await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
      await expect(ride.heading).toHaveText('Intervals to the Beat · solo class ride');
      await expect(ride.loadingScreen).toHaveCount(0);
      await expect(ride.segmentKind).toHaveText('Warm-up');
      // The clock runs while the course loads.
      await expect(ride.clock).toHaveAccessibleName(/^0:0\d of 20:00$/);
      await page.clock.fastForward(5_000);
      await expect(ride.clock).toHaveAccessibleName(/^0:0[5-9] of 20:00$/);
      // The box says so, over the course's still.
      await expect(ride.box).toHaveClass(/class-course/);
      await expect(ride.courseLoading).toHaveText('Loading Ibiza Sunset Strip');
      await expect(ride.courseStill).toBeVisible();
      expect(await ride.coversBox(ride.courseStill)).toBe(true);
      await expect(ride.course).toHaveCount(0);
      // The course's files and the 3D renderer were asked for at that moment, of the app's own origin.
      await expect.poll(() => [...files.paths()].sort()).toEqual([...COURSE_FILES]);
      expect(files.origins()).toEqual([new URL(page.url()).origin]);
      expect(await scripts.hasWorldCode()).toBe(true);
      // No video player: no frame, no cover, and nothing asked of YouTube.
      await expect(ride.video).toHaveCount(0);
      await expect(ride.videoNotice).toHaveCount(0);
      expect(asked.filter((url) => YouTubeFixture.answers(url))).toEqual([]);
    },
  );

  test('The Class fetches none of the course’s files and no 3D code, with "Ibiza Sunset Strip" chosen (L2-175 AC1, L2-173 AC3)', async ({
    page,
    bluetooth,
  }) => {
    const scripts = new ScriptLog(page);
    const home = await openTheClassForIbiza(page, bluetooth);
    await expect(home.still).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(files.paths()).toEqual([]);
    expect(await scripts.hasWorldCode()).toBe(false);
  });

  test('the course is drawn in the box when its rider has come, on a canvas named "Ibiza Sunset Strip", with the rider alone and where the clock puts them (L2-174 AC1, AC6, AC11, L2-175 AC3, L2-089 AC6)', async ({
    page,
    bluetooth,
    course,
  }) => {
    // The course is drawn in software here: one window, the smallest landscape one, at the lowest step.
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await course.pin('low');
    const rider = '/riders/rider.glb';
    files.hold((path) => path === rider);
    const answered: string[] = [];
    page.on('response', (response) => {
      const { pathname } = new URL(response.url());
      if (response.ok() && pathname.startsWith('/courses/')) answered.push(pathname);
    });
    await page.clock.install();

    const ride = await startRideInIbiza(page, bluetooth);

    // The map has come and the rider has not: the ride runs on and the course is not drawn.
    await expect.poll(() => files.paths()).toContain(rider);
    await expect
      .poll(() => answered)
      .toEqual(expect.arrayContaining(['/courses/ibiza.glb', '/courses/ibiza.course.json']));
    await page.clock.fastForward(45_000);
    await expect(ride.clock).toHaveAccessibleName(/^0:(4[5-9]|5\d) of 20:00$/);
    await expect(ride.courseLoading).toHaveText('Loading Ibiza Sunset Strip');
    await expect(ride.course).toHaveCount(0);

    const file = page.waitForResponse((response) => new URL(response.url()).pathname === rider);
    await files.release();

    expect((await file).headers()['content-type']).toBe('model/gltf-binary');
    await expect(ride.course).toBeVisible({ timeout: 60_000 });
    await expect(ride.course).toHaveJSProperty('tagName', 'CANVAS');
    await expect(ride.course).toHaveCSS('opacity', '1');
    expect(await ride.coversBox(ride.course)).toBe(true);
    // The still and its words give way to the course.
    await expect(ride.courseLoading).toHaveCount(0);
    await expect(ride.courseStill).toHaveCount(0);
    await expect(ride.video).toHaveCount(0);
    // The first frame had the rider where the clock was, 45 seconds and more up the warm-up's stretch, never on the
    // grid; and they are alone on the road.
    const drawn = await course.drawn();
    const [, minutes, seconds] = /^(\d+):(\d\d)/.exec((await ride.clock.textContent())!)!;
    const now = Number(minutes) * 60 + Number(seconds);
    expect(drawn!.firstMetres).toBeGreaterThanOrEqual(45 * WARM_UP_SPEED - 1);
    expect(drawn!.firstMetres).toBeLessThanOrEqual((now + 2) * WARM_UP_SPEED);
    expect(drawn!.riders).toBe(1);
    // Everything else on the screen is as with the class video (L2-089 AC6).
    await expect(ride.pause).toHaveText('Pause');
    await expect(ride.leave).toBeVisible();
    await expect(ride.profile).toBeVisible();
    await expect(ride.cadenceHint).toHaveText(`Aim ${WARM_UP.cadenceAim}`);
    await expect(ride.raise).toBeEnabled();
  });

  test('Leave while the course is loading opens The Class (L2-093 AC1, L2-175 AC1)', async ({
    page,
    bluetooth,
  }) => {
    files.hold();
    const ride = await startRideInIbiza(page, bluetooth);
    await expect(ride.courseLoading).toBeVisible();
    await expect.poll(() => files.requests.length).toBeGreaterThan(0);

    await ride.leave.click();

    await expect(page).toHaveURL('/');
    await expect(new TheClassPage(page).start).toBeVisible();
  });
});
