import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __fakeClipboard?: { texts: string[]; refuses: boolean };
  }
}

/**
 * A fake `navigator.clipboard`, installed before the app loads, so no spec writes to the real clipboard (headless
 * Chromium asks for a permission first). It keeps every text the page copied, in order, across reloads of the page,
 * and can refuse as a browser does when the rider has blocked the clipboard.
 */
export class ClipboardFixture {
  private constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<ClipboardFixture> {
    await page.addInitScript(() => {
      const state = { texts: [] as string[], refuses: false };
      window.__fakeClipboard = state;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText(text: string): Promise<void> {
            if (state.refuses)
              return Promise.reject(
                new DOMException('Write permission denied.', 'NotAllowedError'),
              );
            state.texts.push(text);
            return Promise.resolve();
          },
        },
      });
    });
    return new ClipboardFixture(page);
  }

  /** From now on the browser refuses to copy, on the page that is open. */
  async refuse(): Promise<void> {
    await this.page.evaluate(() => {
      if (window.__fakeClipboard) window.__fakeClipboard.refuses = true;
    });
  }

  /** Every text the page copied since it loaded, in order. */
  copied(): Promise<string[]> {
    return this.page.evaluate(() => window.__fakeClipboard?.texts ?? []);
  }
}
