import { InjectionToken } from '@angular/core';

/** The device's clipboard, which Copy link writes the page's address to (L2-008 AC3). */
export interface Clipboard {
  /** Resolves once the text is on the clipboard; rejects where the browser has none or refuses. */
  copy(text: string): Promise<void>;
}

export const CLIPBOARD = new InjectionToken<Clipboard>('CLIPBOARD');
