// Unit test
// Traces to: L2-184 AC2, AC5; L2-129
// Description: the rider's default intensity in localStorage: 5 until a whole number from 0 to 10 is kept, and a
// refusal said, not thrown.
import { TestBed } from '@angular/core/testing';
import { INTENSITY_KEY, IntensityStore } from './intensity-store';

describe('IntensityStore', () => {
  let store: IntensityStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [IntensityStore] });
    store = TestBed.inject(IntensityStore);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('is 5 when nothing is kept', () => {
    expect(store.kept()).toBe(5);
  });

  it('keeps a default and reads it back (L2-184 AC2)', () => {
    expect(store.keep(7)).toBe(true);
    expect(localStorage.getItem(INTENSITY_KEY)).toBe('7');
    expect(store.kept()).toBe(7);
    store.keep(0);
    expect(store.kept()).toBe(0);
  });

  it('counts anything but a whole number from 0 to 10 as 5 (L2-184 AC5, L2-129)', () => {
    for (const raw of ['11', '-1', '6.5', '', 'loud', '<b>7</b>', ' 7', '007']) {
      localStorage.setItem(INTENSITY_KEY, raw);
      expect(store.kept(), raw).toBe(5);
    }
  });

  it('says when storage refuses, and reads 5 when it cannot read (L2-184 AC5)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(store.keep(7)).toBe(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(store.kept()).toBe(5);
  });
});
