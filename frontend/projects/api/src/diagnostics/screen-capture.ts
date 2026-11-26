import { InjectionToken } from '@angular/core';

/** One still picture of the app's tab, and its size in pixels. */
export interface CapturedScreen {
  readonly picture: Blob;
  readonly width: number;
  readonly height: number;
}

/**
 * Why no picture was taken: the person or the browser refused to share the tab, the browser has no Screen Capture
 * API, or the capture failed after it was allowed.
 */
export type ScreenCaptureErrorCode = 'refused' | 'unsupported' | 'failed';

/** A screen capture that was not taken; the dialog branches on `code` and shows its own words (L2-178 AC14). */
export class ScreenCaptureError extends Error {
  constructor(
    readonly code: ScreenCaptureErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ScreenCaptureError';
  }
}

/** Takes one still picture of the app's tab for the diagnostic recording (L2-178 AC13). */
export interface ScreenCapture {
  /** Whether this browser has the Screen Capture API. */
  readonly supported: boolean;
  /**
   * Asks the browser's own permission to share the tab, takes one picture and ends the sharing at once. Rejects with
   * a `ScreenCaptureError`. Call it from the person's press.
   */
  capture(): Promise<CapturedScreen>;
}

export const SCREEN_CAPTURE = new InjectionToken<ScreenCapture>('SCREEN_CAPTURE');
