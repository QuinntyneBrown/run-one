/// <reference types="web-bluetooth" />
/** One bike protocol over an open GATT service: Echelon's own or FTMS (docs/detailed-designs/bike/connect-a-bike). */
export interface BikeLink {
  /** Subscribes to the bike's notifications; nothing is written before this resolves. */
  open(service: BluetoothRemoteGATTService): Promise<void>;
  /** The writes the bike needs before it streams. */
  initialise(): Promise<void>;
  /** Called once the first notification after initialisation has arrived: the bike is connected. */
  connected(): void;
  /** Sends a target resistance of 1 to 32, resolving with the acknowledgement time in milliseconds. */
  setResistance(level: number): Promise<number>;
  /** Removes every listener the link added. */
  close(): void;
}
