import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

/** A player the page created, as the fake recorded it. */
export interface FakePlayer {
  readonly host: string | undefined;
  readonly videoId: string;
  readonly playerVars: Record<string, number | string>;
  readonly tabIndex: string | null;
  readonly title: string | null;
  readonly destroyed: boolean;
  /** Whether the video is playing, rather than paused or not yet started. */
  readonly playing: boolean;
}

const API = 'https://www.youtube.com/iframe_api';
const COVER = /^https:\/\/i\.ytimg\.com\/vi\/([\w-]{11})\/(hq|mq)default\.jpg$/;
/** The mocks' class cover, kept beside the fixture: CI's checkout leaves out docs/. */
const COVER_FILE = path.join(__dirname, 'class-cover.jpg');
/** The mocks' covers of the other classes, by video id, scaled to 640 px; any other video gets COVER_FILE. */
const COVERS = path.join(__dirname, 'covers');

/**
 * The YouTube IFrame Player API as the page sees it, with no request leaving localhost (AGENTS.md, E2E). `YT.Player`
 * puts a stand-in element where the iframe would go and records what it was asked; its time runs on the page's
 * `performance.now()`, so Playwright's clock moves the video as it moves the ride.
 */
const FAKE_API = `(() => {
  const players = [];
  class Player {
    constructor(element, options) {
      const host = typeof element === 'string' ? document.getElementById(element) : element;
      const frame = document.createElement('div');
      frame.dataset.fakeYoutube = options.videoId;
      host.replaceWith(frame);
      Object.assign(this, { frame, options, base: Number(options.playerVars?.start ?? 0), since: null, seeks: [], destroyed: false, stalled: false });
      players.push(this);
      setTimeout(() => options.events?.onReady?.({ target: this }));
    }
    getIframe() { return this.frame; }
    getCurrentTime() { return this.since === null ? this.base : this.base + (performance.now() - this.since) / 1000; }
    playVideo() { if (this.stalled) return; if (this.since === null) { this.since = performance.now(); this.emit(1); } }
    stall() { this.base = this.getCurrentTime(); this.since = null; this.stalled = true; this.emit(3); }
    unstall() { this.stalled = false; this.playVideo(); }
    pauseVideo() { this.base = this.getCurrentTime(); this.since = null; this.emit(2); }
    seekTo(seconds) { this.seeks.push(seconds); this.jump(seconds); }
    jump(seconds) { this.base = seconds; if (this.since !== null) this.since = performance.now(); }
    destroy() { this.destroyed = true; this.frame.remove(); }
    emit(data) { this.options.events?.onStateChange?.({ target: this, data }); }
    fail(code) { this.options.events?.onError?.({ target: this, data: code }); }
    record() {
      const { host, videoId, playerVars } = this.options;
      const frame = this.frame;
      return { host, videoId, playerVars, tabIndex: frame.getAttribute('tabindex'), title: frame.getAttribute('title'), destroyed: this.destroyed, playing: this.since !== null };
    }
  }
  window.YT = { Player, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 }, loaded: 1 };
  window.__fakeYouTube = players;
  window.onYouTubeIframeAPIReady?.();
})();`;

interface FakeWindow {
  __fakeYouTube?: {
    record(): FakePlayer;
    getCurrentTime(): number;
    jump(seconds: number): void;
    fail(code: number): void;
    stall(): void;
    unstall(): void;
    seeks: number[];
  }[];
}

/**
 * Answers the YouTube IFrame API's script with a fake player and the class covers with the mocks' picture
 * (docs/detailed-designs/classes/ride-a-class, ADR 0012). A spec can block the script, read what the player was asked,
 * move its time to make it drift, make it fail, and make it stall as it does when the network goes.
 */
export class YouTubeFixture {
  private blocked = false;

  private constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<YouTubeFixture> {
    const youtube = new YouTubeFixture(page);
    // On the context, not the page: once the app's service worker controls the page it fetches the player's script and
    // the covers itself, under its own policy (ADR 0043), and a route on the page never sees a worker's request.
    const context = page.context();
    await context.route(API, (route) =>
      youtube.blocked
        ? route.abort('blockedbyclient')
        : route.fulfill({ contentType: 'text/javascript', body: FAKE_API }),
    );
    await context.route(COVER, (route) => {
      const own = path.join(COVERS, `${COVER.exec(route.request().url())?.[1]}.jpg`);
      return route.fulfill({ path: existsSync(own) ? own : COVER_FILE });
    });
    return youtube;
  }

  /** Whether the fixture answers this request, so the shared fixture lets it through. */
  static answers(url: URL): boolean {
    return url.href === API || COVER.test(url.href);
  }

  /**
   * Forgets the players the page has created so far, so `players()` lists only those made from now on: a spec that
   * starts a ride from The Class reads the ride's player, not the one The Class parked.
   */
  static forgetPlayers(page: Page): Promise<void> {
    return page.evaluate(() => {
      const players = (window as FakeWindow).__fakeYouTube;
      if (players) players.length = 0;
    });
  }

  /** Blocks the IFrame API's script, as an extension or a network that bars YouTube does. */
  block(): void {
    this.blocked = true;
  }

  /** The players the page created, in order. */
  players(): Promise<FakePlayer[]> {
    return this.page.evaluate(() =>
      ((window as FakeWindow).__fakeYouTube ?? []).map((player) => player.record()),
    );
  }

  /** The video's time in the last player, in seconds. */
  time(): Promise<number> {
    return this.page.evaluate(() => (window as FakeWindow).__fakeYouTube!.at(-1)!.getCurrentTime());
  }

  /** Every `seekTo` the last player was asked, in seconds. */
  seeks(): Promise<number[]> {
    return this.page.evaluate(() => [...(window as FakeWindow).__fakeYouTube!.at(-1)!.seeks]);
  }

  /** Moves the last player's video to `seconds` on its own, as buffering or a stall does. */
  jump(seconds: number): Promise<void> {
    return this.page.evaluate(
      (to) => (window as FakeWindow).__fakeYouTube!.at(-1)!.jump(to),
      seconds,
    );
  }

  /** Makes the last player report an error: 150 is a video its owner does not allow embedded. */
  fail(code = 150): Promise<void> {
    return this.page.evaluate(
      (error) => (window as FakeWindow).__fakeYouTube!.at(-1)!.fail(error),
      code,
    );
  }

  /**
   * The network goes mid-ride: the last player runs out of video and buffers (state 3), its time standing still, and
   * a request to play changes nothing, as YouTube's player behaves with no connection. No error is reported.
   */
  stall(): Promise<void> {
    return this.page.evaluate(() => (window as FakeWindow).__fakeYouTube!.at(-1)!.stall());
  }

  /** The network is back: the last player plays on from where it stood. */
  unstall(): Promise<void> {
    return this.page.evaluate(() => (window as FakeWindow).__fakeYouTube!.at(-1)!.unstall());
  }
}
