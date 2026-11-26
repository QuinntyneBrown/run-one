import type { BluetoothSupportState } from '@telo/api';

/**
 * Whether the browser is blocked (L2 glossary; L2-010): it cannot reach a bike at all, because it has no Web
 * Bluetooth (L2-008) or the page is not secure (L2-009). Bluetooth switched off is not blocked: the browser reaches
 * the bike once the rider turns it on (L2-018).
 */
export function isBlocked(state: BluetoothSupportState): boolean {
  return state === 'unsupported-browser' || state === 'insecure-context';
}
