import { InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';
import type { CapturedScreen, ScreenCaptureErrorCode } from './screen-capture';

/** The readouts Class Ride shows, as the screen draws them: a number, or "—" (L2-178 AC8). */
export interface ShownReadouts {
  readonly power: string;
  readonly cadence: string;
  readonly resistance: string;
  readonly targetResistance: string;
}

/** One file of a saved recording: the recording's text, or a screen capture. */
export interface RecordingFile {
  readonly name: string;
  readonly blob: Blob;
}

/**
 * The diagnostic recording (L2-178): the timed, ordered list of what crossed the Bluetooth link and what the app made
 * of it, held in the page within a fixed limit and saved only as files. It is bound only when the app is opened with
 * `?diagnose`; a screen that reports to it injects it as optional.
 */
export interface DiagnosticRecording {
  /** How many entries the recording holds now. */
  readonly entries: Signal<number>;
  /** How many of the oldest entries went because the recording reached its limit (AC9). */
  readonly dropped: Signal<number>;
  /** How many screen captures are kept with it. */
  readonly captures: Signal<number>;
  /** When the recording started, on the device's clock. */
  readonly startedAt: Date;
  /** The readouts the rider sees; an entry is added only when one of them changed (AC8). */
  readouts(shown: ShownReadouts): void;
  /** What the person diagnosing read from the bike's own display (AC12). */
  note(text: string): void;
  /** Keeps a screen capture with the recording and resolves to its number (AC13). */
  keepCapture(captured: CapturedScreen): number;
  /** A screen capture that was not taken, and why (AC14). */
  captureFailed(code: ScreenCaptureErrorCode, error?: unknown): void;
  /** The recording as files: its text first, then each screen capture (AC15). */
  files(): RecordingFile[];
}

export const DIAGNOSTIC_RECORDING = new InjectionToken<DiagnosticRecording>('DIAGNOSTIC_RECORDING');
