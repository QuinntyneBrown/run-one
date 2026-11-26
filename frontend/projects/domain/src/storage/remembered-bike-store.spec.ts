// Unit test
// Traces to: L2-015 AC1, AC3, AC4
// Description: the remembered bike survives a reload as one localStorage record that holds only the browser's
// identifier for the bike and its name; saving another bike replaces it, a record it cannot read counts as no bike,
// a record an earlier version wrote is read for its identifier and name, and forgetting removes it.
import { TestBed } from '@angular/core/testing';
import type { BikeInfo } from '@telo/api';
import { REMEMBERED_BIKE_KEY, RememberedBikeStore } from './remembered-bike-store';

const BIKE: BikeInfo = {
  id: 'kK3fA9==',
  name: 'Echelon EX-5s',
  identifier: 'EX5S-141844',
  kind: 'echelon',
};

describe('RememberedBikeStore', () => {
  let store: RememberedBikeStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [RememberedBikeStore] });
    store = TestBed.inject(RememberedBikeStore);
  });

  it('has no bike until one is saved', () => {
    expect(store.get()).toBeNull();
  });

  it('gives back the bike it saved, from a fresh store', () => {
    store.save(BIKE);

    expect(TestBed.runInInjectionContext(() => new RememberedBikeStore()).get()).toEqual({
      id: 'kK3fA9==',
      name: 'Echelon EX-5s',
    });
  });

  it('keeps only the identifier and the name, whatever else the bike carries (AC4)', () => {
    store.save(BIKE);

    expect(JSON.parse(localStorage.getItem(REMEMBERED_BIKE_KEY) ?? 'null')).toEqual({
      id: 'kK3fA9==',
      name: 'Echelon EX-5s',
    });
  });

  it('replaces the remembered bike with the one saved last (AC3)', () => {
    store.save(BIKE);
    store.save({ id: 'q7Zm1w==', name: 'Echelon EX-3' });

    expect(store.get()).toEqual({ id: 'q7Zm1w==', name: 'Echelon EX-3' });
  });

  it.each([
    ['not JSON', '{'],
    ['not an object', '"bike"'],
    ['no id', JSON.stringify({ name: 'Echelon EX-5s' })],
    ['an empty id', JSON.stringify({ id: '', name: 'Echelon EX-5s' })],
    ['a numeric id', JSON.stringify({ id: 5, name: 'Echelon EX-5s' })],
    ['no name', JSON.stringify({ id: 'a' })],
  ])('counts a record that is %s as no bike', (_, raw) => {
    localStorage.setItem(REMEMBERED_BIKE_KEY, raw);

    expect(store.get()).toBeNull();
  });

  it('reads the identifier and the name of a record an earlier version wrote', () => {
    localStorage.setItem(
      REMEMBERED_BIKE_KEY,
      JSON.stringify({ ...BIKE, seenAt: '2026-11-20T00:00:00.000Z' }),
    );

    expect(store.get()).toEqual({ id: 'kK3fA9==', name: 'Echelon EX-5s' });
  });

  it('forgets the bike', () => {
    store.save(BIKE);
    store.forget();

    expect(store.get()).toBeNull();
  });

  it('cuts a name over 64 characters to 64 when it saves and when it reads (L2-129 AC2)', () => {
    const long = 'x'.repeat(100);
    store.save({ id: 'kK3fA9==', name: long });
    expect(JSON.parse(localStorage.getItem(REMEMBERED_BIKE_KEY)!).name).toHaveLength(64);

    localStorage.setItem(REMEMBERED_BIKE_KEY, JSON.stringify({ id: 'kK3fA9==', name: long }));
    expect(store.get()?.name).toHaveLength(64);
  });

  it('counts a record that is not an object, or has no identifier or name, as no bike (L2-129 AC3)', () => {
    for (const bad of [
      '"text"',
      '[]',
      '{"id":"","name":"A"}',
      '{"id":"a"}',
      '{"id":1,"name":"A"}',
      '{bad',
    ]) {
      localStorage.setItem(REMEMBERED_BIKE_KEY, bad);
      expect(store.get()).toBeNull();
    }
  });
});
