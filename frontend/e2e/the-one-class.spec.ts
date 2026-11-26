// Acceptance test
// Traces to: L2-080 AC1 to AC4, AC6; L2-027 AC1; ADR 0037; ADR 0042
// Description: Telo Ride 1 has one class, Intervals to the Beat, shipped with the app. `/` shows it with no request to
// an API. The ride follows its plan, the one Ibiza Sunset Strip was built from, segment by segment to 20:00, sending
// each target resistance. A class that breaks a rule is not offered: `/` says it can't be loaded, and the ride's
// address leads back there. No other class has an address.
import { startClassRide } from './fixtures/class-ride';
import { echelonBike, targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ShippedClassData, theClass } from './fixtures/the-class';
import { ClassRidePage } from './pages/class-ride.page';
import { TheClassPage } from './pages/the-class.page';
import { NotFoundPage } from './pages/not-found.page';
import { ClassDonePage } from './pages/class-done.page';

const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const KIND = { 'warm-up': 'Warm-up', work: 'Work', recover: 'Recover', 'cool-down': 'Cool-down' };

test.describe('The one class', () => {
  test('`/` shows Intervals to the Beat by GCN Training, 20:00 long, and asks no API for it (L2-080 AC1, AC4) @critical', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    await bluetooth.remember(echelonBike);
    const start = new TheClassPage(page);
    await start.open();

    await expect(start.title).toHaveText('Intervals to the Beat');
    await expect(start.meta).toContainText('GCN Training');
    await expect(start.meta).toContainText('Intervals');
    await expect(start.duration).toHaveText('20:00');
    await expect(start.summary).toHaveText(theClass.summary);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    const [player] = await youtube.players();
    expect(player.videoId).toBe('il_OFz6o42I');
    expect(player.playerVars).toMatchObject({ start: 3 });
    expect(api.requests()).toEqual([]);
  });

  test('the ride follows the plan Ibiza Sunset Strip was built from, segment by segment to 20:00 (L2-080 AC2, AC6, L2-027 AC1) @critical', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    const targets = (): string[] =>
      bluetooth
        .writes()
        .map((write) => write.hex)
        .filter((hex) => hex.startsWith('F0 B1 '));

    await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
    expect(theClass.segments).toHaveLength(33);
    let at = 0;
    for (const [index, segment] of theClass.segments.entries()) {
      await test.step(`segment ${index + 1} at ${clock(at)}`, async () => {
        await expect(ride.clock).toHaveText(`${clock(at)} / 20:00`);
        await expect(ride.segmentKind).toHaveText(KIND[segment.kind]);
        await expect(ride.segmentLeft).toHaveText(clock(segment.duration));
        await expect(ride.cadenceHint).toHaveText(`Aim ${segment.cadenceAim}`);
        await expect.poll(() => targets().at(-1)).toBe(targetResistanceWrite(segment.level));
      });
      at += segment.duration;
      if (at < theClass.lengthSeconds) {
        await page.clock.runFor(segment.duration * 1000);
      }
    }
    // Every segment's level went to the bike once, in the plan's order: back-to-back efforts each have their own.
    expect(targets()).toEqual(
      theClass.segments.map((segment) => targetResistanceWrite(segment.level)),
    );

    await page.clock.runFor(theClass.segments.at(-1)!.duration * 1000);
    await page.clock.runFor(1000);
    const done = new ClassDonePage(page);
    await done.shown();
    await expect(done.time).toHaveText('20:00');
  });

  test('a class that breaks a rule is not offered: `/` says it can’t be loaded, and Reload reads it again (L2-080 AC3)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await bluetooth.remember(echelonBike);
    const data = await ShippedClassData.break(page);
    const start = new TheClassPage(page);
    await start.open();

    await expect(start.unavailable).toHaveText(
      'The class can’t be loaded. Reload Telo Ride 1 to try again.',
    );
    expect(data.brokenScripts()).toBeGreaterThan(0);
    await expect(start.title).toHaveText('The class');
    await expect(start.start).toHaveCount(0);
    await expect(start.summary).toHaveCount(0);

    await data.mend();
    await start.reload.click();

    await expect(start.title).toHaveText('Intervals to the Beat');
    await expect(start.unavailable).toHaveCount(0);
    await expect(start.start).toBeVisible();
    expect(api.requests()).toEqual([]);
  });

  test('the ride’s address opens no ride of a class that breaks a rule: it leads to `/` (L2-080 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await ShippedClassData.break(page);
    await new ClassRidePage(page).open();

    const start = new TheClassPage(page);
    await expect(start.unavailable).toHaveText(
      'The class can’t be loaded. Reload Telo Ride 1 to try again.',
    );
    await expect(page).toHaveURL('/');
    expect(bluetooth.writes().filter((write) => write.hex.startsWith('F0 B1 '))).toEqual([]);
  });

  for (const id of ['hiit-cardio-30', 'endurance-180', 'gcn-30-hiit']) {
    test(`no other class can be ridden: /classes/${id}/ride is page not found (L2-080 AC4)`, async ({
      page,
      bluetooth,
      api,
    }) => {
      await bluetooth.remember(echelonBike);
      const notFound = new NotFoundPage(page);
      await notFound.open(`/classes/${id}/ride?mode=solo`);

      await expect(notFound.heading).toHaveText('This page doesn’t exist.');
      expect(api.requests()).toEqual([]);
    });
  }
});
