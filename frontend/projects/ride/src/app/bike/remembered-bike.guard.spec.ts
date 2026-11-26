// Unit test
// Traces to: L2-167 AC1 to AC3; L2-015 AC1
// Description: the guard at `/` sends a new rider to Connect Bike and lets every other rider through to The Class,
// one case per row: no bike and no rides; a bike; rides; both. It starts reconnecting to a remembered bike without
// waiting for it, asks nothing of the bike where none is remembered, and never asks whether the browser is blocked.
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  Router,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import {
  BIKE_CONNECTION,
  FINISHED_RIDES,
  REMEMBERED_BIKE,
  type RememberedBikeRecord,
} from '@telo/api';
import { rememberedBikeGuard } from './remembered-bike.guard';

const BIKE: RememberedBikeRecord = { id: 'kK3fA9==', name: 'Echelon EX-5s' };

describe('rememberedBikeGuard', () => {
  /** Runs the guard for a rider, and gives what it answered and the bikes it started reconnecting to. */
  const open = (rider: { bike: RememberedBikeRecord | null; finishedRide: boolean }) => {
    const reconnected: RememberedBikeRecord[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: REMEMBERED_BIKE, useValue: { get: () => rider.bike } },
        { provide: FINISHED_RIDES, useValue: { any: () => rider.finishedRide } },
        {
          provide: BIKE_CONNECTION,
          useValue: {
            // Never settles: the guard must not wait for the bike.
            reconnectRemembered: (bike: RememberedBikeRecord) => {
              reconnected.push(bike);
              return new Promise<boolean>(() => undefined);
            },
          },
        },
      ],
    });
    const answer = TestBed.runInInjectionContext(() =>
      rememberedBikeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    const opens = answer instanceof UrlTree ? TestBed.inject(Router).serializeUrl(answer) : answer;
    return { opens, reconnected };
  };

  it.each([
    { name: 'no bike and no rides', bike: null, finishedRide: false, opens: '/connect' },
    { name: 'a bike', bike: BIKE, finishedRide: false, opens: true },
    { name: 'rides', bike: null, finishedRide: true, opens: true },
    { name: 'both', bike: BIKE, finishedRide: true, opens: true },
  ])('$name: $opens', ({ bike, finishedRide, opens }) => {
    expect(open({ bike, finishedRide }).opens).toBe(opens);
  });

  it('starts reconnecting to the remembered bike, without waiting for it (L2-015 AC1)', () => {
    expect(open({ bike: BIKE, finishedRide: false }).reconnected).toEqual([BIKE]);
  });

  it.each([
    { name: 'a new rider', finishedRide: false },
    { name: 'a rider with rides and no bike', finishedRide: true },
  ])('asks nothing of the bike for $name', ({ finishedRide }) => {
    expect(open({ bike: null, finishedRide }).reconnected).toEqual([]);
  });
});
