// Unit test
// Traces to: L2-087 AC4; L2-010 AC2
// Description: the guard on Class Ride's address lets a connected bike through and sends every other state of the
// link to The Class, one case per `ble` state. It reads `ble` and nothing else: the connection it is handed has no
// other member, so asking anything of the bike would throw. A blocked browser never connects, so its `ble` is idle.
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  Router,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { BIKE_CONNECTION, type BleState } from '@telo/api';
import { connectedBikeGuard } from './connected-bike.guard';

describe('connectedBikeGuard', () => {
  const open = (ble: BleState) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: BIKE_CONNECTION, useValue: { ble: () => ble } }],
    });
    const answer = TestBed.runInInjectionContext(() =>
      connectedBikeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    return answer instanceof UrlTree ? TestBed.inject(Router).serializeUrl(answer) : answer;
  };

  it.each<[BleState, string | boolean]>([
    ['connected', true],
    ['idle', '/'],
    ['connecting', '/'],
    ['disconnected', '/'],
  ])('%s: %s', (ble, opens) => {
    expect(open(ble)).toBe(opens);
  });
});
