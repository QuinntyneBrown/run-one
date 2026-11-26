import type { Page } from '@playwright/test';

/** A screen the app can open on at `/` (L2-167). */
export type OpeningScreen = 'Connect Bike' | 'The Class';

/**
 * Every screen the app draws while it opens, in order, so a spec can tell a rider never saw the wrong one for a
 * moment (L2-167). It watches the document from before the app's first script, by each screen's own block.
 */
export class FirstScreen {
  private constructor(private readonly page: Page) {}

  /** Starts watching, from the next page load. */
  static async watch(page: Page): Promise<FirstScreen> {
    await page.addInitScript(() => {
      const blocks: Record<string, string> = {
        'Connect Bike': '.connect',
        'The Class': '.the-class-page',
      };
      const drawn: string[] = [];
      Object.assign(window, { __screensDrawn: drawn });
      new MutationObserver(() => {
        for (const [screen, block] of Object.entries(blocks))
          if (!drawn.includes(screen) && document.querySelector(block)) drawn.push(screen);
      }).observe(document, { childList: true, subtree: true });
    });
    return new FirstScreen(page);
  }

  /** The screens drawn since the page loaded, first to last. */
  drawn(): Promise<OpeningScreen[]> {
    return this.page.evaluate(
      () => (window as unknown as { __screensDrawn: OpeningScreen[] }).__screensDrawn,
    );
  }
}
