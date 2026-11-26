import type { BluetoothSupportState } from '@telo/api';
import { connectAlert } from './connect-alert';
import type { ConnectView } from './connect-bike-store';

// Traces to: L2-008 AC1, AC4; L2-009 AC3, AC4; L2-012 AC3, AC4; L2-018 AC1, AC2
// Which alert stands in for the device card on Connect Bike, one case per row of the requirements.
const bike = {
  id: 'a',
  name: 'Echelon EX-5s',
  identifier: 'EX5S-141844',
  kind: 'echelon',
} as const;
const rest: ConnectView = { kind: 'default' };
const blocked: ConnectView = { kind: 'failed', reason: 'blocked' };

describe('connectAlert', () => {
  it.each<[BluetoothSupportState, ConnectView, string, string, string, string]>([
    [
      'adapter-off',
      rest,
      'bluetooth-off',
      'Bluetooth is off',
      'Turn on Bluetooth on this computer, then try again.',
      'recheck',
    ],
    [
      'unsupported-browser',
      rest,
      'browser',
      "This browser can't reach the bike",
      "Open Telo Ride 1 in Chrome or Edge on a laptop or Android tablet. Safari and Firefox don't support Web Bluetooth yet.",
      'recheck',
    ],
    [
      'insecure-context',
      rest,
      'lock',
      'Open the secure version of this page',
      'Bluetooth is blocked on plain http, so the bike can’t connect.',
      'secure',
    ],
    [
      'ready',
      blocked,
      'blocked',
      'Bluetooth is blocked for this page',
      'Allow Bluetooth for this site in your browser’s settings, then try again.',
      'pair',
    ],
    [
      'ready',
      { kind: 'failed', reason: 'failed' },
      'blocked',
      'The bike list didn’t open',
      'Something went wrong opening your browser’s list of bikes. Try again.',
      'pair',
    ],
    [
      'ready',
      { kind: 'failed', reason: 'read-only' },
      'blocked',
      'The bike list didn’t open',
      'Something went wrong opening your browser’s list of bikes. Try again.',
      'pair',
    ],
  ])('with support %s and view %o, draws the %s alert', (support, view, icon, title, body, way) => {
    expect(connectAlert(support, view)).toEqual({ icon, title, body, way });
  });

  it.each<[string, ConnectView]>([
    ['at rest', rest],
    ['searching', { kind: 'searching' }],
    ['pairing', { kind: 'pairing', bike }],
    ['paired', { kind: 'paired', bike }],
  ])('draws no alert in a browser that can reach the bike, %s', (_, view) => {
    expect(connectAlert('ready', view)).toBeNull();
  });

  it.each<BluetoothSupportState>(['adapter-off', 'unsupported-browser', 'insecure-context'])(
    'says why the browser cannot reach the bike before why the chooser failed, for %s',
    (support) => {
      expect(connectAlert(support, blocked)?.way).not.toBe('pair');
    },
  );

  it('never says that no bike was found while Bluetooth is off', () => {
    const alert = connectAlert('adapter-off', rest);

    expect(`${alert?.title} ${alert?.body}`).not.toMatch(/no bike|found/i);
  });
});
