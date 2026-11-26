// Unit test
// Traces to: L2-078 AC2, AC3, AC4
// Description: Class Done's output is the ride's output in whole kJ, its time the running time, and its average
// watts round(output in kJ × 1000 ÷ running seconds).
import type { ClassResult } from '@telo/api';
import { classDoneView } from './class-done-view';

const ride = (
  outputKj: number,
  elapsedSeconds: number,
  previousBestKj: number | null = null,
  efforts: readonly number[] = [],
): ClassResult => ({
  classId: 'intervals-to-the-beat',
  title: 'Intervals to the Beat',
  elapsedSeconds,
  outputKj,
  onTargetShare: 0.84,
  previousBestKj,
  efforts,
  saved: true,
});

describe('classDoneView', () => {
  it('shows the output in whole kJ, the time and the average watts (L2-078 AC2)', () => {
    expect(classDoneView(ride(351, 1200))).toEqual({
      title: 'Intervals to the Beat',
      output: '351',
      time: '20:00',
      average: '293',
      onTarget: '84%',
      verdict: 'Class done. That’s your number to beat.',
      best: false,
      bestFact: null,
      saved: true,
      efforts: [],
      announcement: 'Class done. That’s your number to beat. 351 kJ in 20:00.',
    });
  });

  it('rounds the output to a whole kJ (L2-078 AC4)', () => {
    expect(classDoneView(ride(341.6, 1200)).output).toBe('342');
    expect(classDoneView(ride(341.4, 1200)).output).toBe('341');
  });

  it('averages from the unrounded output over the running seconds (L2-078 AC3)', () => {
    // 341.6 kJ over 1,200 s is 284.67 W; 5.2 kJ over 12 s is 433.3 W.
    expect(classDoneView(ride(341.6, 1200)).average).toBe('285');
    expect(classDoneView(ride(5.2, 12)).average).toBe('433');
  });

  it('is 0 W for a ride of no seconds, and shows an hour as 1:02:03', () => {
    expect(classDoneView(ride(0, 0)).average).toBe('0');
    expect(classDoneView(ride(10, 3723)).time).toBe('1:02:03');
  });
  describe('the on-target share (L2-170 AC2)', () => {
    const share = (onTargetShare: number) =>
      classDoneView({ ...ride(351, 1200), onTargetShare }).onTarget;

    it('is a whole percentage rounded to nearest', () => {
      expect(share(0.84)).toBe('84%');
      expect(share(0.0333)).toBe('3%');
      expect(share(0.845)).toBe('85%');
      expect(share(1)).toBe('100%');
    });

    it('is 0% when no second was on target', () => {
      expect(share(0)).toBe('0%');
    });
  });

  describe('the verdict (L2-077)', () => {
    it('is a new best when the output beats the earlier best, with the previous best as a fact (AC1, AC4)', () => {
      expect(classDoneView(ride(351, 1200, 342))).toMatchObject({
        verdict: 'New best output',
        best: true,
        bestFact: { label: 'Previous best', value: '342 kJ' },
        announcement: 'New best output. 351 kJ in 20:00.',
      });
    });

    it('compares whole kJ: 342.4 kJ against a best of 342 is not a new best (AC1, AC2)', () => {
      expect(classDoneView(ride(342.4, 1200, 342)).best).toBe(false);
      expect(classDoneView(ride(342.6, 1200, 342)).best).toBe(true);
    });

    it('says the best is still the best when the output is lower or equal, with the best as a fact (AC2)', () => {
      for (const kj of [318, 342]) {
        expect(classDoneView(ride(kj, 1200, 342))).toMatchObject({
          verdict: 'Your best is still 342 kJ',
          best: false,
          bestFact: { label: 'Best', value: '342 kJ' },
        });
      }
    });

    it('calls the first finished ride the number to beat, with no best fact and no gold (AC3)', () => {
      expect(classDoneView(ride(351, 1200, null))).toMatchObject({
        verdict: 'Class done. That’s your number to beat.',
        best: false,
        bestFact: null,
      });
    });
  });
  describe('the saved flag (L2-168 AC4)', () => {
    it('carries whether the ride was kept', () => {
      expect(classDoneView({ ...ride(351, 1200), saved: false }).saved).toBe(false);
      expect(classDoneView(ride(351, 1200)).saved).toBe(true);
    });
  });

  describe('the efforts (L2-169)', () => {
    const efforts = (watts: number[]) => classDoneView(ride(351, 1200, null, watts)).efforts;

    it('lists them in plan order with their watts and a height as a share of the strongest (AC1, AC3)', () => {
      expect(efforts([200, 400, 300])).toEqual([
        { number: 1, watts: 200, height: 50, strongest: false },
        { number: 2, watts: 400, height: 100, strongest: true },
        { number: 3, watts: 300, height: 75, strongest: false },
      ]);
    });

    it('sets the earliest apart where efforts tie for the strongest (AC4)', () => {
      expect(efforts([350, 350, 200]).map((e) => e.strongest)).toEqual([true, false, false]);
    });

    it('marks none the strongest, and draws none above the minimum, when every effort is 0 W (AC5)', () => {
      const all = efforts([0, 0, 0]);
      expect(all.map((e) => e.strongest)).toEqual([false, false, false]);
      expect(all.map((e) => e.height)).toEqual([0, 0, 0]);
    });

    it('has none for a result with no efforts', () => {
      expect(efforts([])).toEqual([]);
    });
  });
});
