// Acceptance test
// Traces to: L2-186 AC1 to AC6, AC8; L2-185 AC2, AC3
// Description: YouTube in a ride in Ibiza (docs/mocks/pages/class-ride/ibiza-youtube, ibiza-youtube-class,
// ibiza-youtube-audio and ibiza-youtube-unavailable, ADR 0050). YouTube video plays the default video, xfgZRgPkoME,
// in a 16:9 inset in the course box's top-right corner, on the ride clock; the class video plays there on the clock
// plus its 0:03; YouTube audio keeps the same player with its picture hidden. The shared fixture answers YouTube with
// a fake player whose time runs on the page's clock. The course's files are held: the spec is about the video.
//
// Given a ride in Ibiza, when it opens, then nothing of YouTube is fetched.
// Given the rider chooses YouTube video, then the default video plays in the inset from youtube-nocookie.com without
// controls, the music stops, and the choice is kept for the next ride.
// Given the ride at 5:30, then the default video is at 5:30; paused, it pauses.
// Given the rider chooses the class video, then that player goes and the class video plays at 5:33.
// Given the rider moves to YouTube audio, then the same player plays on, hidden; moving to Music destroys it.
// Given the video cannot play, then a notice says the bike will still follow the class.
import type { Page } from '@playwright/test';
import { startRideInIbiza, startRideInIbizaOnPausedClock } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { RideMusicProbe } from './fixtures/ride-music';
import { expect, test } from './fixtures/test';
import type { ClassRidePage } from './pages/class-ride.page';

const DEFAULT_VIDEO = 'xfgZRgPkoME';
const CLASS_VIDEO = 'il_OFz6o42I';

/** Every request the page makes to YouTube's player script, from now on. */
function youtubeRequests(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('youtube.com/iframe_api')) seen.push(request.url());
  });
  return seen;
}

/** Chooses `name` in the Sound panel, stepping the paused clock so the page renders it (L93). */
async function choose(page: Page, ride: ClassRidePage, name: string): Promise<void> {
  if (!(await ride.soundGroup.isVisible())) {
    await ride.sound.click();
    await page.clock.runFor(50);
  }
  await ride.soundChoice(name).check();
  await page.clock.runFor(100);
}

test.describe('YouTube in Ibiza', () => {
  let files: CourseFiles;

  test.beforeEach(async ({ page }) => {
    files = await CourseFiles.install(page);
    files.hold();
  });

  test.afterEach(async () => {
    await files.dispose();
  });

  test(
    'YouTube video plays the default video in the box’s top-right corner, fetched only once chosen (L2-186 AC1, AC4)',
    { tag: '@critical' },
    async ({ page, bluetooth, youtube }) => {
      const music = await RideMusicProbe.install(page);
      const requests = youtubeRequests(page);
      const ride = await startRideInIbiza(page, bluetooth);
      await expect.poll(async () => (await music.tracks())[0]?.paused).toBe(false);
      expect(requests).toEqual([]);
      expect(await youtube.players()).toEqual([]);

      await ride.sound.click();
      await ride.soundChoice('YouTube video').check();

      await expect(ride.sound).toHaveAccessibleName('Sound: YouTube video');
      await expect.poll(async () => (await youtube.players()).length).toBe(1);
      expect(await youtube.players()).toEqual([
        expect.objectContaining({
          host: 'https://www.youtube-nocookie.com',
          videoId: DEFAULT_VIDEO,
          playerVars: expect.objectContaining({ controls: 0 }),
          title: 'Default video',
        }),
      ]);
      await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(true);
      // 16:9 in the top-right corner, space-3 from the top and space-6 from the right, 32 % of the box's width.
      const [inset, box] = await Promise.all([ride.drawn(ride.inset), ride.drawn(ride.box)]);
      expect(box.x + box.width - (inset.x + inset.width)).toBeCloseTo(24, 0);
      expect(inset.y - box.y).toBeCloseTo(12, 0);
      expect(inset.width / inset.height).toBeCloseTo(16 / 9, 1);
      expect(inset.width).toBeCloseTo(Math.min(448, Math.max(192, box.width * 0.32)), 0);
    },
  );

  test('the default video follows the ride clock and pauses with the ride (L2-186 AC3, AC8)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
    await choose(page, ride, 'YouTube video');
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);

    await page.clock.fastForward('05:30');
    await page.clock.runFor(1000);
    await expect(ride.clock).toHaveText(/^5:3\d \/ 20:00$/);
    const clock = await ride.clockSeconds();
    expect(Math.abs((await youtube.time()) - clock)).toBeLessThan(1.6);

    await ride.pause.click();
    await page.clock.runFor(100);
    await expect.poll(async () => (await youtube.players())[0]!.playing).toBe(false);
    await expect(ride.coursePaused).toBeVisible();
  });

  test('the class video plays in time with the ride, at the clock plus 0:03 (L2-185 AC2, L2-186 AC3, AC5)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
    await page.clock.fastForward('05:30');
    await page.clock.runFor(100);
    await choose(page, ride, 'YouTube video');
    await expect(ride.videoGroup).toBeVisible();
    await expect.poll(async () => (await youtube.players()).length).toBe(1);

    await ride.videoChoice('The class video').check();
    await page.clock.runFor(100);

    await expect.poll(async () => (await youtube.players()).length).toBe(2);
    const [first, second] = await youtube.players();
    expect(first!.destroyed).toBe(true);
    expect(second).toMatchObject({ videoId: CLASS_VIDEO, title: 'Intervals to the Beat' });
    await page.clock.runFor(1000);
    expect(Math.abs((await youtube.time()) - ((await ride.clockSeconds()) + 3))).toBeLessThan(1.6);
  });

  test('YouTube audio keeps the same player playing with its picture hidden; Music destroys it (L2-186 AC2, AC5)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    const ride = await startRideInIbiza(page, bluetooth);
    await ride.sound.click();
    await ride.soundChoice('YouTube video').check();
    await expect.poll(async () => (await youtube.players()).length).toBe(1);

    await ride.soundChoice('YouTube audio').check();

    await expect(ride.sound).toHaveAccessibleName('Sound: YouTube audio');
    const audio = await ride.drawn(ride.inset);
    expect(audio.width).toBeLessThanOrEqual(1);
    expect(audio.height).toBeLessThanOrEqual(1);
    await expect(ride.inset).toHaveAttribute('aria-hidden', 'true');
    const players = await youtube.players();
    expect(players).toHaveLength(1);
    expect(players[0]!.destroyed).toBe(false);

    await ride.soundChoice('Music').check();

    await expect.poll(async () => (await youtube.players())[0]!.destroyed).toBe(true);
    await expect(ride.inset).toHaveCount(0);
  });

  test('keeps YouTube video for the next ride (L2-185 AC3)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    const first = await startRideInIbiza(page, bluetooth);
    await first.sound.click();
    await first.soundChoice('YouTube video').check();
    await first.leave.click();
    await expect(page).toHaveURL('/');

    const second = await startRideInIbiza(page, bluetooth);

    await expect(second.sound).toHaveAccessibleName('Sound: YouTube video');
    await expect(second.inset).toBeVisible();
    await expect.poll(async () => (await youtube.players()).at(-1)?.videoId).toBe(DEFAULT_VIDEO);
  });

  test('says when YouTube can’t play, and the ride carries on (L2-186 AC6)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    const ride = await startRideInIbiza(page, bluetooth);
    await ride.sound.click();
    await ride.soundChoice('YouTube video').check();
    await expect.poll(async () => (await youtube.players()).length).toBe(1);

    await youtube.fail();

    await expect(ride.youtubeNotice).toHaveText(
      'YouTube can’t play. The bike will still follow the class.',
    );
    await expect(ride.pause).toBeEnabled();
  });
});
