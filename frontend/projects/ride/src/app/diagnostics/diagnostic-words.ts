import type { DiagnosticMarkScreen, DiagnosticStatus } from '@telo/components/diagnostics';

/** What the dialog says of a note, a screen capture and a save (L2-178 AC12 to AC15). */
export const NOTE_ADDED: DiagnosticStatus = { text: 'Note added', tone: 'ok' };
export const CAPTURE_NOT_KEPT: DiagnosticStatus = {
  text: 'The browser didn’t share the screen, so no capture was kept. The ride carries on.',
  tone: 'warn',
};
export const FILES_NOT_SAVED: DiagnosticStatus = {
  text: 'The files couldn’t be saved. Try again.',
  tone: 'warn',
};

/** "Screen capture 1 kept" (AC13). */
export function captureKept(number: number): DiagnosticStatus {
  return { text: `Screen capture ${number} kept`, tone: 'ok' };
}

/** "Saved 1 file: the recording." or "Saved 3 files: the recording and 2 screen captures." (AC15). */
export function filesSaved(files: number): DiagnosticStatus {
  const captures = files - 1;
  const what =
    captures === 0
      ? 'the recording'
      : `the recording and ${captures} screen capture${captures === 1 ? '' : 's'}`;
  return { text: `Saved ${files} file${files === 1 ? '' : 's'}: ${what}.`, tone: 'ok' };
}

/**
 * The screen at an address, for the two that keep their foot for something else: The Class, with its pinned start
 * button, and Class Ride, with its bike panel. Every other address leaves the recording mark at the foot.
 */
export function screenAt(url: string): DiagnosticMarkScreen | null {
  const path = url.split(/[?#]/)[0];
  if (path === '/') return 'the-class';
  return path === '/ride' ? 'class-ride' : null;
}
