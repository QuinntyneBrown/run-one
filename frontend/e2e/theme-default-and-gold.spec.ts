// Acceptance test
// Traces to: L2-143 AC3
// Description: Gold is for a new best output alone: on no screen but a Class
// Done that beat the record does any element draw in gold.
//
// Given any screen but a Class Done with a new best, then no element's text, background or border is the gold of the
// theme; given a new best, then the output is.
import { echelonBike } from './fixtures/echelon';
import { openClassDone, soloClass } from './fixtures/class-done';
import { screens } from './fixtures/screens';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';

/** How many elements draw in the theme's gold (as text, fill or border). */
async function goldElements(page: Page): Promise<number> {
  return page.evaluate(() => {
    const probe = document.createElement('i');
    document.body.append(probe);
    const resolve = (token: string): string => {
      probe.style.color = `var(${token})`;
      return getComputedStyle(probe).color;
    };
    const golds = new Set([resolve('--color-gold'), resolve('--color-gold-fg')]);
    probe.remove();
    let count = 0;
    for (const element of document.body.querySelectorAll('*')) {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0 || style.visibility === 'hidden') continue;
      const colours = [style.color, style.backgroundColor, style.borderTopColor, style.fill];
      if (colours.some((colour) => golds.has(colour))) count++;
    }
    return count;
  });
}

test.describe('Gold is for a new best output', () => {
  for (const [screen, open] of Object.entries(screens)) {
    if (screen === 'Class Done') continue;
    test(`${screen} draws nothing in gold (L2-143 AC3)`, async ({ page, bluetooth, api }) => {
      const shown = await open({ page, bluetooth, api });
      await expect(shown).toBeAttached();
      await expect(page.locator('main')).toBeAttached();

      expect(await goldElements(page)).toBe(0);
    });
  }

  test('Class Done draws in gold for a new best and not for a ride that is not (L2-143 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await openClassDone(page, soloClass(100));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('New best output');
    expect(await goldElements(page)).toBeGreaterThan(0);

    await openClassDone(page, soloClass(500));
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('New best output');
    expect(await goldElements(page)).toBe(0);
  });
});
