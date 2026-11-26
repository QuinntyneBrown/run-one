// Unit test
// Traces to: L2-182 AC1, AC3
// Description: from the level the bike stands at, the target steps down one level at a time to 4, 110 ms apart; at or
// below 4 nothing is sent; a bike set by hand is sent nothing; a pending level is cleared on stop. Fake timers.
import { TestBed } from '@angular/core/testing';
import { EASE_OFF_STEP_MS, ResistanceEaseOff, easeOffLevels } from './ease-off';
import { ResistanceController } from './resistance-controller';

describe('easeOffLevels', () => {
  it('steps from 11 down to 4', () => {
    expect(easeOffLevels(11)).toEqual([10, 9, 8, 7, 6, 5, 4]);
  });
  it.each([4, 3, 1])('sends nothing from %i', (from) => {
    expect(easeOffLevels(from)).toEqual([]);
  });
});

describe('ResistanceEaseOff', () => {
  const applied: number[] = [];
  let state: { target: number | null; byHand: boolean; canControl: boolean };
  let easeOff: ResistanceEaseOff;

  beforeEach(() => {
    vi.useFakeTimers();
    applied.length = 0;
    state = { target: 11, byHand: false, canControl: true };
    TestBed.configureTestingModule({
      providers: [
        ResistanceEaseOff,
        {
          provide: ResistanceController,
          useValue: {
            target: () => state.target,
            byHand: () => state.byHand,
            canControl: () => state.canControl,
            applyPlanLevel: (level: number) => Promise.resolve(void applied.push(level)),
          },
        },
      ],
    });
    easeOff = TestBed.inject(ResistanceEaseOff);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('sends a level at once and then one every 110 ms to level 4', () => {
    easeOff.start();
    expect(applied).toEqual([10]);
    vi.advanceTimersByTime(EASE_OFF_STEP_MS * 6);
    expect(applied).toEqual([10, 9, 8, 7, 6, 5, 4]);
    vi.advanceTimersByTime(10_000);
    expect(applied).toHaveLength(7);
  });

  it('sends nothing to a bike set by hand, or one already at 4', () => {
    state.byHand = true;
    easeOff.start();
    state = { target: 4, byHand: false, canControl: true };
    easeOff.start();
    vi.advanceTimersByTime(1_000);
    expect(applied).toEqual([]);
  });

  it('clears the pending level when stopped', () => {
    easeOff.start();
    easeOff.stop();
    vi.advanceTimersByTime(1_000);
    expect(applied).toEqual([10]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
