// Unit test (the slice's acceptance table: the header clock that shows it comes with slice 5.2)
// Traces to: L2-133 AC1; L2-027 AC3
// Description: the ride clock is the monotonic time since the start, less the time paused; it never counts ticks. It
// can start from a moment already past, the group session's start.
import { TestBed } from '@angular/core/testing';
import { MONOTONIC_TIME } from '@telo/api';
import { RideClock } from './ride-clock';

describe('RideClock', () => {
  let now: number;
  let clock: RideClock;

  beforeEach(() => {
    now = 1_000;
    TestBed.configureTestingModule({
      providers: [RideClock, { provide: MONOTONIC_TIME, useValue: { now: () => now } }],
    });
    clock = TestBed.inject(RideClock);
  });

  it('reads 0:00 before the ride starts', () => {
    now = 9_000;

    expect(clock.elapsedMs()).toBe(0);
    expect(clock.running()).toBe(false);
  });

  it('is the monotonic time since the start, whatever ticks came (L2-133 AC1)', () => {
    clock.start();
    now += 7_000;
    expect(clock.elapsedMs()).toBe(7_000);
    expect(clock.running()).toBe(true);

    now += 600_000;
    expect(clock.elapsedMs()).toBe(607_000);
  });

  it('can start from an instant already past, as "Go!" of a countdown a late timer reached (L2-180 AC5)', () => {
    clock.start(now - 2_000);

    expect(clock.elapsedMs()).toBe(2_000);
    now += 500;
    expect(clock.elapsedMs()).toBe(2_500);
  });

  it('stands still while paused, and goes on from there after Resume (L2-027 AC3)', () => {
    clock.start();
    now += 7_000;
    clock.pause();
    now += 5_000;
    expect(clock.elapsedMs()).toBe(7_000);
    expect(clock.running()).toBe(false);

    clock.resume();
    now += 3_000;
    expect(clock.elapsedMs()).toBe(10_000);
  });

  it('ignores a second pause or a resume that is not paused', () => {
    clock.start();
    now += 2_000;
    clock.resume();
    clock.pause();
    now += 1_000;
    clock.pause();
    now += 1_000;
    clock.resume();
    now += 1_000;

    expect(clock.elapsedMs()).toBe(3_000);
  });
});
