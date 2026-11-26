// Unit test
// Traces to: L2-180 AC2, AC5, AC7
// Description: the countdown reads "3", "2", "1" and "Go!" from the monotonic time at each boundary, goes at 3.7 s,
// says when "Go!" was due once, reads the clock and not its own wake-ups after a hidden tab, begins again from "3"
// after a stop, and releases its timer and listener. Fake timers, never sleeps.
import { TestBed } from '@angular/core/testing';
import { MONOTONIC_TIME } from '@telo/api';
import { COUNT_MS, Countdown, GO_MS, countdownStep } from './countdown';

describe('countdownStep', () => {
  it.each([
    [0, '3', 0, false, false],
    [999, '3', 0, false, false],
    [1_000, '2', 1, false, false],
    [1_999, '2', 1, false, false],
    [2_000, '1', 2, false, false],
    [2_999, '1', 2, false, false],
    [3_000, 'Go!', 3, true, false],
    [3_699, 'Go!', 3, true, false],
    [3_700, 'Go!', 3, true, true],
    [60_000, 'Go!', 3, true, true],
  ])('at %i ms it reads %s with %i lights (L2-180 AC2)', (elapsed, numeral, lit, go, over) => {
    expect(countdownStep(elapsed)).toEqual({ numeral, lit, go, over });
  });

  it('keeps the timings the requirement gives: a second each, then 0.7 s of "Go!"', () => {
    expect(COUNT_MS).toBe(1_000);
    expect(GO_MS).toBe(700);
  });
});

describe('Countdown', () => {
  let countdown: Countdown;
  let goes: number[];

  const showTab = () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [Countdown, { provide: MONOTONIC_TIME, useValue: { now: () => Date.now() } }],
    });
    countdown = TestBed.inject(Countdown);
    goes = [];
    countdown.go.subscribe((at) => goes.push(at));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows nothing until it starts (L2-180 AC1)', () => {
    expect(countdown.step()).toBeNull();
  });

  it('shows "3" at once and then each numeral for a second, with "Go!" once (L2-180 AC2)', () => {
    countdown.start();
    expect(countdown.step()).toMatchObject({ numeral: '3', lit: 0 });

    vi.advanceTimersByTime(1_000);
    expect(countdown.step()).toMatchObject({ numeral: '2', lit: 1 });
    vi.advanceTimersByTime(1_000);
    expect(countdown.step()).toMatchObject({ numeral: '1', lit: 2 });
    expect(goes).toEqual([]);

    const startedAt = Date.now() - 2_000;
    vi.advanceTimersByTime(1_000);
    expect(countdown.step()).toMatchObject({ numeral: 'Go!', lit: 3, go: true });
    expect(goes).toEqual([startedAt + 3_000]);
  });

  it('goes 0.7 s after "Go!" and says nothing more (L2-180 AC2)', () => {
    countdown.start();
    vi.advanceTimersByTime(3_700);
    expect(countdown.step()).toBeNull();
    vi.advanceTimersByTime(10_000);
    expect(goes).toHaveLength(1);
  });

  it('is counted by the clock: a tab hidden through it reads it over, with "Go!" due when it was (L2-180 AC5)', () => {
    countdown.start();
    const startedAt = Date.now();
    // The browser's throttled timers never fired; the clock moved on.
    vi.setSystemTime(startedAt + 5_000);
    showTab();

    expect(countdown.step()).toBeNull();
    expect(goes).toEqual([startedAt + 3_000]);
  });

  it('begins again from "3" after a stop and says "Go!" once for the second start (L2-180 AC7)', () => {
    countdown.start();
    vi.advanceTimersByTime(1_500);
    expect(countdown.step()).toMatchObject({ numeral: '2' });

    countdown.stop();
    expect(countdown.step()).toBeNull();
    vi.advanceTimersByTime(10_000);
    expect(goes).toEqual([]);

    countdown.start();
    expect(countdown.step()).toMatchObject({ numeral: '3', lit: 0 });
    vi.advanceTimersByTime(3_000);
    expect(goes).toHaveLength(1);
  });

  it('releases its timer and its listener when it stops and when its owner is destroyed', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    countdown.start();
    expect(vi.getTimerCount()).toBe(1);

    countdown.stop();
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    countdown.start();
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });
});
