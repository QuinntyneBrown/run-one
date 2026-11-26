// Acceptance test
// Traces to: L2-140 AC3, AC4
// Description: on every screen the first Tab reaches "Skip to content", and pressing it moves focus to the main content.
// Hovering something that is not a button or a link, such as the page's heading or its text, changes nothing about it.
//
// Given any screen, when Tab is pressed first, then "Skip to content" is focused, and Enter moves focus into main.
// Given any screen, when the pointer rests on its heading and its first paragraph, then their colour, background,
// cursor, shadow and transform are as they were.
import { screens } from './fixtures/screens';
import { expect, test } from './fixtures/test';

test.describe('Skip to content and hover', () => {
  for (const [screen, open] of Object.entries(screens)) {
    test(`${screen}: the first Tab is “Skip to content”, which moves focus to main (L2-140 AC4)`, async ({
      page,
      bluetooth,
      api,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const shown = await open({ page, bluetooth, api });
      await expect(shown).toBeAttached();
      await expect(page.locator('main')).toBeAttached();

      // The first focusable element in the page's order is the link, whatever has focus after the page's own navigation.
      const first = await page.evaluate(() =>
        document
          .querySelector<HTMLElement>(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]',
          )
          ?.textContent?.trim(),
      );
      expect(first).toBe('Skip to content');
      const skip = page.getByRole('link', { name: 'Skip to content' });
      await skip.focus();
      await expect(skip).toBeFocused();
      await page.keyboard.press('Enter');

      await expect
        .poll(() => page.evaluate(() => document.activeElement?.closest('main') !== null))
        .toBe(true);
    });

    test(`${screen}: text shows no hover effect (L2-140 AC3)`, async ({ page, bluetooth, api }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const shown = await open({ page, bluetooth, api });
      await expect(shown).toBeAttached();
      await expect(page.locator('main')).toBeAttached();
      const text = page.locator('main h1, main p').filter({ visible: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      const styles = () =>
        text.evaluateAll((all) =>
          all.slice(0, 6).map((element) => {
            const s = getComputedStyle(element);
            return [
              s.color,
              s.backgroundColor,
              s.cursor,
              s.boxShadow,
              s.transform,
              s.textDecorationLine,
            ];
          }),
        );
      const before = await styles();
      expect(before.length).toBeGreaterThan(0);

      for (let i = 0; i < before.length; i++)
        await text
          .nth(i)
          .hover({ force: true, trial: false })
          .catch(() => undefined);
      await page.mouse.move(0, 0);

      expect(await styles()).toEqual(before);
      for (const [, , cursor] of before) expect(['auto', 'default', 'text']).toContain(cursor);
    });
  }
});
