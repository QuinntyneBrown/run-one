import type { Locator, Page } from '@playwright/test';
import { ClassHeader } from './class-header';
import { RIDE_ADDRESS } from './class-ride.page';

/**
 * The Class at `/` (docs/mocks/pages/the-class/): the header with the bike status, the video's box, the class's
 * words and length, "Ride with", what the bike will do and the one start button.
 */
export class TheClassPage {
  readonly header: ClassHeader;
  readonly skipLink: Locator;
  readonly main: Locator;
  /** The header's bike status, a link to Connect Bike (L2-019). */
  readonly bike: Locator;
  readonly bikeIcon: Locator;
  readonly bikeAction: Locator;
  /**
   * The alert under the header in a blocked browser (L2-008 AC2, L2-009 AC1): its icon, title, sentence and one action,
   * Copy link or Open over HTTPS.
   */
  readonly notice: Locator;
  readonly noticeIcon: Locator;
  readonly noticeTitle: Locator;
  readonly noticeBody: Locator;
  readonly noticeAction: Locator;
  /** Every alert on the screen, whatever draws it. */
  readonly alerts: Locator;
  /** What shows in the class's place when the class breaks a rule (the-class/cannot-load), with Reload. */
  readonly unavailable: Locator;
  readonly reload: Locator;
  readonly title: Locator;
  readonly meta: Locator;
  readonly summary: Locator;
  readonly duration: Locator;
  readonly durationLabel: Locator;
  /** The video's box: the class cover, the element the player embeds in, and the course's still. */
  readonly video: Locator;
  readonly cover: Locator;
  readonly player: Locator;
  readonly still: Locator;
  /** "What the bike will do" (L2-084 AC2): the card, its heading, the average, the resistance profile and the line. */
  readonly plan: Locator;
  readonly planTitle: Locator;
  readonly planWatts: Locator;
  readonly profile: Locator;
  readonly profileBars: Locator;
  readonly effortBars: Locator;
  readonly planNote: Locator;
  /** The plan chart carried over from Telo Ride, with the length and the structure line; The Class no longer has it. */
  readonly carriedOverPlan: Locator;
  /** "Ride with" (L2-173): the radio group and its two options. */
  readonly rideWith: Locator;
  readonly options: Locator;
  readonly classVideo: Locator;
  readonly ibiza: Locator;
  readonly ibizaDetail: Locator;
  /** The start button the layout shows: in the details column from lg, pinned to the bottom below it. */
  readonly start: Locator;
  readonly startHint: Locator;
  /** A returning rider's record: Rides, Best output and Last time (L2-084 AC8). */
  readonly stats: Locator;
  /** What the layout places (L2-171): the video's place, the details column and the bar pinned under one column. */
  readonly media: Locator;
  readonly info: Locator;
  readonly footer: Locator;
  /** The choice between riding alone and with a group that Telo Ride had; Telo Ride 1 has none (ADR 0038). */
  readonly choice: Locator;
  /** Join, which Telo Ride offered for a group session; Telo Ride 1 has none. */
  readonly join: Locator;

  constructor(private readonly page: Page) {
    this.header = new ClassHeader(page);
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.main = page.locator('main#main');
    this.bike = page.locator('.the-class__bike');
    this.bikeIcon = this.bike.locator('.the-class__bike-icon');
    this.bikeAction = this.bike.locator('.the-class__bike-action');
    this.notice = page.locator('.browser-notice');
    this.noticeIcon = this.notice.locator('.browser-notice__icon');
    this.noticeTitle = this.notice.locator('.browser-notice__title');
    this.noticeBody = this.notice.locator('.browser-notice__body');
    this.noticeAction = this.notice.locator('.browser-notice__action');
    this.alerts = page.getByRole('alert');
    this.unavailable = page.locator('.the-class__unavailable').getByRole('alert');
    this.reload = page.getByRole('button', { name: 'Reload' });
    this.title = page.getByRole('heading', { level: 1 });
    this.meta = page.locator('.the-class__meta');
    this.summary = page.locator('.the-class__summary');
    this.duration = page.locator('.the-class__duration');
    this.durationLabel = page.locator('.the-class__duration-label');
    this.video = page.locator('.the-class__video');
    this.cover = this.video.locator('.photo--yt');
    this.player = this.video.locator('.the-class__player');
    this.still = this.video.getByRole('img', {
      name: 'Ibiza Sunset Strip: a seafront road at sunset',
    });
    this.plan = page.getByRole('region', { name: 'What the bike will do' });
    this.planTitle = this.plan.getByRole('heading', { level: 2, name: 'What the bike will do' });
    this.planWatts = this.plan.locator('.the-class__plan-watts');
    this.profile = this.plan
      .locator('.the-class__profile')
      .getByRole('img', { name: 'Resistance profile' });
    this.profileBars = this.profile.locator('rect');
    this.effortBars = this.profile.locator('rect.class-profile__work');
    this.planNote = this.plan.locator('.the-class__plan-note');
    this.carriedOverPlan = page.locator('.class-plan');
    this.rideWith = page.getByRole('radiogroup', { name: 'Ride with' });
    this.options = this.rideWith.getByRole('radio');
    this.classVideo = this.rideWith.getByRole('radio', { name: 'Class video' });
    this.ibiza = this.rideWith.getByRole('radio', { name: /^Ibiza Sunset Strip/ });
    this.ibizaDetail = this.ibiza.locator('.ride-with__detail');
    this.start = page.locator('.the-class__start:visible');
    this.startHint = page.locator('.the-class__start-hint:visible');
    this.stats = page.locator('.the-class__stats');
    this.media = page.locator('.the-class__media');
    this.info = page.locator('.the-class__info');
    this.footer = page.locator('.the-class__footer');
    this.choice = page.getByRole('radiogroup', { name: 'Ride alone or with a group' });
    this.join = page.getByRole('button', { name: /^Join/ });
  }

  /** Opens The Class; `diagnose` adds `?diagnose`, which switches the diagnostic recording on (L2-178 AC2). */
  async open(options: { diagnose?: boolean } = {}): Promise<void> {
    await this.page.goto(options.diagnose ? '/?diagnose' : '/');
  }

  /** The value of one figure of the record, by its label. */
  stat(label: string): Locator {
    return this.stats
      .locator('.the-class__stat')
      .filter({ has: this.page.locator('.the-class__stat-label', { hasText: label }) })
      .locator('.the-class__stat-value');
  }

  /** Opens the class ride's address, as a bookmark or a typed address does. */
  async openRide(): Promise<void> {
    await this.page.goto(RIDE_ADDRESS);
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }

  /** The page's whole address, as the browser's address bar has it. */
  address(): string {
    return this.page.url();
  }

  /** How far the page can scroll sideways, in CSS pixels; 0 is a page that fits its window's width. */
  sidewaysOverflow(): Promise<number> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  }

  /** The colour behind the page. */
  background(): Promise<string> {
    return this.page
      .locator('.the-class-page')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  }

  /** How tall an element is drawn, in CSS pixels. */
  async height(element: Locator): Promise<number> {
    return (await element.boundingBox())?.height ?? 0;
  }

  /** How wide an element is drawn, in CSS pixels: 1 for text hidden from sight but still read. */
  async width(element: Locator): Promise<number> {
    return (await element.boundingBox())?.width ?? 0;
  }

  /** The resistance profile's box (`viewBox`) and its bars as they are drawn in it, in the plan's order. */
  async drawnProfile(): Promise<{
    box: string | null;
    bars: { element: string; x: number; width: number; height: number }[];
  }> {
    return {
      box: await this.profile.getAttribute('viewBox'),
      bars: await this.profileBars.evaluateAll((rects) =>
        rects.map((rect) => ({
          element: rect.getAttribute('class') ?? '',
          x: Number(rect.getAttribute('x')),
          width: Number(rect.getAttribute('width')),
          height: Number(rect.getAttribute('height')),
        })),
      ),
    };
  }

  /** Whether an element is drawn wholly inside the window's width, once it has been brought into view. */
  async fitsTheWidth(element: Locator): Promise<boolean> {
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    const width = this.page.viewportSize()?.width ?? 0;
    return box !== null && box.x >= 0 && box.x + box.width <= width;
  }

  /** Where an element is drawn in the window, in CSS pixels; an element that is not drawn fails the spec. */
  async box(element: Locator): Promise<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  }> {
    const box = await element.boundingBox();
    if (box === null) throw new Error(`not drawn: ${String(element)}`);
    return {
      left: box.x,
      top: box.y,
      right: box.x + box.width,
      bottom: box.y + box.height,
      width: box.width,
      height: box.height,
    };
  }

  /** The window's size, in CSS pixels. */
  window(): { width: number; height: number } {
    return this.page.viewportSize() ?? { width: 0, height: 0 };
  }

  /**
   * How far the screen can scroll down, in CSS pixels: the document's own scroll and the scroll of the body under the
   * header, whichever is longer. 0 is a screen that fits (L2-171 AC1).
   */
  scrollsDownBy(): Promise<number> {
    return this.page.evaluate(() => {
      const scrollers = [
        document.scrollingElement,
        ...document.querySelectorAll('.the-class__scroll, .the-class-page__scroll'),
      ];
      return Math.max(
        0,
        ...scrollers.map((scroller) =>
          scroller ? scroller.scrollHeight - scroller.clientHeight : 0,
        ),
      );
    });
  }

  /** Scrolls the body under the header to its end, as a rider's last swipe does. */
  async scrollToTheEnd(): Promise<void> {
    await this.page
      .locator('.the-class__scroll')
      .evaluate((scroller) => scroller.scrollTo(0, scroller.scrollHeight));
  }

  /**
   * The words of each control Tab stops at, in order, from the top of the page until focus leaves the page or comes
   * round again. A control that is not displayed is never among them.
   */
  async tabStops(): Promise<string[]> {
    const stops: string[] = [];
    const seen = new Set<string>();
    for (let press = 0; press < 30; press++) {
      await this.page.keyboard.press('Tab');
      const stop = await this.page.evaluate(() => {
        const active = document.activeElement;
        if (active === null || active === document.body) return null;
        const words = (active.getAttribute('aria-label') ?? active.textContent ?? '').trim();
        const all = [...document.querySelectorAll('*')];
        return { words: words.replace(/\s+/g, ' '), index: all.indexOf(active) };
      });
      if (stop === null || seen.has(String(stop.index))) break;
      seen.add(String(stop.index));
      stops.push(stop.words);
    }
    return stops;
  }

  /** Presses Tab, from wherever the focus is, until the element has it; fails the spec if it never does. */
  async tabTo(element: Locator): Promise<void> {
    for (let press = 0; press < 30; press++) {
      await this.page.keyboard.press('Tab');
      if (await element.evaluate((node) => node === document.activeElement)) return;
    }
    throw new Error(`Tab never reached ${String(element)}`);
  }

  /** Whether an option of "Ride with" shows its mark, the dot in its ring, so the choice is not told by colour alone. */
  marked(option: Locator): Promise<boolean> {
    return option
      .locator('.ride-with__mark')
      .evaluate((mark) => getComputedStyle(mark, '::before').scale === '1');
  }

  /**
   * Resolves once the video's box has settled: the player has put its frame in the box, or the video cannot load and
   * the box holds the cover alone (L2-084 AC9).
   */
  async videoSettled(): Promise<void> {
    await this.player
      .locator('*')
      .first()
      .or(this.video.locator(':scope:not(:has(.the-class__player))'))
      .waitFor({ state: 'attached' });
  }
}
