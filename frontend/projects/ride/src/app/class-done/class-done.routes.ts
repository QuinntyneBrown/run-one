import type { Routes } from '@angular/router';
import { INTENSITY_DEFAULT } from '@telo/api';
import { IntensityStore } from '@telo/domain';

/** Class Done, for a finished class (L2-078): at `/done`, opened by a ride's finish. */
export const classDoneRoutes: Routes = [
  {
    path: '',
    title: 'Class Done · Telo Ride 1',
    // The rider's default intensity, which Class Done may be asked to keep (L2-184).
    providers: [{ provide: INTENSITY_DEFAULT, useClass: IntensityStore }],
    loadComponent: () => import('./class-done-page'),
  },
];
