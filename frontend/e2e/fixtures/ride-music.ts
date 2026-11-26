// What a spec sees of the ride's music: every `Audio` element the page makes, and when it was paused against the
// last click (L2-176 AC4). Installed before the page loads; the app is not told.
import type { Page } from '@playwright/test';

/** An audio element as the page left it. */
export interface Track {
  /** The `src` attribute: null once the element has been released (L2-176 AC6). */
  readonly src: string | null;
  readonly loop: boolean;
  readonly paused: boolean;
  readonly currentTime: number;
}

export class RideMusicProbe {
  /** Every request the page made under `/music/`, in order. */
  readonly requests: URL[] = [];

  private constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<RideMusicProbe> {
    const probe = new RideMusicProbe(page);
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/music/')) probe.requests.push(url);
    });
    await page.addInitScript(() => {
      const Native = window.Audio;
      const made: HTMLAudioElement[] = [];
      const marks = { click: 0, paused: [] as number[] };
      (window as unknown as Record<string, unknown>)['__wzMusic'] = { made, marks };
      document.addEventListener('click', () => (marks.click = performance.now()), true);
      window.Audio = function (src?: string) {
        const audio = new Native(src);
        made.push(audio);
        const pause = audio.pause.bind(audio);
        audio.pause = () => {
          marks.paused.push(performance.now());
          pause();
        };
        return audio;
      } as unknown as typeof Audio;
    });
    return probe;
  }

  /** The audio elements the page has made. */
  tracks(): Promise<Track[]> {
    return this.page.evaluate(() => {
      const { made } = (window as unknown as Record<string, { made: HTMLAudioElement[] }>)[
        '__wzMusic'
      ]!;
      return made.map((audio) => ({
        src: audio.getAttribute('src'),
        loop: audio.loop,
        paused: audio.paused,
        currentTime: audio.currentTime,
      }));
    });
  }

  /** Milliseconds from the latest click to the first `pause()` after it; null if none was made after it. */
  pausedAfterClick(): Promise<number | null> {
    return this.page.evaluate(() => {
      const { marks } = (
        window as unknown as Record<string, { marks: { click: number; paused: number[] } }>
      )['__wzMusic']!;
      const after = marks.paused.filter((at) => at >= marks.click);
      return after.length === 0 ? null : after[0]! - marks.click;
    });
  }
}
