// Acceptance test
// Traces to: L2-169 AC1 to AC6; L2-142 AC2, AC3
// Description: Class Done lists the class's 17 efforts in plan order as bars, each with its watts. A bar's height is its
// watts as a share of the strongest's; the strongest is set apart in colour and said to a screen reader as "your
// strongest" (the earliest where they tie); with every effort at 0 W none is. The 17 bars fit at 320 px without a
// figure overlapping the next. They rise in turn, 40 ms apart, and with reduced motion they are simply there.
//
// Given a finished ride, when Class Done shows, then "Your 17 efforts, average watts" lists 17 bars in plan order.
// Given the efforts, then each bar is its watts over the strongest's, and the strongest reads "your strongest".
// Given every effort is 0 W, then all 17 bars are at their minimum and none is the strongest.
// Given a viewport 320 px wide, then the bars and their figures fit without sideways scrolling or overlap.
// Given a class ridden to its end pedalling in the first effort only, then that effort is the strongest.
import { startClassRide } from './fixtures/class-ride';
import { EFFORTS, openClassDone, soloClass } from './fixtures/class-done';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassDonePage } from './pages/class-done.page';

test.describe('Class Done’s efforts', () => {
  test.beforeEach(async ({ bluetooth }) => {
    await bluetooth.remember(echelonBike);
  });

  test('lists the 17 efforts in plan order, each bar its watts over the strongest’s, the strongest set apart (L2-169 AC1, AC3, AC4)', async ({
    page,
  }) => {
    await openClassDone(page, soloClass());
    const done = new ClassDonePage(page);

    await expect(done.effortsTitle).toHaveText('Your 17 efforts, average watts');
    await expect(done.efforts).toHaveCount(17);
    await expect(done.efforts.first()).toHaveText('Effort 1: 407 W');
    await expect(done.efforts.nth(8)).toHaveText('Effort 9: 427 W, your strongest');
    await expect(done.efforts.nth(8)).toHaveClass(/class-done__effort--peak/);
    await expect(page.locator('.class-done__effort--peak')).toHaveCount(1);
    // The strongest is full height; the first is 407 of 427 (layout heights: the bars are still rising).
    const [strongest, first] = await done.bars.evaluateAll((bars) =>
      [bars[8], bars[0]].map((bar) => (bar as HTMLElement).offsetHeight),
    );
    expect(first / strongest).toBeCloseTo(407 / 427, 1);
  });

  test('sets the earliest apart where efforts tie for the strongest (L2-169 AC4)', async ({
    page,
  }) => {
    await openClassDone(
      page,
      soloClass(
        342,
        EFFORTS.map(() => 300),
      ),
    );
    const done = new ClassDonePage(page);

    await expect(page.locator('.class-done__effort--peak')).toHaveCount(1);
    await expect(done.efforts.first()).toHaveText('Effort 1: 300 W, your strongest');
    await expect(done.efforts.nth(1)).toHaveText('Effort 2: 300 W');
  });

  test('draws every bar at its minimum, and none the strongest, when every effort is 0 W (L2-169 AC5)', async ({
    page,
  }) => {
    await openClassDone(page, soloClass(342, Array<number>(17).fill(0)));
    const done = new ClassDonePage(page);

    await expect(done.efforts).toHaveCount(17);
    await expect(page.locator('.class-done__effort--peak')).toHaveCount(0);
    await expect(done.efforts.first()).toHaveText('Effort 1: 0 W');
    const heights = await done.bars.evaluateAll((bars) =>
      bars.map((bar) => (bar as HTMLElement).offsetHeight),
    );
    expect(new Set(heights).size).toBe(1);
    expect(heights[0]).toBeGreaterThan(0);
    expect(heights[0]).toBeLessThan(10);
  });

  test('fits 17 bars and their figures in 320 px without sideways scrolling or overlap (L2-169 AC6)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openClassDone(page, soloClass());
    const done = new ClassDonePage(page);
    await expect(done.efforts).toHaveCount(17);

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const figures = await page
      .locator('.class-done__watts')
      .evaluateAll((all) => all.map((figure) => figure.getBoundingClientRect().toJSON()));
    for (let i = 1; i < figures.length; i++) {
      expect(figures[i].left, `figure ${i + 1} clear of figure ${i}`).toBeGreaterThanOrEqual(
        figures[i - 1].right,
      );
    }
    expect(figures[0].left).toBeGreaterThanOrEqual(0);
    expect(figures[16].right).toBeLessThanOrEqual(320);
  });

  test('the bars rise in turn, 40 ms apart, and with reduced motion they are simply there (L2-142 AC2, AC3)', async ({
    page,
  }) => {
    await openClassDone(page, soloClass());
    const done = new ClassDonePage(page);
    await expect(done.bars).toHaveCount(17);
    await expect(done.bars.nth(3)).toHaveCSS('animation-delay', '0.12s');
    await expect(done.bars.nth(3)).toHaveCSS('animation-duration', '0.25s');
    await expect(done.bars.first()).toHaveCSS('animation-delay', '0s');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(done.bars.nth(3)).toHaveCSS('animation-name', 'none');
  });

  test('a class ridden to its end, pedalling in its first effort only, has that effort the strongest (L2-169 AC2)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);
    // The first effort is 2:30 to 3:15 of the ride's clock.
    await page.clock.fastForward('02:30');
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(19));
    for (let second = 0; second < 44; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(70));
      await page.clock.runFor(4000);
    }
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(0));
    await page.clock.fastForward('16:40');
    await page.clock.runFor(3000);
    const done = new ClassDonePage(page);
    await done.shown();

    await expect(done.efforts).toHaveCount(17);
    await expect(done.efforts.first()).toHaveText(/^Effort 1: [1-9]\d* W, your strongest$/);
    await expect(done.efforts.nth(1)).toHaveText('Effort 2: 0 W');
  });
});
