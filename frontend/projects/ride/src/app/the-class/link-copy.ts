import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { CLIPBOARD } from '@telo/api';

/** How long Copy link reads "Copied" (docs/design-system/components/alert.html). */
export const COPIED_FOR_MS = 2000;

/**
 * Copy link on The Class's alert (L2-008 AC3), provided on its page: copies the page's address and says so for two
 * seconds. A browser that refuses leaves it unsaid. Its timer goes when the rider leaves the screen.
 */
@Injectable()
export class LinkCopy {
  private readonly clipboard = inject(CLIPBOARD);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly done = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Whether the address was copied in the last two seconds. */
  readonly copied = this.done.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.forget());
  }

  /** Copies the page's address as the address bar has it. */
  async copy(): Promise<void> {
    try {
      await this.clipboard.copy(this.window?.location.href ?? '');
    } catch {
      return; // nothing was copied, so nothing says it was
    }
    this.forget();
    this.done.set(true);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.done.set(false);
    }, COPIED_FOR_MS);
  }

  private forget(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
