/// <reference types="web-bluetooth" />
import { EchelonProtocol } from '../protocol/echelon-protocol';
import type { Ticker } from '@telo/api';
import type { BikeLink } from './bike-link';
import type { GattWriteQueue } from './gatt-write-queue';
import { KeepaliveScheduler } from './keepalive-scheduler';

/**
 * The link to an Echelon bike (L2-013): it subscribes to the notify characteristic before writing anything, then
 * writes the three initialisation commands in order, each with response and at least 300 ms after the one before.
 */
export class EchelonLink implements BikeLink {
  private notifications: BluetoothRemoteGATTCharacteristic | null = null;
  private writer: BluetoothRemoteGATTCharacteristic | null = null;

  private readonly keepalive: KeepaliveScheduler;

  constructor(
    private readonly queue: GattWriteQueue,
    private readonly onValue: (event: Event) => void,
    ticker: Ticker,
    onFailure: (error: unknown) => void,
  ) {
    this.keepalive = new KeepaliveScheduler(
      ticker,
      () => this.write(EchelonProtocol.keepalive()),
      onFailure,
    );
  }

  async open(service: BluetoothRemoteGATTService): Promise<void> {
    this.notifications = await service.getCharacteristic(EchelonProtocol.notify);
    this.notifications.addEventListener('characteristicvaluechanged', this.onValue);
    await this.notifications.startNotifications();
    this.writer = await service.getCharacteristic(EchelonProtocol.write);
  }

  async initialise(): Promise<void> {
    const [first, ...rest] = EchelonProtocol.initCommands();
    await this.write(first);
    for (const command of rest) await this.write(command, EchelonProtocol.initGapMs);
  }

  /** The keepalive starts once the bike is connected and initialised (L2-016 AC1). */
  connected(): void {
    this.keepalive.start();
  }

  setResistance(level: number): Promise<number> {
    return this.write(EchelonProtocol.setResistance(level), 0, level);
  }

  close(): void {
    this.keepalive.stop();
    this.notifications?.removeEventListener('characteristicvaluechanged', this.onValue);
    this.notifications = null;
    this.writer = null;
  }

  /** `targetResistance` is the level a resistance command asks for, for the tap on the link (L2-178 AC5). */
  private write(
    bytes: Uint8Array<ArrayBuffer>,
    gapMs = 0,
    targetResistance?: number,
  ): Promise<number> {
    const writer = this.writer;
    if (!writer) return Promise.reject(new Error('The bike is not connected'));
    return this.queue.enqueue(() => writer.writeValueWithResponse(bytes), gapMs, {
      to: writer.uuid,
      bytes,
      targetResistance,
    });
  }
}
