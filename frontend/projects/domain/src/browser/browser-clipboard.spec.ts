// Unit test
// Traces to: L2-008 AC3
// Description: copying writes the text to the browser's clipboard and resolves once it is there; a browser that
// refuses, and a browser with no clipboard, reject.
import { TestBed } from '@angular/core/testing';
import { BrowserClipboard } from './browser-clipboard';

describe('BrowserClipboard', () => {
  const create = (clipboard: unknown) => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
    TestBed.configureTestingModule({ providers: [BrowserClipboard] });
    return TestBed.inject(BrowserClipboard);
  };

  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn(async () => undefined);

    await create({ writeText }).copy('https://ride.telo.app/');

    expect(writeText).toHaveBeenCalledExactlyOnceWith('https://ride.telo.app/');
  });

  it('rejects when the browser refuses', async () => {
    const refusal = new DOMException('Write permission denied.', 'NotAllowedError');
    const clipboard = create({ writeText: () => Promise.reject(refusal) });

    await expect(clipboard.copy('https://ride.telo.app/')).rejects.toBe(refusal);
  });

  it('rejects in a browser with no clipboard', async () => {
    await expect(create(undefined).copy('https://ride.telo.app/')).rejects.toThrow();
  });
});
