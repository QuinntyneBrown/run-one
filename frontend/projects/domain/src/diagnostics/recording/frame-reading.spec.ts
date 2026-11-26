// Unit test
// Traces to: L2-178 AC4; L2-020; L2-021
// Description: what the recording says the decoder made of a notification, one frame a row, for both decoders. The
// last table holds the reading to the decoders themselves: it says "dropped" exactly when the real decoder returns
// nothing, and the values it gives are the real decoder's.
import type { BikeKind } from '@telo/api';
import { FtmsProtocol } from '../../protocol/ftms-protocol';
import { telemetryDecoder } from '../../protocol/telemetry-decoder';
import { readAnswer, readFrame } from './frame-reading';

const bytes = (hex: string): Uint8Array =>
  Uint8Array.from(hex === '' ? [] : hex.split(' ').map((byte) => parseInt(byte, 16)));

describe('readFrame', () => {
  it.each([
    // L2-178 AC4's two frames (L2-020 AC1, AC2).
    ['F0 D2 01 0C CF', 'EchelonFrameDecoder D2 resistance=12 checksum=ok'],
    ['F0 D1 09 00 05 00 00 00 00 00 50 00 1F', 'EchelonFrameDecoder D1 cadence=80 checksum=ok'],
    // What the decoder drops (L2-020 AC3, AC4).
    ['', 'EchelonFrameDecoder dropped: shorter than 4 bytes'],
    ['F0 D1 02', 'EchelonFrameDecoder dropped: shorter than 4 bytes'],
    ['0F D1 01 5A 3B', 'EchelonFrameDecoder dropped: byte 0 is not F0'],
    ['F0 D1 02 00 5A 1D', 'EchelonFrameDecoder D1 dropped: D1 shorter than 13 bytes checksum=ok'],
    ['F0 D0 01 00 C1', 'EchelonFrameDecoder D0 dropped: D0 is not read checksum=ok'],
    ['F0 E7 01 00 D8', 'EchelonFrameDecoder E7 dropped: unknown frame type checksum=ok'],
    // The decoder does not check a checksum; the recording says when one is wrong.
    ['F0 D2 01 0C 00', 'EchelonFrameDecoder D2 resistance=12 checksum=bad'],
  ])('an Echelon reads %j as %s', (frame, reading) => {
    expect(readFrame(bytes(frame), 'echelon')).toBe(reading);
    // A bike whose kind is not known yet is decoded as an Echelon, as the readouts decode it.
    expect(readFrame(bytes(frame), null)).toBe(reading);
  });

  it.each([
    // Speed 20.00 km/h and cadence 80 rpm.
    [
      '04 00 D0 07 A0 00',
      'IndoorBikeDataDecoder IndoorBikeData flags=0x0004 cadence=80 speed=20.00',
    ],
    // Speed, cadence 91 rpm and power 233 W.
    [
      '44 00 D0 07 B6 00 E9 00',
      'IndoorBikeDataDecoder IndoorBikeData flags=0x0044 cadence=91 power=233 speed=20.00',
    ],
    // More Data set, and nothing the app reads.
    ['01 00', 'IndoorBikeDataDecoder IndoorBikeData flags=0x0001 no cadence, resistance or power'],
    ['44', 'IndoorBikeDataDecoder dropped: shorter than 2 bytes'],
  ])('an FTMS bike reads %j as %s', (frame, reading) => {
    expect(readFrame(bytes(frame), 'ftms')).toBe(reading);
  });

  it('names the decoder by the bike’s kind, whatever the bytes are', () => {
    // An Echelon frame from a bike the app takes for FTMS is read by the FTMS decoder, and the recording shows it.
    expect(readFrame(bytes('F0 D2 01 0C CF'), 'ftms')).toMatch(/^IndoorBikeDataDecoder /);
  });

  it.each<[BikeKind, string]>([
    ['echelon', ''],
    ['echelon', 'F0'],
    ['echelon', 'F0 D1 02'],
    ['echelon', '0F D1 01 5A 3B'],
    ['echelon', 'F0 D1 02 00 5A 1D'],
    ['echelon', 'F0 D0 01 00 C1'],
    ['echelon', 'F0 E7 01 00 D8'],
    ['echelon', 'F0 D2 01 0C CF'],
    ['echelon', 'F0 D1 09 00 05 00 00 00 00 00 50 00 1F'],
    ['echelon', 'F0 D1 09 00 05 00 00 00 00 00 50 00 1F 00 00'],
    ['ftms', ''],
    ['ftms', '44'],
    ['ftms', '01 00'],
    ['ftms', '04 00 D0 07 A0 00'],
    ['ftms', '44 00 D0 07'],
    ['ftms', 'F0 D2 01 0C CF'],
  ])('says "dropped" for %s %j exactly when the decoder returns nothing', (kind, frame) => {
    const sample = telemetryDecoder(kind).decode(bytes(frame), 0);

    const reading = readFrame(bytes(frame), kind);

    expect(reading.includes('dropped: ')).toBe(sample === null);
    if (sample?.cadence !== undefined) expect(reading).toContain(`cadence=${sample.cadence}`);
    if (sample?.resistance !== undefined)
      expect(reading).toContain(`resistance=${sample.resistance}`);
    if (sample?.powerW !== undefined) expect(reading).toContain(`power=${sample.powerW}`);
  });
});

describe('readAnswer', () => {
  it.each([
    [FtmsProtocol.controlPoint, '80 00 01', 'FtmsControlPoint response to=0x00 success'],
    [
      FtmsProtocol.controlPoint,
      '80 00 05',
      'FtmsControlPoint response to=0x00 refused result=0x05',
    ],
    [FtmsProtocol.controlPoint, '80 04 01', 'FtmsControlPoint response to=0x04 success'],
    [FtmsProtocol.controlPoint, '01', 'FtmsControlPoint dropped: not a response'],
    [
      FtmsProtocol.resistanceRange,
      '0A 00 E8 03 0A 00',
      'FtmsResistanceRange minimum=10 maximum=1000 increment=10',
    ],
    [FtmsProtocol.resistanceRange, '0A 00', 'FtmsResistanceRange dropped: shorter than 6 bytes'],
  ])('%s %j: %s', (characteristic, answer, reading) => {
    expect(readAnswer(characteristic, bytes(answer))).toBe(reading);
  });

  it('reads nothing from a characteristic the app decodes nothing from', () => {
    expect(readAnswer(FtmsProtocol.indoorBikeData, bytes('00 00'))).toBeNull();
  });
});
