import type { Page } from '@playwright/test';

/**
 * Class Done as a reload finds it: the result a finished ride left in the navigation's state. The first screen has
 * rendered before the state is written, so the router's own first navigation does not write over it.
 */
export async function openClassDone(page: Page, state: object): Promise<void> {
  await page.goto('/');
  await page.locator('main').waitFor({ state: 'attached' });
  await page.evaluate((s) => history.replaceState(s, '', '/done'), state);
  await page.reload();
}

/** The watts of the class's 17 efforts in a ride that rises and falls: effort 9 is the strongest, at 427 W. */
export const EFFORTS = [
  407, 380, 398, 378, 369, 359, 349, 417, 427, 420, 400, 390, 380, 370, 360, 350, 340,
] as const;

/**
 * Intervals to the Beat, ridden alone to its end, whose output is 341.6 kJ (342 kJ whole), with `previousBestKj` the
 * best before it: 342 kJ by default, which it ties.
 */
export function soloClass(
  previousBestKj: number | null = 342,
  efforts: readonly number[] = EFFORTS,
  saved = true,
) {
  return {
    classResult: {
      classId: 'intervals-to-the-beat',
      title: 'Intervals to the Beat',
      elapsedSeconds: 1200,
      outputKj: 341.6,
      onTargetShare: 0.838,
      previousBestKj,
      efforts,
      saved,
    },
  };
}
