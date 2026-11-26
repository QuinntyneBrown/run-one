import { InjectionToken } from '@angular/core';
import type { BikeKind } from '../bike/bike-connection';

/** How bytes came from the bike: sent by it, sent in answer to a command, or read by the app. */
export type ReceivedHow = 'notification' | 'indication' | 'read';

/** Called once when a write settles: with nothing when the bike acknowledged it, with the error when it failed. */
export type WriteSettled = (error?: unknown) => void;

/**
 * The tap on the Bluetooth link (L2-178, ADR 0048): everything that moves bytes to or from a bike tells it, so a
 * diagnostic recording can hold them. It is bound only when the app is opened with `?diagnose`; every caller injects
 * it as optional and calls it behind `?.`, so a rider's app pays one `null` check and holds no recording code.
 */
export interface BikeLinkTap {
  /**
   * Bytes from the bike, before anything decodes them. `bike` is the kind the app decodes this bike's telemetry by,
   * for a notification the readouts are read from; `null` for bytes that are no telemetry.
   */
  received(from: string, bytes: Uint8Array, how: ReceivedHow, bike: BikeKind | null): void;
  /**
   * Bytes about to be written to the bike, with the target resistance a resistance command asks for. The function it
   * returns is called when the write settles.
   */
  writing(to: string, bytes: Uint8Array, targetResistance?: number): WriteSettled;
  /** Something the link did that is no byte: the chooser, a service found, a `ble` state, a drop, a reconnect. */
  event(name: string, detail?: string): void;
}

export const BIKE_LINK_TAP = new InjectionToken<BikeLinkTap>('BIKE_LINK_TAP');
