// Acceptance test
// Traces to: L2-084 AC1, AC2, AC3, AC4, AC6, AC7, AC9; L2-019 AC5; L2-173 AC1 to AC7; L2-080 AC1
// Description: The Class at `/` reads "GCN Training · Intervals", the class's title as the heading, its summary and
// "20:00" with "start to finish". The class video waits, parked at its sync offset with YouTube's controls; when it
// cannot load, the class cover stands in its box and the class can still be started. The start button reads "Start
// class" with a connected bike and starts the ride at 0:00; without one it reads "Connect your bike" with its line and
// opens Connect Bike. "What the bike will do" reads the plan's average target power, draws its resistance profile a bar
// a segment and says how many efforts it has and how long, at every width. "Ride with" offers the class video, chosen
// at first, and Ibiza Sunset Strip; the choice is kept on the device, puts the course's still in the video's box, and
// decides how the ride is ridden. A browser that cannot draw the course keeps to the class video. (A class that can't be loaded: the-one-class.spec.ts.)
import { ECHELON_NOTIFY, echelonBike, targetResistanceWrite } from './fixtures/echelon';
import { connectBike, skipFlyover } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { keptRideWith } from './fixtures/how-to-ride';
import { ScriptLog } from './fixtures/scripts';
import { expect, test } from './fixtures/test';
import { theClass as shipped } from './fixtures/the-class';
import { ClassRidePage } from './pages/class-ride.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { TheClassPage } from './pages/the-class.page';

/** The course's still, an image in the box; the course's own files are fetched only by a ride in Ibiza. */
const STILL = '/courses/ibiza-sunset-strip.jpg';

test.describe('The Class', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test('names the class: "GCN Training · Intervals", the title as the heading, the summary, and 20:00 start to finish (L2-084 AC1) @critical', async ({
    page,
  }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(page).toHaveURL('/');
    await expect(theClass.meta).toHaveText('GCN Training · Intervals');
    await expect(theClass.title).toHaveText('Intervals to the Beat');
    await expect(theClass.summary).toHaveText(
      'Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast sprints to finish.',
    );
    await expect(theClass.duration).toHaveText('20:00');
    await expect(theClass.durationLabel).toHaveText('start to finish');
  });

  test('"What the bike will do" reads "~254 W average", the resistance profile and the efforts in words (L2-084 AC2, AC3) @critical', async ({
    page,
  }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.planTitle).toBeVisible();
    await expect(theClass.planWatts).toHaveText('~254 W average');
    await expect(theClass.profile).toBeVisible();
    await expect(theClass.profileBars).toHaveCount(33);
    await expect(theClass.effortBars).toHaveCount(17);
    await expect(theClass.planNote).toHaveText(
      '17 efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal.',
    );
    // The plan chart carried over from Telo Ride, with its length and structure line, is gone from the screen.
    await expect(theClass.carriedOverPlan).toHaveCount(0);
  });

  test('the resistance profile is drawn from the plan: a bar a segment, as wide as it lasts and as tall as its level (L2-084 AC2)', async ({
    page,
  }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.profile).toBeVisible();

    const { segments } = shipped;
    const highest = Math.max(...segments.map((segment) => segment.level));
    const element = {
      'warm-up': 'warmup',
      work: 'work',
      recover: 'rest',
      steady: 'steady',
      'cool-down': 'cooldown',
    };
    let start = 0;
    const expected = segments.map((segment) => {
      const bar = {
        element: `class-profile__${element[segment.kind]}`,
        start,
        duration: segment.duration,
        height: Math.round((24 * segment.level) / highest),
      };
      start += segment.duration;
      return bar;
    });

    const drawn = await theClass.drawnProfile();
    // The box is the plan's 1200 seconds wide; each bar starts and ends a hair inside its segment's seconds.
    expect(drawn.box).toBe('0 0 1200 32');
    expect(drawn.bars.map(({ element, height }) => ({ element, height }))).toEqual(
      expected.map(({ element, height }) => ({ element, height })),
    );
    drawn.bars.forEach((bar, index) => {
      expect(bar.x - expected[index].start).toBeCloseTo(2.4, 5);
      expect(expected[index].duration - bar.width).toBeCloseTo(4.8, 5);
    });
  });

  for (const [width, height, tall] of [
    [390, 844, 64],
    [768, 1024, 64],
    [1024, 768, 56],
    [1440, 900, 64],
  ] as const) {
    test(`at ${width} px "What the bike will do" shows whole, its profile ${tall} px tall (L2-084 AC2)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      const theClass = new TheClassPage(page);
      await theClass.open();

      expect(await theClass.fitsTheWidth(theClass.plan)).toBe(true);
      await expect(theClass.planTitle).toBeVisible();
      await expect(theClass.planWatts).toBeVisible();
      await expect(theClass.planNote).toBeVisible();
      expect(await theClass.fitsTheWidth(theClass.planNote)).toBe(true);
      expect(await theClass.height(theClass.profile)).toBe(tall);
    });
  }

  test('the class video waits parked at its sync offset, with its controls (L2-084 AC1)', async ({
    page,
    youtube,
  }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    const [player] = await youtube.players();
    expect(player.videoId).toBe('il_OFz6o42I');
    expect(player.playerVars).toMatchObject({ start: 3, controls: 1 });
    await expect
      .poll(async () => (await youtube.players())[0].title)
      .toBe('Video: Intervals to the Beat');
    expect((await youtube.players())[0].playing).toBe(false);
    expect(await youtube.seeks()).toEqual([]);
    await expect(theClass.cover).toHaveAccessibleName('Video: Intervals to the Beat, GCN Training');
  });

  test('when the video cannot load, the class cover stands in its box and the class can still be started (L2-084 AC9)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    youtube.block();
    const theClass = new TheClassPage(page);
    await theClass.open();

    // The cover alone: no player is over it.
    await expect(theClass.player).toHaveCount(0);
    await expect(theClass.cover).toBeVisible();
    expect(await youtube.players()).toEqual([]);

    await connectBike(bluetooth);
    await expect(theClass.start).toHaveText('Start class');
    await theClass.start.click();
    await expect(new ClassRidePage(page).name).toContainText('Intervals to the Beat');
  });

  test('with a connected bike the start button reads "Start class", and starts the ride at 0:00 (L2-084 AC4, AC7) @critical', async ({
    page,
    bluetooth,
  }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();
    await connectBike(bluetooth);

    await expect(theClass.start).toHaveText('Start class');
    await expect(theClass.startHint).toHaveCount(0);
    await theClass.start.click();

    const ride = new ClassRidePage(page);
    await expect(ride.clock).toContainText('0:00');
    await expect(ride.name).toContainText('Intervals to the Beat');
    // The ride has started: the first segment's target resistance goes to the bike at once.
    await expect
      .poll(() => bluetooth.writes().map((write) => write.hex))
      .toContain(targetResistanceWrite(shipped.segments[0].level));
  });

  test('with no connected bike the start button reads "Connect your bike" with its line and opens Connect Bike, and follows the bike within a second (L2-084 AC6, L2-019 AC5)', async ({
    page,
    bluetooth,
  }) => {
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.start).toHaveText('Connect your bike');
    await expect(theClass.startHint).toHaveText('The class needs the bike to set resistance.');

    await expect.poll(() => bluetooth.writes().length).toBe(3);
    await bluetooth.notify(
      ECHELON_NOTIFY,
      [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f],
    );
    await expect(theClass.start).toHaveText('Start class', { timeout: 1000 });
    await bluetooth.drop();
    await expect(theClass.start).toHaveText('Connect your bike', { timeout: 1000 });

    await theClass.start.click();
    await expect(page).toHaveURL('/connect');
    await expect(new ConnectBikePage(page).title).toBeVisible();
  });

  test.describe('Ride with', () => {
    test('offers "Class video" and "Ibiza Sunset Strip", with "Class video" chosen for a rider who has never chosen (L2-173 AC1, AC4) @critical', async ({
      page,
      youtube,
    }) => {
      const theClass = new TheClassPage(page);
      await theClass.open();

      await expect(theClass.rideWith).toBeVisible();
      await expect(theClass.options).toHaveText([
        'Class video',
        'Ibiza Sunset Strip8.4 km · 159 m of climbing',
      ]);
      await expect(theClass.classVideo).toHaveAttribute('aria-checked', 'true');
      await expect(theClass.ibiza).toHaveAttribute('aria-checked', 'false');
      // The video player is in its box (AC4).
      await expect.poll(async () => (await youtube.players()).length).toBe(1);
      await expect(theClass.still).toHaveCount(0);
    });

    test('keeps the choice on the device, and with Ibiza chosen shows the course’s still in the video’s box and loads no player, renderer or course (L2-173 AC2, AC3)', async ({
      page,
      youtube,
    }) => {
      const scripts = new ScriptLog(page);
      const course: string[] = [];
      page.on('request', (request) => {
        // The course's still is the one file of the course The Class shows.
        const { pathname } = new URL(request.url());
        if (/^\/(courses|riders)\//.test(pathname) && pathname !== STILL) course.push(pathname);
      });
      const theClass = new TheClassPage(page);
      await theClass.open();
      await expect.poll(async () => (await youtube.players()).length).toBe(1);

      await theClass.ibiza.click();

      await expect(theClass.ibiza).toHaveAttribute('aria-checked', 'true');
      await expect(theClass.classVideo).toHaveAttribute('aria-checked', 'false');
      await expect(theClass.still).toBeVisible();
      await expect(theClass.ibizaDetail).toHaveText('8.4 km · 159 m of climbing');
      // The parked player goes with the video.
      expect((await youtube.players())[0].destroyed).toBe(true);

      await page.reload();

      await expect(theClass.ibiza).toHaveAttribute('aria-checked', 'true');
      await expect(theClass.still).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await youtube.players()).toEqual([]);
      expect(await scripts.hasWorldCode()).toBe(false);
      expect(course).toEqual([]);

      // Chosen back, the class video is kept and its player returns (AC4).
      await theClass.classVideo.click();
      await expect(theClass.still).toHaveCount(0);
      await expect.poll(async () => (await youtube.players()).length).toBe(1);
      await page.reload();
      await expect(theClass.classVideo).toHaveAttribute('aria-checked', 'true');
    });

    test('is used with the arrow keys, each option at least 44 px tall, the chosen one told by aria-checked and a mark (L2-173 AC7)', async ({
      page,
    }) => {
      const theClass = new TheClassPage(page);
      await theClass.open();

      for (const option of [theClass.classVideo, theClass.ibiza]) {
        expect(await theClass.height(option)).toBeGreaterThanOrEqual(44);
      }
      expect(await theClass.marked(theClass.classVideo)).toBe(true);
      expect(await theClass.marked(theClass.ibiza)).toBe(false);

      await theClass.classVideo.focus();
      await page.keyboard.press('ArrowDown');
      await expect(theClass.ibiza).toBeFocused();
      await expect(theClass.ibiza).toHaveAttribute('aria-checked', 'true');
      // The mark moves with the choice, once its transition has run.
      await expect.poll(() => theClass.marked(theClass.ibiza)).toBe(true);
      await expect.poll(() => theClass.marked(theClass.classVideo)).toBe(false);

      await page.keyboard.press('ArrowUp');
      await expect(theClass.classVideo).toBeFocused();
      await expect(theClass.classVideo).toHaveAttribute('aria-checked', 'true');
      // Only the chosen option is in the tab order, as a radio group's is.
      await expect(theClass.classVideo).toHaveAttribute('tabindex', '0');
      await expect(theClass.ibiza).toHaveAttribute('tabindex', '-1');
    });

    test('in a browser that cannot draw the course, disables "Ibiza Sunset Strip", says why, and chooses "Class video" whatever was kept (L2-173 AC6)', async ({
      page,
      webgl,
      youtube,
    }) => {
      await webgl.disable();
      await keptRideWith(page, 'ibiza');
      const theClass = new TheClassPage(page);
      await theClass.open();

      await expect(theClass.ibiza).toHaveAttribute('aria-disabled', 'true');
      await expect(theClass.ibizaDetail).toHaveText('This browser can’t draw Ibiza.');
      await expect(theClass.classVideo).toHaveAttribute('aria-checked', 'true');
      await expect(theClass.ibiza).toHaveAttribute('aria-checked', 'false');
      await expect.poll(async () => (await youtube.players()).length).toBe(1);

      await theClass.ibiza.click({ force: true });
      await theClass.classVideo.focus();
      await page.keyboard.press('ArrowDown');
      await expect(theClass.classVideo).toHaveAttribute('aria-checked', 'true');
      await expect(theClass.still).toHaveCount(0);
    });

    test('with "Class video" chosen the ride is with the class video alone, and with "Ibiza Sunset Strip" it is in the course; the start button reads the same (L2-173 AC5)', async ({
      page,
      bluetooth,
      youtube,
    }) => {
      const theClass = new TheClassPage(page);
      const ride = new ClassRidePage(page);
      await theClass.open();
      await connectBike(bluetooth);
      await expect(theClass.start).toHaveText('Start class');
      await theClass.videoSettled();

      await theClass.start.click();

      await expect(ride.name).toContainText('Intervals to the Beat');
      await expect(ride.box).toHaveClass(/class-video/);
      await expect
        .poll(async () => (await youtube.players()).filter((player) => !player.destroyed).length)
        .toBe(1);

      await ride.leave.click();
      // The spec is about the choice and not the course: its files are held, so nothing is drawn.
      const files = await CourseFiles.install(page);
      files.hold();
      await theClass.ibiza.click();
      await expect(theClass.start).toHaveText('Start class');
      await theClass.start.click();
      await skipFlyover(page);

      // The ride is in Ibiza: the course takes the video's box, and there is no video (L2-174 AC1).
      await expect(ride.name).toContainText('Intervals to the Beat');
      await expect(ride.box).toHaveClass(/class-course/);
      await expect(ride.courseLoading).toHaveText('Loading Ibiza Sunset Strip');
      await expect(ride.video).toHaveCount(0);
      await files.dispose();
    });
  });
});
