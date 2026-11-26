import type { Locator, Page } from '@playwright/test';
import { ClassHeader } from './class-header';

/** Class Ride's address (L2-087): the one place the specs, the fixtures and the other page objects read it from. */
export const RIDE_ADDRESS = '/ride';

/** The address Telo Ride gave a class's ride, which is no screen now (L2-087 AC4, L2-080 AC4). */
export const earlierRideAddress = (classId: string): string => `/classes/${classId}/ride`;

/** A part of the screen as the window draws it, in CSS pixels. */
export interface DrawnBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** How Class Ride fits its window: what can scroll, and where its parts are drawn. */
export interface RideLayout {
  /** How far the screen can scroll down, in CSS pixels: the page itself and the ride's own body. 0 does not scroll. */
  readonly scrollsDown: number;
  /** How far it can scroll sideways. */
  readonly scrollsSideways: number;
  readonly header: DrawnBox;
  /** The video's box, which the course takes in Ibiza (L2-087 AC6). */
  readonly box: DrawnBox;
  /** The bike panel and its four cells, in the order they are drawn. */
  readonly panel: DrawnBox;
  readonly cells: readonly DrawnBox[];
}

/** Class Ride at `/ride` (docs/mocks/pages/class-ride/): the header, the video and the bike panel. */
export class ClassRidePage {
  /** The header's wordmark and Full screen (L2-087 AC1). */
  readonly header: ClassHeader;
  /** The wordmark's words, hidden below 384 px while the mark stays (L2-087 AC2). */
  readonly wordmark: Locator;
  /** The class's length in the clock, " / 20:00", hidden on a phone (L2-087 AC2). */
  readonly clockTotal: Locator;
  /** The word on the Pause button, hidden on a phone, where the icon and the button's name stand for it. */
  readonly pauseLabel: Locator;
  /** The video's box on the stage, or the course in it. */
  readonly box: Locator;
  readonly body: Locator;
  private readonly panel: Locator;
  /** The screen's one heading, visually hidden (L2-087 AC1). */
  readonly heading: Locator;
  readonly name: Locator;
  readonly clock: Locator;
  readonly finish: Locator;
  readonly segmentKind: Locator;
  readonly segmentLeft: Locator;
  readonly segmentFill: Locator;
  readonly profile: Locator;
  readonly cover: Locator;
  readonly pause: Locator;
  /** The Sound button in the course's top-left corner, in Ibiza only, named for the sound chosen (L2-185 AC1). */
  readonly sound: Locator;
  /** The Sound panel's radio group "Sound" (L2-185 AC2). */
  readonly soundGroup: Locator;
  /** The Sound panel's radio group "Video", while a YouTube sound is chosen (L2-185 AC2). */
  readonly videoGroup: Locator;
  /** The YouTube inset in the course box's top-right corner, 1 px and hidden for YouTube audio (L2-186 AC1, AC2). */
  readonly inset: Locator;
  /** The notice under the course's box when YouTube cannot play (L2-186 AC6). */
  readonly youtubeNotice: Locator;
  readonly resume: Locator;
  readonly leave: Locator;
  /** "Paused" over the class video (L2-091 AC1). */
  readonly paused: Locator;
  /** The same "Paused" over the course, in Ibiza (L2-091 AC1). */
  readonly coursePaused: Locator;
  /** The course's canvas in the box, named for a screen reader once its first frame is drawn (L2-174 AC1). */
  readonly course: Locator;
  /** The canvas itself, drawn or not. */
  readonly courseCanvas: Locator;
  /** The course's still, which stands in the box until the course is drawn (L2-175 AC1). */
  readonly courseStill: Locator;
  /** "Loading Ibiza Sunset Strip" over the still (L2-175 AC1). */
  readonly courseLoading: Locator;
  /** The notice under the box when the course cannot be drawn (L2-175 AC2). */
  readonly courseNotice: Locator;
  /** Any video player's frame or cover on the screen; a ride in Ibiza has none (L2-174 AC1). */
  readonly video: Locator;
  /** Any screen or card that stands between the start button and the ride; there is none (L2-175). */
  readonly loadingScreen: Locator;
  /** The countdown over the video's or the course's box (L2-180 AC1). */
  readonly countdown: Locator;
  /** The numeral: "3", "2", "1" or "Go!" (L2-180 AC2). */
  readonly countdownNumeral: Locator;
  /** The lights lit so far, from none to all three. */
  readonly countdownLights: Locator;
  /** "The plan sets your resistance. Just pedal." */
  readonly countdownLine: Locator;
  /** What a screen reader hears of the countdown, once (L2-180 AC8). */
  readonly countdownStatus: Locator;
  /** The finish banner and its parts (L2-181). */
  readonly finishBanner: Locator;
  readonly finishTitle: Locator;
  readonly finishResult: Locator;
  readonly finishOutput: Locator;
  readonly finishStatus: Locator;
  /** The roll-out card and its parts (L2-182 AC4). */
  readonly rollOut: Locator;
  readonly rollOutTitle: Locator;
  readonly rollOutLine: Locator;
  readonly rollOutBar: Locator;
  readonly lost: Locator;
  /** What the lost-bike alert says the ride is doing meanwhile (L2-092 AC1). */
  readonly lostBody: Locator;
  /** A confirmation, which Leave never asks for (L2-093 AC1). */
  readonly confirmation: Locator;
  /** Every polite status on the screen itself, apart from the app's one live region. */
  readonly statuses: Locator;
  readonly reconnect: Locator;
  readonly videoNotice: Locator;
  /** The notice that the rider sets the resistance by hand, under the bike panel (L2-014 AC3). */
  readonly bikeNotice: Locator;
  readonly power: Locator;
  readonly powerHint: Locator;
  readonly powerUnit: Locator;
  readonly cadenceUnit: Locator;
  /** "of 32" under the stepper's level. */
  readonly levelOf: Locator;
  readonly cadence: Locator;
  readonly cadenceHint: Locator;
  readonly resistance: Locator;
  readonly level: Locator;
  readonly raise: Locator;
  /** The group board Telo Ride had; Telo Ride 1 has none (ADR 0038). */
  readonly board: Locator;
  readonly lower: Locator;
  /** The intensity's setting, "5/10", on the box's left edge (L2-183 AC1). */
  readonly intensityValue: Locator;
  /** The intensity's slider, a range input from 0 to 10, hidden on a short box (L2-183 AC1, AC8). */
  readonly intensitySlider: Locator;
  readonly raiseIntensity: Locator;
  readonly lowerIntensity: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.header = new ClassHeader(page);
    this.wordmark = this.header.lockup.locator('.wordmark');
    this.clockTotal = page.locator('.class-ride__clock-total');
    this.pauseLabel = page.locator('.class-ride__pause-label');
    this.body = page.locator('.class-ride__body');
    this.box = page.locator(
      '.class-ride__stage > wz-class-video > .class-video, .class-ride__stage > wz-class-course > .class-course',
    );
    this.panel = page.locator('.class-bike');
    this.name = page.locator('.class-ride__name');
    this.clock = page.locator('.class-ride__clock');
    this.finish = page
      .getByRole('link', { name: 'Finish' })
      .or(page.getByRole('button', { name: 'Finish' }));
    this.segmentKind = page.locator('.class-segment__kind');
    this.segmentLeft = page.locator('.class-segment__left');
    this.segmentFill = page.locator('.class-segment__fill');
    this.profile = page.getByRole('img', { name: 'Resistance profile' });
    this.cover = page.locator('.class-video .photo');
    this.pause = page.getByRole('button', { name: 'Pause', exact: true });
    this.sound = page.getByRole('button', { name: /^Sound: / });
    this.soundGroup = page.getByRole('group', { name: 'Sound', exact: true });
    this.videoGroup = page.getByRole('group', { name: 'Video', exact: true });
    this.inset = page.locator('.class-course__inset');
    this.youtubeNotice = page.locator('.class-course__youtube-notice');
    this.resume = page.getByRole('button', { name: 'Resume', exact: true });
    this.leave = page.getByRole('link', { name: 'Leave class' });
    this.paused = page.locator('.class-video__paused');
    this.countdown = page.locator('.class-countdown');
    this.countdownNumeral = page.locator('.class-countdown__num');
    this.countdownLights = page.locator('.class-countdown__light--on');
    this.countdownLine = page.locator('.class-countdown__line');
    this.countdownStatus = page.locator('.class-countdown').getByRole('status');
    this.finishBanner = page.locator('.finish-banner');
    this.finishTitle = page.locator('.finish-banner__title');
    this.finishResult = page.locator('.finish-banner__result');
    this.finishOutput = page.locator('.finish-banner__output');
    this.rollOut = page.locator('.class-rollout');
    this.rollOutTitle = page.locator('.class-rollout__title');
    this.rollOutLine = page.locator('.class-rollout__body');
    this.rollOutBar = page.locator('.class-rollout__bar');
    this.finishStatus = page.locator('.finish-banner').getByRole('status');
    this.lost = page.getByRole('alert').filter({ hasText: 'Lost the bike' });
    this.lostBody = this.lost.locator('.class-lost__body');
    this.coursePaused = page.locator('.class-course__paused');
    this.course = page
      .locator('.class-course')
      .getByRole('img', { name: 'Ibiza Sunset Strip', exact: true });
    this.courseCanvas = page.locator('.class-course canvas');
    this.courseStill = page
      .locator('.class-course')
      .getByRole('img', { name: 'Ibiza Sunset Strip: a seafront road at sunset' });
    this.courseLoading = page.locator('.class-course__loading');
    this.courseNotice = page.locator('.class-course__notice');
    this.video = page.locator('.class-video, iframe');
    this.loadingScreen = page
      .locator('.world-loading, .load-card')
      .or(page.getByRole('button', { name: 'Start riding' }))
      .or(page.getByRole('progressbar'));
    this.confirmation = page.getByRole('dialog').or(page.getByRole('alertdialog'));
    this.statuses = page.locator('.class-ride').getByRole('status');
    this.reconnect = page.getByRole('button', { name: 'Reconnect' });
    this.videoNotice = page.locator('.class-video__notice');
    this.bikeNotice = page.locator('.class-ride__notice');
    const stat = (label: string) =>
      page.locator('.class-stat').filter({ has: page.getByText(label, { exact: true }) });
    this.power = stat('Power').locator('.class-stat__number');
    this.powerHint = stat('Power').locator('.class-stat__hint');
    this.powerUnit = stat('Power').locator('.class-stat__unit');
    this.cadenceUnit = stat('Cadence').locator('.class-stat__unit');
    this.levelOf = page.locator('.class-resist__of');
    this.cadence = stat('Cadence').locator('.class-stat__number');
    this.cadenceHint = stat('Cadence').locator('.class-stat__hint');
    this.resistance = page.locator('.class-resist__value');
    this.level = page.locator('.class-resist__level');
    this.raise = page.getByRole('button', { name: 'Raise resistance' });
    this.board = page.getByRole('complementary', { name: 'Group board' });
    this.lower = page.getByRole('button', { name: 'Lower resistance' });
    this.intensityValue = page.locator('.class-intensity__value');
    this.intensitySlider = page.getByRole('slider', { name: 'Intensity' });
    this.raiseIntensity = page.getByRole('button', { name: 'Raise intensity' });
    this.lowerIntensity = page.getByRole('button', { name: 'Lower intensity' });
  }

  /** A choice in the Sound panel: "Music", "No music", "YouTube video" or "YouTube audio" (L2-185 AC2). */
  soundChoice(name: string): Locator {
    return this.soundGroup.getByRole('radio', { name: new RegExp(`^${name}\\b`) });
  }

  /** A choice in the Sound panel's Video group: "Default video" or "The class video" (L2-185 AC2). */
  videoChoice(name: string): Locator {
    return this.videoGroup.getByRole('radio', { name: new RegExp(`^${name}\\b`) });
  }

  /** Opens the ride's address with a group session named in it, as a bookmark from Telo Ride would (ADR 0038). */
  async openWithSession(sessionId: string): Promise<void> {
    await this.page.goto(`${RIDE_ADDRESS}?session=${sessionId}`);
  }

  /** Opens the ride's address, as a bookmark, a typed address or a reload does. */
  async open(): Promise<void> {
    await this.page.goto(RIDE_ADDRESS);
  }

  /** The path of the page's address. */
  url(): string {
    return new URL(this.page.url()).pathname;
  }

  /** The page's own time, for a spec that takes over its clock mid-ride. */
  now(): Promise<number> {
    return this.page.evaluate(() => Date.now());
  }

  /** The ride clock's whole seconds, read from the header ("3:05 / 20:00" is 185). */
  async clockSeconds(): Promise<number> {
    const [, minutes, seconds] = /^(\d+):(\d\d)/.exec((await this.clock.textContent())!)!;
    return Number(minutes) * 60 + Number(seconds);
  }

  /** Whether `overlay` is drawn over the whole of the video's box, or the course's. */
  async coversBox(overlay: Locator): Promise<boolean> {
    const [box, over] = await Promise.all([this.box.boundingBox(), overlay.boundingBox()]);
    if (!box || !over) return false;
    return (
      Math.abs(box.x - over.x) < 1 &&
      Math.abs(box.y - over.y) < 1 &&
      Math.abs(box.width - over.width) < 1 &&
      Math.abs(box.height - over.height) < 1
    );
  }

  /** Where `part` is drawn in the window, in CSS pixels. */
  drawn(part: Locator): Promise<DrawnBox> {
    return part.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    });
  }

  /** Scrolls the ride's body to its end, as a rider does to reach the stepper in a window too short to hold it. */
  async scrollToEnd(): Promise<void> {
    await this.body.evaluate((body) => body.scrollTo(0, body.scrollHeight));
  }

  /** Measures how the screen fits its window (L2-087 AC5, L2-089 AC5). */
  async layout(): Promise<RideLayout> {
    const drawn = (locator: Locator): Promise<DrawnBox> =>
      locator.evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      });
    const [page, body] = await Promise.all([
      this.page.evaluate(() => ({
        down: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      })),
      this.body.evaluate((element) => ({
        down: element.scrollHeight - element.clientHeight,
        sideways: element.scrollWidth - element.clientWidth,
      })),
    ]);
    return {
      scrollsDown: Math.max(page.down, body.down),
      scrollsSideways: Math.max(page.sideways, body.sideways),
      header: await drawn(this.header.root),
      box: await drawn(this.box),
      panel: await drawn(this.panel),
      cells: await Promise.all(
        (await this.panel.locator('.class-segment, .class-stat, .class-resist').all()).map(drawn),
      ),
    };
  }

  /** The width the segment's progress bar is filled to, as a share of the bar (0 to 1). */
  segmentProgress(): Promise<number> {
    return this.segmentFill.evaluate(
      (fill) =>
        fill.getBoundingClientRect().width / fill.parentElement!.getBoundingClientRect().width,
    );
  }
}
