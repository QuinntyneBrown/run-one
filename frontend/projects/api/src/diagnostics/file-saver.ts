import { InjectionToken } from '@angular/core';
import type { RecordingFile } from './diagnostic-recording';

/** A file the browser could not save; the dialog shows its own words (L2-178 AC15). */
export class FileSaveError extends Error {
  readonly code = 'not-saved';

  constructor(message: string) {
    super(message);
    this.name = 'FileSaveError';
  }
}

/**
 * Saves a file off the device by the person's own action, as a download (L2-178 AC15). Nothing is uploaded and no
 * request is made.
 */
export interface FileSaver {
  /** Hands the file to the browser to save; throws a `FileSaveError` where it cannot. */
  save(file: RecordingFile): void;
}

export const FILE_SAVER = new InjectionToken<FileSaver>('FILE_SAVER');
