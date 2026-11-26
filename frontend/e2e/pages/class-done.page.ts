import { type Locator, type Page, expect } from '@playwright/test';

/** Class Done at `/done` (docs/mocks/pages/class-done/): the header, the output, its facts and Done. */
export class ClassDonePage {
  /** The class in the header: "Intervals to the Beat". */
  readonly title: Locator;
  /** The hidden heading: "Class done". */
  readonly heading: Locator;
  /** The output's number: "351". */
  readonly number: Locator;
  /** The output line: the number and "kJ". */
  readonly output: Locator;
  /** The output's unit: "kJ". */
  readonly unit: Locator;
  readonly time: Locator;
  readonly average: Locator;
  /** The share of the ride on target: "84%". */
  readonly onTarget: Locator;
  readonly done: Locator;
  readonly main: Locator;
  /** "Previous best" or "Best" with its kJ; absent for the first ride. */
  readonly bestFact: Locator;
  /** "Your 17 efforts, average watts". */
  readonly effortsTitle: Locator;
  /** The notice that the ride could not be saved on this device (L2-168 AC4). */
  readonly notice: Locator;
  /** The efforts' bars with their watts, in plan order. */
  readonly efforts: Locator;
  /** The bar of one effort. */
  readonly bars: Locator;
  /** The intensity question's card above Done, when the ride ended away from the default (L2-184). */
  readonly intensityCard: Locator;
  /** "Make 7/10 your intensity?" */
  readonly intensityTitle: Locator;
  /** "Your next rides start at 7/10. It’s kept on this device." */
  readonly intensityText: Locator;
  /** The card's answer once given: "7/10 is now your intensity." (L2-184 AC2, AC5). */
  readonly intensityStatus: Locator;
  readonly makeDefault: Locator;
  /** "Keep 5/10": the default the ride's intensity would replace. */
  readonly keepDefault: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('.class-done__class');
    this.heading = page.getByRole('heading', { level: 1 });
    this.number = page.locator('.class-done__number');
    this.output = page.locator('.class-done__output');
    this.unit = page.locator('.class-done__unit');
    this.time = this.fact('Time');
    this.average = this.fact('Average');
    this.onTarget = this.fact('On target');
    this.done = page.getByRole('link', { name: 'Done', exact: true });
    this.main = page.locator('main');
    this.notice = page.locator('.class-done__notice');
    this.effortsTitle = page.locator('.class-done__efforts-title');
    this.efforts = page.locator('.class-done__effort');
    this.bars = page.locator('.class-done__bar');
    this.bestFact = page.locator('.class-done__fact').filter({ hasText: /best/i });
    this.intensityCard = page.locator('.class-done__intensity');
    this.intensityTitle = this.intensityCard.getByRole('heading', { name: /intensity\?$/ });
    this.intensityText = this.intensityCard.locator('.class-done__intensity-text');
    this.intensityStatus = this.intensityCard.getByRole('status');
    this.makeDefault = page.getByRole('button', { name: 'Make it my default' });
    this.keepDefault = page.getByRole('button', { name: /^Keep \d+\/10$/ });
  }

  /** Where `part` is drawn in the window, in CSS pixels. */
  drawn(part: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
    return part.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    });
  }

  /** The value of the fact with this label. */
  private fact(label: string): Locator {
    return this.page
      .locator('.class-done__fact')
      .filter({ has: this.page.locator('.class-done__fact-label', { hasText: label }) })
      .locator('.class-done__fact-value');
  }

  /**
   * Steps the paused clock until the lazily loaded Class Done has rendered: through the finish banner and the roll-out
   * that follow the finish, 8.4 s on the clock (L2-181, L2-182), when the ride has just finished.
   */
  async shown(): Promise<void> {
    await expect(async () => {
      await this.page.clock.runFor(500);
      await expect(this.number).toBeVisible({ timeout: 50 });
    }).toPass({ intervals: [0], timeout: 25_000 });
  }

  async open(): Promise<void> {
    await this.page.goto('/done');
  }
}
