import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { Clipboard } from '@telo/api';

/**
 * The browser's clipboard (`navigator.clipboard`). A browser without one, as on a page that is not secure, and a
 * browser that refuses both reject, so the caller shows nothing was copied.
 */
@Injectable()
export class BrowserClipboard implements Clipboard {
  private readonly navigator = inject(DOCUMENT).defaultView?.navigator;

  async copy(text: string): Promise<void> {
    const clipboard = this.navigator?.clipboard;
    if (!clipboard) throw new Error('This browser has no clipboard.');
    await clipboard.writeText(text);
  }
}
