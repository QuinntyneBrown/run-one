import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import type { DisplayPreferences } from '@telo/api';

/**
 * `DisplayPreferences` in the browser: reads this device's media queries, and marks `<html>` with `data-theme` and
 * `data-motion` (`reduced` or `full`), which the tokens honour, so a change of the device's applies to every screen at
 * once (L2-142, L2-143). Stops listening when its owner is destroyed.
 */
@Injectable()
export class BrowserDisplayPreferences implements DisplayPreferences {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly reducedMotion = this.media('(prefers-reduced-motion: reduce)');
  private readonly deviceAsksLight = this.media('(prefers-color-scheme: light)');

  readonly theme = computed<'dark' | 'light'>(() => (this.deviceAsksLight() ? 'light' : 'dark'));

  constructor() {
    const html = this.document.documentElement;
    effect(() => {
      html.dataset['theme'] = this.theme();
      html.dataset['motion'] = this.reducedMotion() ? 'reduced' : 'full';
    });
  }

  /** Whether `query` matches now, kept by its `change` events. */
  private media(query: string) {
    const list = this.document.defaultView?.matchMedia?.(query) ?? null;
    const matches = signal(list?.matches ?? false);
    const onChange = (event: MediaQueryListEvent) => matches.set(event.matches);
    list?.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => list?.removeEventListener('change', onChange));
    return matches.asReadonly();
  }
}
