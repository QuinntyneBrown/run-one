import { InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type { BleState } from './bike-status';
import type { RememberedBikeRecord } from './remembered-bike';

/** Which protocol the bike speaks: Echelon's own (full control) or FTMS (beta). */
export type BikeKind = 'echelon' | 'ftms';

/** The bike the rider chose: the browser's id for it, the name and identifier the card shows, and its protocol. */
export interface BikeInfo {
  readonly id: string;
  readonly name: string;
  /** "EX5S-141844" for an Echelon; `null` when the device gives nothing beyond its name. */
  readonly identifier: string | null;
  readonly kind: BikeKind;
}

/**
 * The link to the bike (docs/detailed-designs/bike/connect-a-bike). A Web Bluetooth link or, in a development build
 * opened with `?simulate`, the simulated bike (L2-024). Every page and store uses the token, never an implementation.
 */
export interface BikeConnection {
  /** The link state: `connected` from the first notification after initialisation until the bike drops. */
  readonly ble: Signal<BleState>;
  /** The bike chosen or reconnected to, or `null` before one is. */
  readonly bike: Signal<BikeInfo | null>;
  /** The last Web Bluetooth error as `name: message`, rendered as text, never HTML (L2-017 AC5). */
  readonly lastError: Signal<string | null>;
  /** Asks for a bike; `null` when the rider closes the browser's chooser without picking one. */
  requestBike(): Promise<BikeInfo | null>;
  /**
   * Connects to the bike `requestBike` resolved, initialises it, and resolves once its first notification has
   * arrived (L2-013 AC4).
   */
  connect(): Promise<void>;
  /**
   * Connects to a bike this browser paired before, without the chooser, where `navigator.bluetooth.getDevices()`
   * exists, as soon as the bike advertises (L2-015 AC1). Resolves `true` once it is connected, and `false` when the
   * bike cannot be reached that way or the wait for it ends first; it never rejects.
   */
  reconnectRemembered(bike: RememberedBikeRecord): Promise<boolean>;
  /** Every notification the bike sends, as raw bytes, for the frame decoder. */
  readonly frames: Observable<Uint8Array>;
  /** Sends a target resistance; resolves with the time to the bike's acknowledgement, in milliseconds. */
  setResistance(level: number): Promise<number>;
  /** After a drop, cancels the wait for the next retry and tries the bike at once: the **Reconnect** action. */
  reconnectNow(): void;
  /**
   * Forgets the target resistance kept for the next reconnect: the ride that asked for it is over, so a bike that
   * drops and comes back afterwards is sent no resistance command (L2-093 AC3).
   */
  forgetTarget(): void;
  /** Drops the link and stops the notifications. */
  disconnect(): void;
}

export const BIKE_CONNECTION = new InjectionToken<BikeConnection>('BIKE_CONNECTION');
