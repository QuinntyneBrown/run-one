import type { Locator, Page } from '@playwright/test';
import { ClassHeader } from './class-header';

/** Page not found (L2-145): any address that matches no screen. */
export class NotFoundPage {
  readonly header: ClassHeader;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly backToClass: Locator;

  constructor(private readonly page: Page) {
    this.header = new ClassHeader(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.not-found .page__lead');
    this.backToClass = page.getByRole('link', { name: 'Back to the class' });
  }

  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
