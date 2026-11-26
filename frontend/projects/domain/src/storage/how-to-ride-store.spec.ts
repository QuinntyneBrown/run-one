// Unit test
// Traces to: L2-173 AC2; L2-132 AC2
// Description: the rider's choice of how to ride survives a reload as one localStorage value; a rider who has never
// chosen, or a value the app does not know, has none.
import { TestBed } from '@angular/core/testing';
import { HOW_TO_RIDE_KEY, HowToRideStore } from './how-to-ride-store';

describe('HowToRideStore', () => {
  const fresh = (): HowToRideStore => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [HowToRideStore] });
    return TestBed.inject(HowToRideStore);
  };

  beforeEach(() => localStorage.clear());

  it('has no choice until one is kept', () => {
    expect(fresh().kept()).toBeNull();
  });

  it('gives back the choice it kept, from a fresh store', () => {
    fresh().keep('ibiza');
    expect(fresh().kept()).toBe('ibiza');
    fresh().keep('video');
    expect(fresh().kept()).toBe('video');
  });

  it('counts a value it does not know as never chosen', () => {
    localStorage.setItem(HOW_TO_RIDE_KEY, 'neon-docklands');
    expect(fresh().kept()).toBeNull();
  });
});
