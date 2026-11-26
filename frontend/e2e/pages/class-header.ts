import type { Locator, Page } from '@playwright/test';

/**
 * The slim header (design-system block class-header) of The Class and Page not found: the wordmark, the bike's
 * status on The Class, and Full screen. It has no navigation (L2-167 AC4, ADR 0040).
 */
export class ClassHeader {
  readonly root: Locator;
  readonly lockup: Locator;
  /** The navigation Telo Ride drew, and any link; Telo Ride 1 has no menu. */
  readonly nav: Locator;
  readonly links: Locator;
  /** The bike status on The Class, a link to Connect Bike (L2-019). */
  readonly bike: Locator;
  /** The streak and the level link Telo Ride drew; Telo Ride 1 has neither (ADR 0039). */
  readonly streak: Locator;
  readonly level: Locator;
  /** Full screen at the end of the header, named for what it does next (L2-144). */
  readonly fullScreen: Locator;
  readonly exitFullScreen: Locator;
  private readonly product: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.class-header');
    this.lockup = this.root.locator('.lockup');
    this.product = this.lockup.locator('.wordmark__product');
    this.nav = this.root.getByRole('navigation');
    this.links = this.root.getByRole('link');
    this.bike = this.root.locator('.the-class__bike');
    this.streak = this.root.locator('.app-header__streak');
    this.level = this.root.locator('.app-header__level');
    this.fullScreen = this.root.getByRole('button', { name: 'Full screen', exact: true });
    this.exitFullScreen = this.root.getByRole('button', { name: 'Exit full screen', exact: true });
  }

  /** Whether the page is shown in full screen. */
  inFullScreen(): Promise<boolean> {
    return this.page.evaluate(() => document.fullscreenElement !== null);
  }

  /** Whether the wordmark's face (Barlow Condensed 800 italic) has loaded from the bundled fonts. */
  wordmarkFontLoaded(): Promise<boolean> {
    return this.page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some(
        (face) =>
          face.family.replace(/["']/g, '') === 'Barlow Condensed' &&
          face.style === 'italic' &&
          face.weight === '800' &&
          face.status === 'loaded',
      );
    });
  }

  productColour(): Promise<string> {
    return this.product.evaluate((element) => getComputedStyle(element).color);
  }
}
