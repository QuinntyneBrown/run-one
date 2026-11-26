import type { Locator, Page } from '@playwright/test';

/** Connect Bike at `/connect` (docs/mocks/pages/connect-bike/). */
export class ConnectBikePage {
  /** The lockup and Full screen above the screen's content. */
  readonly header: Locator;
  readonly fullScreen: Locator;
  /** Any navigation on the screen; Connect Bike has none. */
  readonly navigation: Locator;
  /** The screen's content, the landmark the skip link lands on. */
  readonly main: Locator;
  readonly photo: Locator;
  /** The column with the title, the device card and the "Works with" list. */
  readonly content: Locator;
  readonly title: Locator;
  /** The sentence under the title, which names the product. */
  readonly lead: Locator;
  readonly deviceName: Locator;
  readonly deviceIdentifier: Locator;
  readonly pairButton: Locator;
  /** The spinner the pair button carries while pairing runs. */
  readonly pairSpinner: Locator;
  readonly searching: Locator;
  readonly pairedCheck: Locator;
  readonly worksWith: Locator;
  readonly worksWithBikes: Locator;
  readonly worksWithStatuses: Locator;
  /** The device card with the pair button under it. */
  readonly pairArea: Locator;
  /** The alert that stands in for the device card when the bike cannot be reached. */
  readonly blocker: Locator;
  readonly blockerIcon: Locator;
  readonly blockerTitle: Locator;
  readonly blockerBody: Locator;
  readonly blockerAction: Locator;

  constructor(private readonly page: Page) {
    this.header = page.locator('.connect__header');
    this.fullScreen = this.header.getByRole('button', { name: 'Full screen' });
    this.navigation = page.getByRole('navigation');
    this.main = page.getByRole('main');
    this.photo = page.locator('.connect__photo');
    this.content = page.locator('.connect__content');
    this.title = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.connect__lead');
    this.deviceName = page.locator('.connect-device__name');
    this.deviceIdentifier = page.locator('.connect-device__signal');
    this.pairButton = page.locator('.connect__pair-btn');
    this.pairSpinner = this.pairButton.locator('.icon--spin');
    this.searching = page.locator('.connect-device__searching');
    this.pairedCheck = page.getByLabel('Paired', { exact: true });
    this.worksWith = page.getByRole('region', { name: 'Works with' });
    this.worksWithBikes = page.locator('.connect-works__item > :first-child');
    this.worksWithStatuses = page.locator('.connect-works__status');
    this.pairArea = page.locator('.connect__pair');
    this.blocker = page.getByRole('alert');
    this.blockerIcon = page.locator('.connect-blocker__icon');
    this.blockerTitle = page.locator('.connect-blocker__title');
    this.blockerBody = page.locator('.connect-blocker__body');
    this.blockerAction = page.locator('.connect-blocker__retry');
  }

  /**
   * Opens Connect Bike; `simulate` adds `?simulate`, which only a development build honours, and `diagnose` adds
   * `?diagnose`, which switches the diagnostic recording on (L2-178 AC2).
   */
  async open(options: { simulate?: boolean; diagnose?: boolean } = {}): Promise<void> {
    const query = [options.simulate ? 'simulate' : '', options.diagnose ? 'diagnose' : '']
      .filter((name) => name !== '')
      .join('&');
    await this.page.goto(query === '' ? '/connect' : `/connect?${query}`);
  }

  /** The top of each "Works with" row, in order: equal tops share a line. */
  async worksWithRowTops(): Promise<number[]> {
    const boxes = await this.page
      .locator('.connect-works__item')
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    return boxes.map(Math.round);
  }

  /** Whether the header sits inside the main landmark; the mock draws it above it. */
  headerInMain(): Promise<boolean> {
    return this.header.evaluate((header) => header.closest('main') !== null);
  }

  /** Where the photo, the content column and the body that holds them are drawn, in CSS pixels. */
  async layout(): Promise<{
    photo: { x: number; y: number; width: number; height: number };
    content: { x: number; y: number; width: number; height: number };
    body: { x: number; y: number; width: number; height: number };
    headerBottom: number;
  }> {
    const box = async (locator: Locator) => {
      const b = await locator.evaluate((element) => {
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      return b;
    };
    const header = await box(this.header);
    return {
      photo: await box(this.photo),
      content: await box(this.content),
      body: await box(this.page.locator('.connect__body')),
      headerBottom: header.y + header.height,
    };
  }

  /** Presses the pair button from the keyboard: focus, then Enter. */
  async pairByKeyboard(): Promise<void> {
    await this.pairButton.focus();
    await this.page.keyboard.press('Enter');
  }

  /** Presses the alert's action from the keyboard: focus, then Enter. */
  async pressBlockerAction(): Promise<void> {
    await this.blockerAction.focus();
    await this.page.keyboard.press('Enter');
  }

  /** How far the page can be scrolled sideways, in CSS pixels: 0 when the screen fits its window. */
  sidewaysOverflow(): Promise<number> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  }

  async pair(): Promise<void> {
    await this.pairButton.click();
  }
}
