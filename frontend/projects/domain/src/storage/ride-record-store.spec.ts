// Unit test
// Traces to: L2-168 AC1, AC3, AC5; L2-132 AC2, AC4
// Description: the record holds the ride count, the best output and the last output in whole kJ, as one small value
// in the device's storage: a finished ride adds one, sets the last, and sets the best when it is higher or there is
// none; the same record reads back in a new store; it is the same size after any number of rides; a value it cannot
// read, or storage the browser refuses, counts as no rides.
import { TestBed } from '@angular/core/testing';
import { RIDE_RECORD_KEY, RideRecordStore } from './ride-record-store';

describe('RideRecordStore', () => {
  const create = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [RideRecordStore] });
    return TestBed.inject(RideRecordStore);
  };

  beforeEach(() => localStorage.removeItem(RIDE_RECORD_KEY));
  afterEach(() => {
    localStorage.removeItem(RIDE_RECORD_KEY);
    vi.restoreAllMocks();
  });

  it('is empty for a new rider, who has finished no ride', () => {
    const record = create();
    expect(record.read()).toEqual({ rides: 0, bestKj: null, lastKj: null });
    expect(record.any()).toBe(false);
  });

  it('counts a finished ride, with its output in whole kJ as the best and the last (L2-168 AC1)', () => {
    const record = create();
    expect(record.add(342.6)).toBe(true);
    expect(record.read()).toEqual({ rides: 1, bestKj: 343, lastKj: 343 });
    expect(record.any()).toBe(true);
  });

  it('keeps a higher best, and sets the best again when a ride beats it (L2-168 AC1)', () => {
    const record = create();
    record.add(300);
    record.add(250);
    expect(record.read()).toEqual({ rides: 2, bestKj: 300, lastKj: 250 });
    record.add(310);
    expect(record.read()).toEqual({ rides: 3, bestKj: 310, lastKj: 310 });
    record.add(310);
    expect(record.read()).toEqual({ rides: 4, bestKj: 310, lastKj: 310 });
  });

  it('counts a ride of no output as a ride, and a best of 0 beaten by any output', () => {
    const record = create();
    record.add(0);
    expect(record.read()).toEqual({ rides: 1, bestKj: 0, lastKj: 0 });
    record.add(5);
    expect(record.read().bestKj).toBe(5);
  });

  it('reads back in a new store, as when the app is opened again (L2-168 AC3)', () => {
    create().add(280);
    expect(create().read()).toEqual({ rides: 1, bestKj: 280, lastKj: 280 });
    expect(create().any()).toBe(true);
  });

  it('is the same size after any number of rides (L2-168 AC5)', () => {
    const record = create();
    for (let ride = 0; ride < 9; ride++) record.add(100 + ride);
    const nine = localStorage.getItem(RIDE_RECORD_KEY)!.length;
    for (let ride = 0; ride < 990; ride++) record.add(100 + (ride % 9));
    expect(localStorage.getItem(RIDE_RECORD_KEY)!.length).toBeLessThanOrEqual(nine + 3);
    expect(Object.keys(JSON.parse(localStorage.getItem(RIDE_RECORD_KEY)!))).toEqual([
      'rides',
      'best',
      'last',
    ]);
  });

  it('counts a value it cannot read as no rides, and starts again from it', () => {
    for (const bad of [
      'not json',
      '{"rides":-1,"best":1,"last":1}',
      '{"rides":1.5,"best":1,"last":1}',
      '[]',
      '{"rides":2}',
    ]) {
      localStorage.setItem(RIDE_RECORD_KEY, bad);
      const record = create();
      expect(record.read(), bad).toEqual({ rides: 0, bestKj: null, lastKj: null });
      expect(record.any()).toBe(false);
    }
    localStorage.setItem(RIDE_RECORD_KEY, 'not json');
    const record = create();
    record.add(120);
    expect(record.read()).toEqual({ rides: 1, bestKj: 120, lastKj: 120 });
  });

  it('answers false from add, and counts no rides, where storage is refused (L2-132 AC4)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const record = create();
    expect(record.read()).toEqual({ rides: 0, bestKj: null, lastKj: null });
    expect(record.add(200)).toBe(false);
    expect(record.any()).toBe(false);
  });
});
