import type { Routes } from '@angular/router';
import { theClassGuard } from '../classes/the-class.guard';
import { provideClassRide } from './provide-class-ride';

/**
 * The class ride's route, loaded with it: its providers bring the class, the ride's clock and the world's renderer,
 * so their code stays out of every other screen's chunks (AGENTS.md, lazy loading first). A class that breaks a rule
 * has no ride (L2-080 AC3).
 */
export const classRideRoutes: Routes = [
  {
    path: '',
    title: 'Class ride · Telo Ride 1',
    providers: [provideClassRide()],
    canActivate: [theClassGuard],
    loadComponent: () => import('./ride-page'),
  },
];
