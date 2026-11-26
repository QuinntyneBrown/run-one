// Acceptance test
// Traces to: L2-176 AC1, AC2, AC3, AC4, AC6, AC8, AC9
// Description: the one track, Beautiful Boom Bap, plays in the background of a ride in Ibiza and nowhere else. It is
// served by the app's own origin and fetched when the ride starts; it loops; it pauses with the ride, within 100 ms,
// and carries on from the same place; it plays on in a hidden tab; and leaving releases it. The course's files are
// held, so nothing is drawn: the spec is about the music.
//
// Given The Class with Ibiza chosen, or a ride with the class video, when it shows, then nothing under /music/ is
// fetched and no audio element is made.
// Given a ride in Ibiza, when it starts, then the track is fetched from the app's origin, loops and plays.
// Given the ride is paused or the bike is lost, when it waits, then the track pauses within 100 ms and, when the ride
// carries on, plays from the same place.
// Given the tab is hidden, when the ride runs on, then the track plays on.
// Given the rider leaves, when The Class opens, then the track is paused and released.
import {
  loseBike,
  openTheClassForIbiza,
  startClassRide,
  startRideInIbiza,
} from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { RideMusicProbe } from './fixtures/ride-music';
import { expect, test } from './fixtures/test';

const TRACK = '/music/beautiful-boom-bap.mp3';

test.describe('The ride’s music', () => {
  let files: CourseFiles;
  let music: RideMusicProbe;

  test.beforeEach(async ({ page }) => {
    music = await RideMusicProbe.install(page);
    files = await CourseFiles.install(page);
    files.hold();
  });

  test.afterEach(async () => {
    await files.dispose();
  });

  test('The Class with Ibiza chosen fetches no music and makes no audio (L2-176 AC2)', async ({
    page,
    bluetooth,
  }) => {
    await openTheClassForIbiza(page, bluetooth);
    await page.waitForLoadState('networkidle');

    expect(music.requests).toEqual([]);
    expect(await music.tracks()).toEqual([]);
  });

  test('a ride with the class video has its own sound: no music is fetched and no audio is made (L2-176 AC3)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);
    await page.waitForLoadState('networkidle');

    expect(music.requests).toEqual([]);
    expect(await music.tracks()).toEqual([]);
  });

  test('a ride in Ibiza fetches the track from the app’s own origin when it starts, loops it and plays it (L2-176 AC1, AC2, AC9)', async ({
    page,
    bluetooth,
  }) => {
    await startRideInIbiza(page, bluetooth);

    await expect.poll(() => music.requests.map((url) => url.pathname)).toContain(TRACK);
    expect([...new Set(music.requests.map((url) => url.origin))]).toEqual([
      new URL(page.url()).origin,
    ]);
    await expect.poll(async () => (await music.tracks()).length).toBe(1);
    const [track] = await music.tracks();
    expect(track!.src).toBe('music/beautiful-boom-bap.mp3');
    expect(track!.loop).toBe(true);
    await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(false);
    await expect.poll(async () => (await music.tracks())[0]!.currentTime).toBeGreaterThan(0);
  });

  test('Pause stops the track within 100 ms and Resume plays it on from the same place; a lost bike holds it too (L2-176 AC4)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startRideInIbiza(page, bluetooth);
    await expect.poll(async () => (await music.tracks())[0]?.currentTime ?? 0).toBeGreaterThan(0.2);

    await ride.pause.click();
    await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(true);
    expect(await music.pausedAfterClick()).toBeLessThan(100);
    const held = (await music.tracks())[0]!.currentTime;
    expect(held).toBeGreaterThan(0.2);

    await ride.resume.click();
    await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(false);
    await expect
      .poll(async () => (await music.tracks())[0]!.currentTime)
      .toBeGreaterThanOrEqual(held);

    await loseBike(bluetooth);
    await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(true);
  });

  test('the track plays on in a hidden tab (L2-176 AC8)', async ({ page, bluetooth }) => {
    await startRideInIbiza(page, bluetooth);
    await expect.poll(async () => (await music.tracks())[0]?.currentTime ?? 0).toBeGreaterThan(0.2);

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const before = (await music.tracks())[0]!.currentTime;

    await expect.poll(async () => (await music.tracks())[0]!.currentTime).toBeGreaterThan(before);
    expect((await music.tracks())[0]!.paused).toBe(false);
  });

  test('leaving pauses and releases the track, and The Class plays no music (L2-176 AC6)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startRideInIbiza(page, bluetooth);
    await expect.poll(async () => (await music.tracks())[0]?.paused).toBe(false);

    await ride.leave.click();

    await expect(page).toHaveURL('/');
    const [track] = await music.tracks();
    expect(track!.paused).toBe(true);
    expect(track!.src).toBeNull();
  });
});
