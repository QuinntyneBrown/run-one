import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { BIKE_CONNECTION } from '@telo/api';

/**
 * Class Ride's guard (L2-087 AC4; docs/detailed-designs/class-ride/ride-the-class): a ride starts only with a
 * connected bike, so `/ride` opened any other way (a bookmark, a typed address, a reload) opens `/` instead, which
 * sends a new rider on to Connect Bike (L2-167 AC3). It reads `ble` and calls nothing, so nothing is asked of
 * Bluetooth: a blocked browser, which can have no connected bike, gets The Class the same way (L2-010 AC2).
 */
export const connectedBikeGuard: CanActivateFn = () => {
  return inject(BIKE_CONNECTION).ble() === 'connected' ? true : inject(Router).createUrlTree(['/']);
};
