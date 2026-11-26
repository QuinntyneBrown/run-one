// Acceptance test
// Traces to: L1 (left out: group classes, the multiplayer service); ADR 0038
// Description: a class is always ridden solo. The Class has no choice between riding alone and with a group, only Start class; and an address that names
// a group session, `/ride?session=…`, starts no ride of its own (L2-087 AC4): it opens The Class, and the class is ridden solo from
// there, with Pause, no board, no request about a group session and no hub connection.
import { connectBike, skipFlyover } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { echelonBike } from './fixtures/echelon';
import { keptRideWith } from './fixtures/how-to-ride';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { TheClassPage } from './pages/the-class.page';

test.describe('Always solo', () => {
  test('The Class offers no group session (ADR 0038) @critical', async ({
    page,
    api,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const start = new TheClassPage(page);
    await start.open();

    await expect(start.title).toHaveText('Intervals to the Beat');
    await expect(start.start).toBeVisible();
    await expect(start.choice).toHaveCount(0);
    await expect(start.join).toHaveCount(0);
    expect(api.requests().filter((request) => request.includes('/sessions'))).toEqual([]);
  });

  test('an address with ?session= opens The Class, and the class is ridden solo with no hub connection (ADR 0038, L2-087 AC4)', async ({
    page,
    bluetooth,
  }) => {
    // The spec is about the ride and not the course: its files are held, so nothing is drawn.
    const files = await CourseFiles.install(page);
    files.hold();
    const asked: string[] = [];
    page.on('request', (request) => asked.push(new URL(request.url()).pathname));
    await bluetooth.remember(echelonBike);
    await keptRideWith(page, 'ibiza');
    const ride = new ClassRidePage(page);
    await ride.openWithSession('intervals-to-the-beat-1939');
    const home = new TheClassPage(page);
    await connectBike(bluetooth);
    await expect(home.start).toHaveText('Start class');
    await home.start.click();
    await skipFlyover(page);

    await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
    await expect(ride.pause).toBeVisible();
    await expect(ride.board).toHaveCount(0);
    expect(asked.filter((path) => path.startsWith('/hubs/') || path.includes('/sessions'))).toEqual(
      [],
    );
    await files.dispose();
  });
});
