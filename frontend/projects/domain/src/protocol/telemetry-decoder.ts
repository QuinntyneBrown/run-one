import type { BikeKind, TelemetrySample } from '@telo/api';
import { EchelonFrameDecoder } from './echelon-frame-decoder';
import { IndoorBikeDataDecoder } from './indoor-bike-data-decoder';

/** What turns one notification's bytes into a sample, or `null` for a frame it drops. */
export interface TelemetryDecoder {
  decode(bytes: Uint8Array, at: number): TelemetrySample | null;
}

/**
 * The decoder the app reads a bike's telemetry with, by the bike's kind: FTMS Indoor Bike Data for an FTMS bike,
 * Echelon's frames for every other, a bike not yet known included. The readouts and the diagnostic recording both
 * choose through this one function, so a recording names the decoder the readouts really used (L2-178 AC4).
 */
export function telemetryDecoder(kind: BikeKind | null | undefined): TelemetryDecoder {
  return kind === 'ftms' ? IndoorBikeDataDecoder : EchelonFrameDecoder;
}
