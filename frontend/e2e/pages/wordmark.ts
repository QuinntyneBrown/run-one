import type { Locator, Page } from '@playwright/test';

/**
 * The wordmark TELO RIDE 1 in the page's header, whichever header the screen has (L2-172,
 * docs/detailed-designs/ui/show-the-wordmark): the lockup, one image named for a screen reader, and the words it draws.
 */
export class Wordmark {
  /** The lockup: the mark and the wordmark, `role="img"`. */
  readonly lockup: Locator;
  /** The words as drawn, "TELO" and the product after it. */
  readonly words: Locator;
  /** The product's part of the words, in the signal colour. */
  readonly product: Locator;

  constructor(page: Page) {
    this.lockup = page.locator('header .lockup');
    this.words = this.lockup.locator('.wordmark');
    this.product = this.words.locator('.wordmark__product');
  }

  /** The colour the product's part is drawn in. */
  productColour(): Promise<string> {
    return this.product.evaluate((element) => getComputedStyle(element).color);
  }
}
