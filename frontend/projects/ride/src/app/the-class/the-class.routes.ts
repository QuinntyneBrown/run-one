import type { Routes } from '@angular/router';
import { CLIPBOARD } from '@telo/api';
import { BrowserClipboard } from '@telo/domain';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideHowToRide } from '../classes/provide-how-to-ride';
import { provideTheClass } from '../classes/provide-the-class';

/**
 * The Class's route at `/`, loaded with it: the one class (ADR 0037), the video's
 * player, the rider's choice of how to ride and the clipboard are bound here, so their code stays out of the other screens' chunks (AGENTS.md, lazy loading first). The
 * page provides its own store, which goes when the rider leaves.
 */
export const theClassRoutes: Routes = [
  {
    path: '',
    title: 'Telo Ride 1',
    providers: [
      provideTheClass(),
      provideClassVideo(),
      provideHowToRide(),
      // The clipboard Copy link writes to in a browser without Web Bluetooth (L2-008 AC3).
      { provide: CLIPBOARD, useClass: BrowserClipboard },
    ],
    loadComponent: () => import('./the-class-page'),
  },
];
