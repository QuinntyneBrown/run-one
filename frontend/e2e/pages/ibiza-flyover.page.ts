import type { Locator, Page } from '@playwright/test';

/** Ibiza Flyover at `/ride` before a ride in Ibiza (docs/mocks/pages/ibiza-flyover/, L2-179). */
export class IbizaFlyoverPage {
  readonly root: Locator;
  readonly heading: Locator;
  readonly skip: Locator;
  readonly cancel: Locator;
  readonly scene: Locator;
  readonly loading: Locator;
  readonly place: Locator;
  readonly caption: Locator;
  readonly status: Locator;
  readonly lost: Locator;
  readonly retry: Locator;
  readonly canvas: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.ibiza-flyover');
    this.heading = page.getByRole('heading', { level: 1 });
    this.skip = page.getByRole('button', { name: 'Skip flyover', exact: true });
    this.cancel = page.locator('.ibiza-flyover__bar').getByRole('button', { name: 'Cancel' });
    this.scene = page.locator('.ibiza-flyover__scene');
    this.loading = page.locator('.ibiza-flyover__loading');
    this.place = page.locator('.ibiza-flyover__place');
    this.caption = page.locator('.ibiza-flyover__caption');
    this.status = page.locator('.ibiza-flyover__status');
    this.lost = page.locator('.ibiza-flyover__lost');
    this.retry = page.getByRole('button', { name: 'Try again', exact: true });
    this.canvas = page.locator('.ibiza-flyover__scene').getByRole('img', { name: /from above/ });
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }
}
