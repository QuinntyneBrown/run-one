import type { BikeKind, TelemetrySample } from '@telo/api';
import { FtmsProtocol } from '../../protocol/ftms-protocol';
import { IndoorBikeDataDecoder } from '../../protocol/indoor-bike-data-decoder';
import { telemetryDecoder } from '../../protocol/telemetry-decoder';

/** What a frame is, as far as its bytes say: its name, why the decoder drops it, and whether its checksum holds. */
interface FrameFacts {
  readonly name: string | null;
  /** Why the decoder reads nothing from it; `null` for a frame it reads. */
  readonly dropped: string | null;
  readonly checksum: 'ok' | 'bad' | null;
}

const hexByte = (byte: number): string => byte.toString(16).toUpperCase().padStart(2, '0');

/**
 * An Echelon frame's name and the reason `EchelonFrameDecoder` drops it (L2-020 AC3, AC4;
 * docs/protocol/echelon-ble-frames.md). The decoder does not check an incoming checksum; the recording says whether
 * it holds, since a frame with a bad one is often the one that matters.
 */
function echelonFacts(bytes: Uint8Array): FrameFacts {
  if (bytes.length < 4) return { name: null, dropped: 'shorter than 4 bytes', checksum: null };
  if (bytes[0] !== 0xf0) return { name: null, dropped: 'byte 0 is not F0', checksum: null };
  const sum = bytes.subarray(0, bytes.length - 1).reduce((total, byte) => total + byte, 0) % 256;
  const checksum = sum === bytes[bytes.length - 1] ? 'ok' : 'bad';
  const name = hexByte(bytes[1]);
  if (name === 'D2') return { name, dropped: null, checksum };
  if (name === 'D1')
    return { name, dropped: bytes.length < 13 ? 'D1 shorter than 13 bytes' : null, checksum };
  return { name, dropped: name === 'D0' ? 'D0 is not read' : 'unknown frame type', checksum };
}

/** An Indoor Bike Data notification's name with its flags, and the reason `IndoorBikeDataDecoder` drops it. */
function indoorBikeFacts(bytes: Uint8Array): FrameFacts {
  if (bytes.length < 2) return { name: null, dropped: 'shorter than 2 bytes', checksum: null };
  const flags = bytes[0] | (bytes[1] << 8);
  return {
    name: `IndoorBikeData flags=0x${flags.toString(16).toUpperCase().padStart(4, '0')}`,
    dropped: null,
    checksum: null,
  };
}

/** The values a sample carries, in the recording's words; cadence, resistance and power first. */
function values(sample: TelemetrySample): string {
  const parts = [
    sample.cadence === undefined ? null : `cadence=${sample.cadence}`,
    sample.resistance === undefined ? null : `resistance=${sample.resistance}`,
    sample.powerW === undefined ? null : `power=${sample.powerW}`,
    sample.speedKmh === undefined ? null : `speed=${sample.speedKmh.toFixed(2)}`,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(' ') : 'no cadence, resistance or power';
}

/**
 * What the app's decoder makes of one telemetry notification, for the entry that holds its bytes (L2-178 AC4): the
 * decoder the app uses for a bike of this kind, the frame it recognised, and the cadence, resistance and power it
 * produced, or "dropped" with the reason. The sample is the real decoder's own, chosen by `telemetryDecoder` as the
 * readouts choose it; only the frame's name and the reason are worked out here.
 */
export function readFrame(bytes: Uint8Array, kind: BikeKind | null): string {
  const decoder = telemetryDecoder(kind);
  const ftms = decoder === IndoorBikeDataDecoder;
  const facts = ftms ? indoorBikeFacts(bytes) : echelonFacts(bytes);
  const sample = decoder.decode(bytes, 0);
  return [
    ftms ? 'IndoorBikeDataDecoder' : 'EchelonFrameDecoder',
    facts.name,
    sample ? values(sample) : `dropped: ${facts.dropped ?? 'not read'}`,
    facts.checksum === null ? null : `checksum=${facts.checksum}`,
  ]
    .filter((part) => part !== null)
    .join(' ');
}

/**
 * What the app makes of bytes from an FTMS bike that are no telemetry (L2-014): a control point's answer, or the
 * resistance range it read. `null` for a characteristic the app decodes nothing from.
 */
export function readAnswer(characteristic: string, bytes: Uint8Array): string | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (characteristic === FtmsProtocol.controlPoint) {
    const response = FtmsProtocol.decodeControlPointResponse(view);
    if (!response) return 'FtmsControlPoint dropped: not a response';
    return `FtmsControlPoint response to=0x${hexByte(response.requestOpCode)} ${response.success ? 'success' : `refused result=0x${hexByte(bytes[2])}`}`;
  }
  if (characteristic === FtmsProtocol.resistanceRange) {
    if (bytes.length < 6) return 'FtmsResistanceRange dropped: shorter than 6 bytes';
    const range = FtmsProtocol.decodeResistanceRange(view);
    return `FtmsResistanceRange minimum=${range.minimum} maximum=${range.maximum} increment=${range.increment}`;
  }
  return null;
}
