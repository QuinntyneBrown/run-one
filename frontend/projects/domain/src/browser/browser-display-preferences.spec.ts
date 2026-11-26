// Unit test
// Traces to: L2-142, L2-143 AC1, AC2
// Description: reduced motion and the theme follow this device, and its changes as they come; <html> carries the theme
// and the motion at once, and the media queries are let go when the owner goes.
import { TestBed } from '@angular/core/testing';
import { BrowserDisplayPreferences } from './browser-display-preferences';

/** A fake `matchMedia`: each query matches as told, and can be told it changed. */
function fakeMedia(matching: Record<string, boolean>) {
  const listeners = new Map<string, Set<(event: { matches: boolean }) => void>>();
  vi.stubGlobal('matchMedia', (query: string) => {
    const set = listeners.get(query) ?? new Set();
    listeners.set(query, set);
    return {
      matches: matching[query] ?? false,
      addEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
        set.add(listener),
      removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
        set.delete(listener),
    };
  });
  return {
    change: (query: string, matches: boolean) =>
      listeners.get(query)?.forEach((listener) => listener({ matches })),
    listening: () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0),
  };
}

const REDUCE = '(prefers-reduced-motion: reduce)';
const LIGHT = '(prefers-color-scheme: light)';

describe('BrowserDisplayPreferences', () => {
  function preferences(): BrowserDisplayPreferences {
    TestBed.configureTestingModule({ providers: [BrowserDisplayPreferences] });
    const display = TestBed.inject(BrowserDisplayPreferences);
    TestBed.tick();
    return display;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it.each([
    [false, false],
    [true, true],
  ] as const)('the device asking for reduced motion %s: reduced is %s', (asks, reduced) => {
    fakeMedia({ [REDUCE]: asks });
    const display = preferences();

    expect(display.reducedMotion()).toBe(reduced);
    expect(document.documentElement.dataset['motion']).toBe(reduced ? 'reduced' : 'full');
  });

  it.each([
    [false, 'dark'],
    [true, 'light'],
  ] as const)('the device asking for light %s: the theme is %s', (light, theme) => {
    fakeMedia({ [LIGHT]: light });
    const display = preferences();

    expect(display.theme()).toBe(theme);
    expect(document.documentElement.dataset['theme']).toBe(theme);
  });

  it('follows the device when it changes its mind', () => {
    const media = fakeMedia({});
    const display = preferences();

    media.change(REDUCE, true);
    media.change(LIGHT, true);
    TestBed.tick();

    expect(display.reducedMotion()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('stops listening to the device when its owner goes', () => {
    const media = fakeMedia({});
    preferences();
    expect(media.listening()).toBe(2);

    TestBed.resetTestingModule();

    expect(media.listening()).toBe(0);
  });
});
