// Acceptance test
// Traces to: L2-185 AC1 to AC7; L2-176 AC5, AC7
// Description: the Sound button in the course box's top-left corner and its panel (docs/mocks/pages/class-ride/ibiza,
// ibiza-sound, ibiza-music-off and ibiza-music-unavailable, ADR 0050), which replace slice 37.6's Music toggle. The
// choice applies at once without stopping the ride and is kept on this device; the music plays only while the sound
// is Music. The course's files are held, so nothing is drawn: the spec is about the sound.
//
// Given a ride in Ibiza, when it starts, then Sound reads "Music" in the box's top-left corner, at least 44 px, and
// the track plays.
// Given the rider opens Sound, then a radio group "Sound" offers Music and No music, Music chosen; No music pauses
// the track at once, the panel stays open, and Escape closes it with the focus back on Sound.
// Given the rider chose No music, when the next ride starts, then it is No music and nothing is fetched.
// Given slice 37.6 kept the music "off", when a ride starts, then the sound is No music.
// Given the track cannot be loaded, then Music is disabled in the panel with "Can’t play", and no alert shows.
// Given a ride with the class video, then there is no Sound button.
import { startClassRide, startRideInIbiza } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { RideMusicProbe } from './fixtures/ride-music';
import { expect, test } from './fixtures/test';

test.describe('The Sound button', () => {
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

  test('reads Music in the box’s top-left corner, at least 44 px, while the track plays (L2-185 AC1, L2-176 AC5)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startRideInIbiza(page, bluetooth);

    await expect(ride.sound).toHaveAccessibleName('Sound: Music');
    await expect(ride.sound).toHaveAttribute('aria-expanded', 'false');
    const [sound, box] = await Promise.all([ride.drawn(ride.sound), ride.drawn(ride.box)]);
    expect(sound.height).toBeGreaterThanOrEqual(44);
    expect(sound.width).toBeGreaterThanOrEqual(44);
    expect(sound.x - box.x).toBeLessThan(box.width / 4);
    expect(sound.y - box.y).toBeLessThan(box.height / 4);
    await expect.poll(async () => (await music.tracks())[0]?.paused).toBe(false);
  });

  test(
    'opens a panel whose choice applies at once, stays open, and closes on Escape (L2-185 AC2, AC5)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      const ride = await startRideInIbiza(page, bluetooth);
      await expect.poll(async () => (await music.tracks())[0]?.paused).toBe(false);

      await ride.sound.click();

      await expect(ride.sound).toHaveAttribute('aria-expanded', 'true');
      await expect(ride.soundGroup).toBeVisible();
      await expect(ride.soundChoice('Music')).toBeChecked();
      await expect(ride.soundChoice('No music')).not.toBeChecked();

      await ride.soundChoice('No music').check();

      await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(true);
      await expect(ride.sound).toHaveAccessibleName('Sound: No music');
      await expect(ride.soundGroup).toBeVisible();
      // The ride is not stopped.
      await expect(ride.pause).toBeEnabled();

      await page.keyboard.press('Escape');

      await expect(ride.soundGroup).toBeHidden();
      await expect(ride.sound).toBeFocused();
      await expect(ride.sound).toHaveAttribute('aria-expanded', 'false');
    },
  );

  test('a press outside the panel closes it (L2-185 AC2)', async ({ page, bluetooth }) => {
    const ride = await startRideInIbiza(page, bluetooth);
    await ride.sound.click();
    await expect(ride.soundGroup).toBeVisible();

    await ride.clock.click();

    await expect(ride.soundGroup).toBeHidden();
  });

  test('keeps the choice: the next ride is No music and fetches nothing (L2-185 AC3, AC5)', async ({
    page,
    bluetooth,
  }) => {
    const first = await startRideInIbiza(page, bluetooth);
    await first.sound.click();
    await first.soundChoice('No music').check();
    await first.leave.click();
    await expect(page).toHaveURL('/');
    music.requests.length = 0;

    const second = await startRideInIbiza(page, bluetooth);

    await expect(second.sound).toHaveAccessibleName('Sound: No music');
    await page.waitForLoadState('networkidle');
    expect(music.requests).toEqual([]);
    expect((await music.tracks()).filter((track) => !track.paused)).toEqual([]);

    await second.sound.click();
    await second.soundChoice('Music').check();
    await expect.poll(async () => (await music.tracks()).some((track) => !track.paused)).toBe(true);
  });

  test('reads the music kept "off" before the Sound button as No music (L2-185 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await page.addInitScript(() => localStorage.setItem('telo-ride.music', 'off'));

    const ride = await startRideInIbiza(page, bluetooth);

    await expect(ride.sound).toHaveAccessibleName('Sound: No music');
  });

  test('disables Music with "Can’t play", with no alert, when the track cannot be loaded (L2-176 AC7)', async ({
    page,
    bluetooth,
  }) => {
    await page.route('**/music/*', (route) => route.fulfill({ status: 404, body: 'Not found' }));

    const ride = await startRideInIbiza(page, bluetooth);
    await ride.sound.click();

    await expect(ride.soundChoice('Music')).toBeDisabled();
    await expect(ride.soundGroup).toContainText('Can’t play');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(ride.pause).toBeEnabled();
  });

  test('applies a choice while the ride is paused (L2-185 AC7)', async ({ page, bluetooth }) => {
    const ride = await startRideInIbiza(page, bluetooth);
    await ride.pause.click();
    await ride.sound.click();

    await ride.soundChoice('No music').check();
    await ride.resume.click();

    await expect(ride.sound).toHaveAccessibleName('Sound: No music');
    await expect(ride.pause).toBeVisible();
    expect((await music.tracks()).filter((track) => !track.paused)).toEqual([]);
  });
});

test.describe('The Sound button with the class video', () => {
  test('is not there: the video has its own sound (L2-185 AC6)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);

    await expect(ride.clock).toBeVisible();
    await expect(ride.sound).toHaveCount(0);
  });
});
