import type { Page } from '@playwright/test';

/**
 * Call before the page loads: the device has a home bar this many CSS pixels tall at the bottom of its display, so
 * `env(safe-area-inset-bottom)` is that tall for a page that covers the display (`viewport-fit=cover`), as on a phone
 * without a home button (L2-171 AC3).
 */
export async function homeBar(page: Page, height: number): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setSafeAreaInsetsOverride', { insets: { bottom: height } });
}
