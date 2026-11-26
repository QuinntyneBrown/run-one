// Unit test
// Traces to: L2-008, L2-009, L2-010, L2-018
// Description: a browser is blocked when it has no Web Bluetooth or the page is not secure, one case per support
// state. Bluetooth switched off is not blocked.
import type { BluetoothSupportState } from '@telo/api';
import { isBlocked } from './is-blocked';

describe('isBlocked', () => {
  it.each<[BluetoothSupportState, boolean]>([
    ['ready', false],
    ['unsupported-browser', true],
    ['insecure-context', true],
    ['adapter-off', false],
  ])('%s: %s', (state, blocked) => {
    expect(isBlocked(state)).toBe(blocked);
  });
});
