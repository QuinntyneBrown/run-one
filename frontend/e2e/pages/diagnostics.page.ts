import { readFile } from 'node:fs/promises';
import type { Download, Locator, Page } from '@playwright/test';

/** One file the person diagnosing saved: its name and what it holds. */
export interface SavedFile {
  readonly name: string;
  readonly bytes: Buffer;
}

/** The address query that switches the diagnostic recording on (L2-178 AC2). */
export const DIAGNOSE = '?diagnose';

/**
 * The diagnostic recording's controls (docs/mocks/pages/diagnostic-recording/, L2-178): the recording mark every
 * screen shows while the recording is on, and the dialog it opens. They are no screen of their own.
 */
export class DiagnosticsPage {
  /** The recording mark: the button that reads "Recording". */
  readonly mark: Locator;
  /** The "Diagnostic recording" dialog. */
  readonly dialog: Locator;
  readonly title: Locator;
  /** The line that says how many entries the recording holds, and how many were dropped. */
  readonly count: Locator;
  /** The note's field, "What the bike’s display reads". */
  readonly note: Locator;
  readonly addNote: Locator;
  readonly capture: Locator;
  /** What the dialog says of the last note, capture or save. */
  readonly status: Locator;
  /** What a saved recording holds, said before anything is saved (AC16). */
  readonly privacy: Locator;
  readonly save: Locator;
  readonly close: Locator;

  constructor(private readonly page: Page) {
    this.mark = page.locator('.diagnostic-mark');
    this.dialog = page.getByRole('dialog', { name: 'Diagnostic recording' });
    this.title = this.dialog.locator('.diagnostic-panel__title');
    this.count = this.dialog.locator('.diagnostic-panel__count');
    this.note = this.dialog.getByLabel('What the bike’s display reads');
    this.addNote = this.dialog.getByRole('button', { name: 'Add note' });
    this.capture = this.dialog.getByRole('button', { name: 'Capture screen' });
    this.status = this.dialog.getByRole('status');
    this.privacy = this.dialog.locator('.diagnostic-panel__privacy');
    this.save = this.dialog.getByRole('button', { name: 'Save files' });
    this.close = this.dialog.getByRole('button', { name: 'Close' });
  }

  /** Opens `path` with the recording switched on. */
  async open(path = '/'): Promise<void> {
    await this.page.goto(`${path}${DIAGNOSE}`);
  }

  /** Types a note of what the bike's own display reads and adds it to the recording. */
  async addNoteOf(text: string): Promise<void> {
    if (!(await this.dialog.isVisible())) await this.mark.click();
    await this.note.fill(text);
    await this.addNote.click();
  }

  /**
   * Presses the mark and then Save files, and gives every file the browser saved for it, the recording first. `files`
   * is how many are expected: the recording and each screen capture.
   */
  async saveFiles(files = 1): Promise<SavedFile[]> {
    const downloads: Download[] = [];
    const collect = (download: Download): number => downloads.push(download);
    this.page.on('download', collect);
    if (!(await this.dialog.isVisible())) await this.mark.click();
    await this.save.click();
    const started = Date.now();
    while (downloads.length < files && Date.now() - started < 10_000)
      await this.page.waitForEvent('download', { timeout: 10_000 }).catch(() => undefined);
    this.page.off('download', collect);
    return Promise.all(
      downloads.map(async (download) => ({
        name: download.suggestedFilename(),
        bytes: await readFile(await download.path()),
      })),
    );
  }

  /** Saves the recording and gives its text. */
  async savedRecording(): Promise<string> {
    const [recording] = await this.saveFiles();
    return recording.bytes.toString('utf8');
  }

  /** The saved recording's entries: every line that is not a `#` header line, without its time. */
  async entries(): Promise<string[]> {
    return entriesOf(await this.savedRecording());
  }
}

/** A recording's entries without their times: `RX   notification …`, in order. */
export function entriesOf(recording: string): string[] {
  return recording
    .split('\n')
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => line.trimStart().replace(/^\S+\s+/, ''));
}

/** Each entry's time in milliseconds since the recording started, in the file's order. */
export function timesOf(recording: string): number[] {
  return recording
    .split('\n')
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => Number(line.trimStart().split(/\s+/)[0]));
}
