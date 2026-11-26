import type { BluetoothSupportState } from '@telo/api';
import type { BrowserNoticeIcon } from '@telo/components';

/**
 * The alert under The Class's header in a blocked browser (docs/detailed-designs/bike/check-bike-and-browser-support).
 * `way` is the way forward its action takes: `copy` copies the page's address, to open in Chrome or Edge, and `secure`
 * is a link to the same address on `https://`.
 */
export interface BrowserNoticeView {
  readonly icon: BrowserNoticeIcon;
  readonly title: string;
  readonly body: string;
  readonly way: 'copy' | 'secure';
}

/**
 * Why this browser cannot reach a bike, in the rider's words, or `null` when it can (L2-008 AC2, AC4; L2-009 AC1,
 * AC3). A page on plain http is told to go secure, never to change browser. Bluetooth switched off has no alert here:
 * Connect Bike, where the start button leads, says so (L2-018).
 */
export function browserNotice(support: BluetoothSupportState): BrowserNoticeView | null {
  switch (support) {
    case 'unsupported-browser':
      return {
        icon: 'browser',
        title: 'Open Telo Ride 1 in Chrome or Edge.',
        body: 'Bluetooth to the bike only works there — you can look around, but not ride.',
        way: 'copy',
      };
    case 'insecure-context':
      return {
        icon: 'lock',
        title: 'Open the secure version of this page.',
        body: 'Bluetooth is blocked on plain http, so the bike can’t connect.',
        way: 'secure',
      };
    default:
      return null;
  }
}
