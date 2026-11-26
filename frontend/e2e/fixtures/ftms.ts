import type { FakeBike } from './fake-bluetooth';

// The Fitness Machine Service as a browser names it: 16-bit SIG UUIDs in their full 128-bit form.
const sig = (short: number) =>
  `0000${short.toString(16).padStart(4, '0')}-0000-1000-8000-00805f9b34fb`;
export const FTMS_SERVICE = sig(0x1826);
export const INDOOR_BIKE_DATA = sig(0x2ad2);
export const CONTROL_POINT = sig(0x2ad9);
export const RESISTANCE_RANGE = sig(0x2ad6);

/** An FTMS smart bike from another maker, with a resistance range of 1.0 to 100.0 in steps of 1.0. */
export const ftmsBike: FakeBike = {
  name: 'KICKR BIKE 1A2B',
  services: { [FTMS_SERVICE]: [INDOOR_BIKE_DATA, CONTROL_POINT, RESISTANCE_RANGE] },
  values: { [RESISTANCE_RANGE]: [0x0a, 0x00, 0xe8, 0x03, 0x0a, 0x00] },
  properties: {
    [INDOOR_BIKE_DATA]: ['notify'],
    [CONTROL_POINT]: ['write', 'indicate'],
    [RESISTANCE_RANGE]: ['read'],
  },
};

/** An FTMS bike with no control point and no range: it reports, and nothing can be asked of it (L2-014 AC3). */
export const ftmsBikeWithoutControl: FakeBike = {
  name: 'SPIN BIKE 7C',
  services: { [FTMS_SERVICE]: [INDOOR_BIKE_DATA] },
};

/** Request Control (op code `0x00`), as the fake records the write. */
export const REQUEST_CONTROL = '00';
/** The control point's answers to Request Control: Success, and Control Not Permitted (result code `0x05`). */
export const CONTROL_GRANTED = [0x80, 0x00, 0x01];
export const CONTROL_NOT_PERMITTED = [0x80, 0x00, 0x05];

/** What the page wrote to the control point, in order: Request Control and every Set Target Resistance Level. */
export const controlPointWrites = (
  writes: readonly { characteristic: string; hex: string }[],
): string[] =>
  writes.filter((write) => write.characteristic === CONTROL_POINT).map((write) => write.hex);

/** An Indoor Bike Data frame: speed 20.00 km/h, cadence 80 rpm (flags 0x0004). */
export const INDOOR_BIKE_FRAME = [0x04, 0x00, 0xd0, 0x07, 0xa0, 0x00];

/**
 * An Indoor Bike Data frame from a bike that reports its power: speed 20.00 km/h, `cadence` rpm and `power` W (flags
 * 0x0044). It reports no resistance level.
 */
export const indoorBikeFrame = (cadence: number, power: number): number[] => [
  0x44,
  0x00,
  0xd0,
  0x07,
  (cadence * 2) & 0xff,
  (cadence * 2) >> 8,
  power & 0xff,
  power >> 8,
];
