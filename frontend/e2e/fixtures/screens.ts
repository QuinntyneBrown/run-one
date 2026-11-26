import type { Locator, Page } from '@playwright/test';
import { startClassRide } from './class-ride';
import { echelonBike } from './echelon';
import type { FakeBluetooth } from './fake-bluetooth';
import type { ApiFixture } from './api';
import { openClassDone, soloClass } from './class-done';
import { TheClassPage } from '../pages/the-class.page';
import { ConnectBikePage } from '../pages/connect-bike.page';
import { NotFoundPage } from '../pages/not-found.page';
import { ClassDonePage } from '../pages/class-done.page';

/** What opening a screen needs from the shared fixture. */
export interface ScreenFixtures {
  readonly page: Page;
  readonly bluetooth: FakeBluetooth;
  readonly api: ApiFixture;
}

/** Opens a screen with a remembered bike and answers what it reads; resolves to what shows once it has rendered. */
export type Opener = (fixtures: ScreenFixtures) => Promise<Locator>;

const remembered =
  (open: (page: Page) => Promise<Locator>): Opener =>
  async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    return open(page);
  };

/**
 * Every screen of the app (ADR 0040), by the name the specs use, and how to open it (L2-139 AC1): the fit-every-width spec opens
 * each at 320 and 2560 px, and the responsive sweep (e2e/sweeps/) at every breakpoint between.
 */
export const screens: Record<string, Opener> = {
  'The Class': remembered(async (page) => {
    const start = new TheClassPage(page);
    await start.open();
    return start.title;
  }),
  'Connect Bike': async ({ page }) => {
    const connect = new ConnectBikePage(page);
    await connect.open();
    return connect.title;
  },
  'Page not found': remembered(async (page) => {
    const notFound = new NotFoundPage(page);
    await notFound.open('/nowhere');
    return notFound.heading;
  }),
  'Class Done': async ({ page }) => {
    await openClassDone(page, soloClass());
    return new ClassDonePage(page).heading;
  },
  'a class ride': async ({ page, bluetooth, api }) =>
    (await startClassRide(page, bluetooth, api)).clock,
};
