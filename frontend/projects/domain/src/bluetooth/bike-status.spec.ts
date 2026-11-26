// Unit test
// Traces to: L2-019
// Description: the bike status for every link state, one case per row: the header's label, hidden text, title and
// tone.
import type { BleState } from '@telo/api';
import { bikeStatus } from './bike-status';

const BIKE = 'Echelon EX-5s';

describe('bikeStatus', () => {
  it.each<[BleState, string | null, string, string, string | null]>([
    ['connected', BIKE, BIKE, ' connected', null],
    ['disconnected', BIKE, BIKE, ' not connected', 'Bike not connected'],
    ['connecting', BIKE, BIKE, ' not connected', 'Bike not connected'],
    ['idle', BIKE, BIKE, ' not connected', 'Bike not connected'],
    ['idle', null, 'Bike', ' not connected', 'Bike not connected'],
    ['disconnected', null, 'Bike', ' not connected', 'Bike not connected'],
  ])('%s, %s: "%s%s", %s', (ble, name, label, hiddenText, title) => {
    expect(bikeStatus(ble, name)).toEqual({
      label,
      hiddenText,
      title,
      tone: ble === 'connected' ? 'ok' : 'alert',
    });
  });
});
