import { DOCUMENT, Injectable, inject } from '@angular/core';
import { type CapturedScreen, type ScreenCapture, ScreenCaptureError } from '@telo/api';
import { describeError } from '../bluetooth/describe-error';

/** How long a shared tab has to give its first frame before the capture counts as failed. */
export const FIRST_FRAME_TIMEOUT_MS = 5000;

/**
 * One still picture of the app's tab through the Screen Capture API (L2-178 AC13, ADR 0048). It asks the browser's
 * own permission with `getDisplayMedia`, preferring this tab, plays the shared video in an element that is never
 * added to the page, draws its first frame to a canvas and keeps it as a PNG. Whatever happens, every track is
 * stopped and the element let go before it returns, so the browser's sharing ends with the picture (AC20). A DOM
 * rasteriser is not used: it cannot read Class Ride's cross-origin video frame or its WebGL course.
 */
@Injectable()
export class BrowserScreenCapture implements ScreenCapture {
  private readonly document = inject(DOCUMENT);

  get supported(): boolean {
    return typeof this.document.defaultView?.navigator.mediaDevices?.getDisplayMedia === 'function';
  }

  async capture(): Promise<CapturedScreen> {
    const media = this.document.defaultView?.navigator.mediaDevices;
    if (typeof media?.getDisplayMedia !== 'function')
      throw new ScreenCaptureError('unsupported', 'This browser has no Screen Capture API.');
    let stream: MediaStream;
    try {
      // `preferCurrentTab` is Chromium's hint to offer this tab; the standard type does not list it yet.
      stream = await media.getDisplayMedia({
        video: true,
        audio: false,
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions);
    } catch (error) {
      const refused = error instanceof DOMException && error.name === 'NotAllowedError';
      throw new ScreenCaptureError(refused ? 'refused' : 'failed', describeError(error));
    }
    const video = this.document.createElement('video');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      video.muted = true;
      video.srcObject = stream;
      await Promise.race([
        video.play(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('The shared tab gave no picture.')),
            FIRST_FRAME_TIMEOUT_MS,
          );
        }),
      ]);
      const { videoWidth: width, videoHeight: height } = video;
      const canvas = this.document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context || width === 0 || height === 0)
        throw new Error('The shared tab gave no picture.');
      context.drawImage(video, 0, 0, width, height);
      const picture = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!picture) throw new Error('The picture could not be made.');
      return { picture, width, height };
    } catch (error) {
      throw new ScreenCaptureError('failed', describeError(error));
    } finally {
      clearTimeout(timer);
      for (const track of stream.getTracks()) track.stop();
      video.pause();
      video.srcObject = null;
    }
  }
}
