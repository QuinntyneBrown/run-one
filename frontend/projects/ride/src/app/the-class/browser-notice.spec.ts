// Unit test
// Traces to: L2-008 AC2, AC4; L2-009 AC1, AC3; L2-018
// Description: which alert The Class shows under its header, one case per support state: Chrome or Edge with Copy
// link for a browser without Web Bluetooth, the secure page with Open over HTTPS on plain http, and none in a browser
// that can reach the bike, with Bluetooth on or off.
import { browserNotice } from './browser-notice';

describe('browserNotice', () => {
  it('sends a browser without Web Bluetooth to Chrome or Edge, with the link to copy (L2-008 AC2)', () => {
    expect(browserNotice('unsupported-browser')).toEqual({
      icon: 'browser',
      title: 'Open Telo Ride 1 in Chrome or Edge.',
      body: 'Bluetooth to the bike only works there — you can look around, but not ride.',
      way: 'copy',
    });
  });

  it('sends a page on plain http to its secure version (L2-009 AC1)', () => {
    expect(browserNotice('insecure-context')).toEqual({
      icon: 'lock',
      title: 'Open the secure version of this page.',
      body: 'Bluetooth is blocked on plain http, so the bike can’t connect.',
      way: 'secure',
    });
  });

  it.each(['ready', 'adapter-off'] as const)('has no alert when the browser is %s', (support) => {
    expect(browserNotice(support)).toBeNull();
  });
});
