import type { BikeStatusView, BleState } from '@telo/api';

/** The bike status the header shows, from the link state and the bike's name (L2-019). */
export function bikeStatus(ble: BleState, bikeName: string | null): BikeStatusView {
  const connected = ble === 'connected';
  return {
    label: bikeName ?? 'Bike',
    hiddenText: connected ? ' connected' : ' not connected',
    title: connected ? null : 'Bike not connected',
    tone: connected ? 'ok' : 'alert',
  };
}
