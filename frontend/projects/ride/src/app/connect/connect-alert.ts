import type { BluetoothSupportState } from '@telo/api';
import type { ConnectBlockerIcon } from '@telo/components';
import type { ConnectView } from './connect-bike-store';

/**
 * The alert that stands in for the device card (docs/detailed-designs/bike/check-bike-and-browser-support and
 * connect-a-bike). `way` is the way forward its action takes: `recheck` reads the browser again, `secure` is a link
 * to the same page on `https://`, and `pair` opens the chooser again.
 */
export interface ConnectAlert {
  readonly icon: ConnectBlockerIcon;
  readonly title: string;
  readonly body: string;
  readonly way: 'recheck' | 'secure' | 'pair';
}

/**
 * Why the bike cannot be reached, in the rider's words, or `null` when it can. What the browser cannot do comes
 * first: a page on plain http (L2-009 AC4), a browser without Web Bluetooth (L2-008 AC1) and Bluetooth switched off
 * (L2-018) each rule out the chooser, so a chooser that failed earlier (L2-012 AC4) is named only in a browser that
 * can reach the bike.
 */
export function connectAlert(
  support: BluetoothSupportState,
  view: ConnectView,
): ConnectAlert | null {
  switch (support) {
    case 'insecure-context':
      return {
        icon: 'lock',
        title: 'Open the secure version of this page',
        body: 'Bluetooth is blocked on plain http, so the bike can’t connect.',
        way: 'secure',
      };
    case 'unsupported-browser':
      return {
        icon: 'browser',
        title: "This browser can't reach the bike",
        body: "Open Telo Ride 1 in Chrome or Edge on a laptop or Android tablet. Safari and Firefox don't support Web Bluetooth yet.",
        way: 'recheck',
      };
    case 'adapter-off':
      return {
        icon: 'bluetooth-off',
        title: 'Bluetooth is off',
        body: 'Turn on Bluetooth on this computer, then try again.',
        way: 'recheck',
      };
    case 'ready':
      if (view.kind !== 'failed') return null;
      return view.reason === 'blocked'
        ? {
            icon: 'blocked',
            title: 'Bluetooth is blocked for this page',
            body: 'Allow Bluetooth for this site in your browser’s settings, then try again.',
            way: 'pair',
          }
        : {
            icon: 'blocked',
            title: 'The bike list didn’t open',
            body: 'Something went wrong opening your browser’s list of bikes. Try again.',
            way: 'pair',
          };
  }
}
