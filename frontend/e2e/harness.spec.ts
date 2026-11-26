// Acceptance test
// Traces to: L2-148 AC1
// Description: the shared fixture stands in for the bike: a spec offers a fake bike, every write the page makes is
// recorded, a notification the spec pushes reaches the page, and any Bluetooth call the spec did not expect fails it;
// API requests get the answers the spec declared, and one it did not answer fails it.
import { ECHELON_NOTIFY, ECHELON_SERVICE, ECHELON_WRITE, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { AppCalls } from './pages/app-calls';
import { TheClassPage } from './pages/the-class.page';

test.describe('Test harness', () => {
  test(
    'the fake bike records every write and pushes notifications on demand (L2-148 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.offer(echelonBike);
      await new TheClassPage(page).open();
      const app = new AppCalls(page);

      await app.pairBike(ECHELON_SERVICE, ECHELON_WRITE, ECHELON_NOTIFY);
      await app.write('F0 A1 00 91');
      await bluetooth.notify(ECHELON_NOTIFY, [0xf0, 0xd1, 0x09, 0x00, 0xca]);

      expect(bluetooth.writes()).toEqual([
        { characteristic: ECHELON_WRITE, hex: 'F0 A1 00 91', withResponse: true },
      ]);
      await expect.poll(() => app.heard()).toEqual(['F0 D1 09 00 CA']);
    },
  );

  test('a Bluetooth call the spec did not expect fails it (L2-148 AC1)', async ({ page }) => {
    test.fail(true, 'the guard must fail a spec whose page asks for a bike nobody offered');
    await new TheClassPage(page).open();

    await new AppCalls(page).requestAnyBike();
  });

  test('an API request gets the answer the spec declared (L2-148 AC1)', async ({ page, api }) => {
    api.answer('GET', '/api/harness-probe', { xp: 1240, level: 4 });
    await new TheClassPage(page).open();

    const response = await new AppCalls(page).request('GET', '/api/harness-probe');

    expect(response).toEqual({ status: 200, body: { xp: 1240, level: 4 } });
  });

  test('an API request the spec did not answer fails it (L2-148 AC1)', async ({ page }) => {
    test.fail(true, 'the guard must fail a spec whose page calls an API nobody answered');
    await new TheClassPage(page).open();

    await new AppCalls(page).request('GET', '/api/harness-probe');
  });
});
