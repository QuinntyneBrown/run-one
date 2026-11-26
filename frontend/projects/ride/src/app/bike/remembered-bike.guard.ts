import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { BIKE_CONNECTION, FINISHED_RIDES, REMEMBERED_BIKE } from '@telo/api';
import { openingScreen } from '@telo/domain';

/**
 * Where the app opens (L2-167; docs/detailed-designs/the-class/open-the-app). A new rider, with no remembered bike
 * and no finished ride, is sent to Connect Bike, in a blocked browser too, where Connect Bike says why (AC1, AC3).
 * Every other rider goes through to The Class (AC2), and the app starts reconnecting to a remembered bike without the
 * chooser, without waiting for it (L2-015 AC1). Both answers are read from the device's storage synchronously, so the
 * router never draws the wrong screen first.
 */
export const rememberedBikeGuard: CanActivateFn = () => {
  const remembered = inject(REMEMBERED_BIKE).get();
  const finishedRide = inject(FINISHED_RIDES).any();
  if (openingScreen({ rememberedBike: remembered !== null, finishedRide }) === 'connect-bike')
    return inject(Router).createUrlTree(['/connect']);
  if (remembered) void inject(BIKE_CONNECTION).reconnectRemembered(remembered);
  return true;
};
