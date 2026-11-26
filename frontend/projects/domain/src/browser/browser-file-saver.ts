import { DOCUMENT, Injectable, inject } from '@angular/core';
import { FileSaveError, type FileSaver, type RecordingFile } from '@telo/api';

/**
 * Saves a file as a download (L2-178 AC15, ADR 0048): a link with `download` on an object URL, pressed once and never
 * added to the page. The object URL is revoked as soon as the press is made, so nothing of the file stays held.
 * Nothing is fetched or uploaded, so the Content Security Policy needs no change.
 */
@Injectable()
export class BrowserFileSaver implements FileSaver {
  private readonly document = inject(DOCUMENT);

  save(file: RecordingFile): void {
    const urls = this.document.defaultView?.URL;
    if (!urls) throw new FileSaveError('This browser cannot save a file.');
    let url: string | null = null;
    try {
      url = urls.createObjectURL(file.blob);
      const link = this.document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    } catch (error) {
      throw new FileSaveError(String(error));
    } finally {
      if (url !== null) urls.revokeObjectURL(url);
    }
  }
}
