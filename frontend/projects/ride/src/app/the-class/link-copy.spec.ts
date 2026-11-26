// Unit test
// Traces to: L2-008 AC3
// Description: Copy link copies the page's address and reads copied for two seconds, counted from the last press; a
// browser that refuses to copy is never said to have copied; and the timer goes with the screen.
import { TestBed } from '@angular/core/testing';
import { CLIPBOARD } from '@telo/api';
import { COPIED_FOR_MS, LinkCopy } from './link-copy';

describe('LinkCopy', () => {
  let texts: string[];
  let refuses: boolean;

  const create = () => {
    TestBed.configureTestingModule({
      providers: [
        LinkCopy,
        {
          provide: CLIPBOARD,
          useValue: {
            copy: async (text: string) => {
              if (refuses) throw new DOMException('Write permission denied.', 'NotAllowedError');
              texts.push(text);
            },
          },
        },
      ],
    });
    return TestBed.inject(LinkCopy);
  };

  beforeEach(() => {
    texts = [];
    refuses = false;
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('is not copied before the rider presses', () => {
    expect(create().copied()).toBe(false);
    expect(texts).toEqual([]);
  });

  it('copies the page’s address and reads copied for two seconds', async () => {
    const link = create();

    await link.copy();

    expect(texts).toEqual([location.href]);
    expect(link.copied()).toBe(true);
    vi.advanceTimersByTime(COPIED_FOR_MS - 1);
    expect(link.copied()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(link.copied()).toBe(false);
    expect(COPIED_FOR_MS).toBe(2000);
  });

  it('counts the two seconds from the last press', async () => {
    const link = create();
    await link.copy();
    vi.advanceTimersByTime(1500);

    await link.copy();

    expect(texts).toEqual([location.href, location.href]);
    vi.advanceTimersByTime(1500);
    expect(link.copied()).toBe(true);
    vi.advanceTimersByTime(500);
    expect(link.copied()).toBe(false);
  });

  it('never reads copied when the browser refuses, and does not throw', async () => {
    refuses = true;
    const link = create();

    await expect(link.copy()).resolves.toBeUndefined();

    expect(link.copied()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('drops its timer when the rider leaves the screen', async () => {
    const link = create();
    await link.copy();
    expect(vi.getTimerCount()).toBe(1);

    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
  });
});
