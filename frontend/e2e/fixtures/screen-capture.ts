import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __fakeScreenCapture?: {
      mode: 'grant' | 'refuse';
      asked: unknown[];
      tracks: MediaStreamTrack[];
    };
  }
}

/** The size of the picture the fake shares, in pixels. */
export const SHARED_SCREEN = { width: 640, height: 360 } as const;

/**
 * A fake Screen Capture API, installed before the app loads (L2-148 AC1): headless Chromium cannot show the browser's
 * own "share this tab" prompt, so `navigator.mediaDevices.getDisplayMedia` is answered here. Granted, it resolves with
 * a real `MediaStream` of a small drawn canvas, so the app's own capture code runs on real video frames; refused, it
 * rejects as a browser does when the person says no. It keeps what the page asked for and every track it handed out,
 * so a spec can tell that the sharing ended.
 */
export class ScreenCaptureFixture {
  private constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<ScreenCaptureFixture> {
    await page.addInitScript((size) => {
      const state: NonNullable<Window['__fakeScreenCapture']> = {
        mode: 'grant',
        asked: [],
        tracks: [],
      };
      window.__fakeScreenCapture = state;
      const getDisplayMedia = async (options?: unknown): Promise<MediaStream> => {
        state.asked.push(JSON.parse(JSON.stringify(options ?? null)));
        if (state.mode === 'refuse') throw new DOMException('Permission denied', 'NotAllowedError');
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext('2d')!;
        // A canvas stream sends a frame when the canvas is drawn on, so it is drawn on until the sharing ends.
        let frame = 0;
        const draw = (): void => {
          context.fillStyle = frame++ % 2 === 0 ? '#ff5a1f' : '#ff5a20';
          context.fillRect(0, 0, size.width, size.height);
        };
        draw();
        const stream = canvas.captureStream();
        const drawing = setInterval(draw, 30);
        for (const track of stream.getTracks()) {
          state.tracks.push(track);
          const stop = track.stop.bind(track);
          track.stop = () => {
            clearInterval(drawing);
            stop();
          };
        }
        return stream;
      };
      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        configurable: true,
        value: getDisplayMedia,
      });
    }, SHARED_SCREEN);
    return new ScreenCaptureFixture(page);
  }

  /** From now on the person refuses to share the tab: `getDisplayMedia` rejects with `NotAllowedError`. */
  async refuse(): Promise<void> {
    await this.page.evaluate(() => {
      if (window.__fakeScreenCapture) window.__fakeScreenCapture.mode = 'refuse';
    });
  }

  /** From the next page load, the browser has no Screen Capture API, as Chrome on Android. */
  async remove(): Promise<void> {
    await this.page.addInitScript(() =>
      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        configurable: true,
        value: undefined,
      }),
    );
  }

  /** What the page asked `getDisplayMedia` for, each time it asked. */
  asked(): Promise<unknown[]> {
    return this.page.evaluate(() => window.__fakeScreenCapture?.asked ?? []);
  }

  /** The state of every track the page was handed: `live` while the tab is shared, `ended` once it is not. */
  tracks(): Promise<string[]> {
    return this.page.evaluate(() =>
      (window.__fakeScreenCapture?.tracks ?? []).map((track) => track.readyState),
    );
  }
}
