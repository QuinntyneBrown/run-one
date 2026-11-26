// Unit test
// Traces to: L2-181 AC1; L2-182 AC1
// Description: the ending is the banner for 3.2 s, then the roll-out for 5.2 s, then over; it reads the clock source so
// a throttled tab does not stretch it, and releases its timer and listener. Fake timers, never sleeps.
import { TestBed } from '@angular/core/testing';
import { MONOTONIC_TIME } from '@telo/api';
import { BANNER_MS, ROLL_OUT_MS, RideEnding, rideEndingAt } from './ride-ending';

describe('rideEndingAt', () => {
  it.each([
    [0, 'banner', 0],
    [3_199, 'banner', 0],
    [3_200, 'roll-out', 0],
    [5_800, 'roll-out', 0.5],
    [8_399, 'roll-out', 5_199 / 5_200],
    [8_400, 'over', 1],
    [60_000, 'over', 1],
  ])('at %i ms it is %s at %d of the roll-out', (elapsed, stage, share) => {
    const state = rideEndingAt(elapsed);
    expect(state.stage).toBe(stage);
    expect(state.rollOutShare).toBeCloseTo(share, 5);
  });

  it('keeps the timings the requirements give', () => {
    expect(BANNER_MS).toBe(3_200);
    expect(ROLL_OUT_MS).toBe(5_200);
  });
});

describe('RideEnding', () => {
  let ending: RideEnding;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [RideEnding, { provide: MONOTONIC_TIME, useValue: { now: () => Date.now() } }],
    });
    ending = TestBed.inject(RideEnding);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows nothing until it starts', () => {
    expect(ending.state()).toBeNull();
  });

  it('is the banner, then the roll-out, then over', () => {
    ending.start();
    expect(ending.state()?.stage).toBe('banner');
    vi.advanceTimersByTime(3_200);
    expect(ending.state()?.stage).toBe('roll-out');
    vi.advanceTimersByTime(5_200);
    expect(ending.state()?.stage).toBe('over');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reads the clock when a hidden tab shows, not its own wake-ups', () => {
    ending.start();
    vi.setSystemTime(Date.now() + 9_000);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ending.state()?.stage).toBe('over');
  });

  it('releases its timer and listener when its owner is destroyed', () => {
    ending.start();
    expect(vi.getTimerCount()).toBe(1);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });
});
