import type { Page } from '@playwright/test';

/** Where the app keeps the rider's choice of how to ride (`HOW_TO_RIDE_KEY`). */
const KEY = 'telo-ride.ride-with';

/**
 * Call before the page loads: the rider chose this way to ride on an earlier visit (L2-173 AC2). It is written once,
 * so a choice the spec makes afterwards survives a reload.
 */
export async function keptRideWith(page: Page, way: 'video' | 'ibiza'): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem(`${key}.given`)) return;
      sessionStorage.setItem(`${key}.given`, '1');
      localStorage.setItem(key, value);
    },
    [KEY, way] as const,
  );
}
