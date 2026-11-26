// Unit test
// Traces to: L2-178 AC13, AC14, AC20
// Description: the screen capture's refusals and what it lets go of. A browser without the Screen Capture API is
// unsupported; a person who says no is refused; anything else is failed. Whenever a tab was shared, every track is
// stopped and the video element let go, whether the picture was made or not. A fake clock drives the wait for the
// first frame; nothing sleeps. The picture itself is proved in Chromium (e2e/diagnostic-recording-capture.spec.ts).
import { TestBed } from '@angular/core/testing';
import { ScreenCaptureError } from '@telo/api';
import { BrowserScreenCapture, FIRST_FRAME_TIMEOUT_MS } from './browser-screen-capture';

describe('BrowserScreenCapture', () => {
  const create = (getDisplayMedia: unknown) => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: getDisplayMedia === null ? undefined : { getDisplayMedia },
    });
    TestBed.configureTestingModule({ providers: [BrowserScreenCapture] });
    return TestBed.inject(BrowserScreenCapture);
  };
  /** A shared tab with one video track that records when it is stopped. */
  const sharedTab = () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    return { stream, stop };
  };
  const code = (capture: Promise<unknown>) =>
    capture.then(
      () => 'taken',
      (error: unknown) =>
        error instanceof ScreenCaptureError ? error.code : 'not a capture error',
    );
  /** jsdom's video element takes a stream as any value and plays as the test says. */
  const videoThat = (play: () => Promise<void>) => {
    const let_go: unknown[] = [];
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      configurable: true,
      set: (value: unknown) => void let_go.push(value),
      get: () => null,
    });
    return let_go;
  };
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each([
    ['no mediaDevices', null],
    ['no getDisplayMedia', undefined],
  ])('is unsupported in a browser with %s', async (_, getDisplayMedia) => {
    const capture = create(getDisplayMedia);

    expect(capture.supported).toBe(false);
    expect(await code(capture.capture())).toBe('unsupported');
  });

  it('asks for this tab, with no sound', async () => {
    const getDisplayMedia = vi.fn(() =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
    );
    const capture = create(getDisplayMedia);

    expect(capture.supported).toBe(true);
    await code(capture.capture());

    expect(getDisplayMedia).toHaveBeenCalledExactlyOnceWith({
      video: true,
      audio: false,
      preferCurrentTab: true,
    });
  });

  it.each([
    ['NotAllowedError', 'refused'],
    ['NotFoundError', 'failed'],
    ['AbortError', 'failed'],
  ])('a %s from the browser is %s', async (name, expected) => {
    const capture = create(() => Promise.reject(new DOMException('no', name)));

    expect(await code(capture.capture())).toBe(expected);
  });

  it('stops every track and lets the video go when the picture cannot be made (AC20)', async () => {
    const { stream, stop } = sharedTab();
    const letGo = videoThat(() => Promise.reject(new Error('cannot play')));
    const capture = create(() => Promise.resolve(stream));

    expect(await code(capture.capture())).toBe('failed');

    expect(stop).toHaveBeenCalledOnce();
    expect(letGo).toEqual([stream, null]);
  });

  it('gives a shared tab five seconds to show a frame, then fails and stops its tracks (AC20)', async () => {
    vi.useFakeTimers();
    const { stream, stop } = sharedTab();
    videoThat(() => new Promise<void>(() => undefined));
    const outcome = code(create(() => Promise.resolve(stream)).capture());

    await vi.advanceTimersByTimeAsync(FIRST_FRAME_TIMEOUT_MS - 1);
    expect(stop).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(await outcome).toBe('failed');
    expect(stop).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('fails, and stops its tracks, when the shared tab has no size', async () => {
    const { stream, stop } = sharedTab();
    videoThat(() => Promise.resolve());
    const capture = create(() => Promise.resolve(stream));

    expect(await code(capture.capture())).toBe('failed');

    expect(stop).toHaveBeenCalledOnce();
  });
});
