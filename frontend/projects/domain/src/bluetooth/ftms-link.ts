/// <reference types="web-bluetooth" />
import { type BikeLinkTap, BikeConnectionError } from '@telo/api';
import { FtmsProtocol, type ResistanceRange } from '../protocol/ftms-protocol';
import type { BikeLink } from './bike-link';
import type { GattWriteQueue } from './gatt-write-queue';

/** How long a bike has to answer Request Control before it counts as refusing it. */
export const CONTROL_TIMEOUT_MS = 3000;

/** Whether Telo Ride may set the bike's resistance: unknown until the first target asks for control. */
export type BikeControl = 'unknown' | 'full' | 'read-only';

/**
 * The link to an FTMS bike (L2-014). It subscribes to Indoor Bike Data and to control point indications and reads
 * the supported resistance range. The first target resistance writes Request Control; only a Success response lets
 * Set Target Resistance Level through. A refusal, no answer, or a bike with no control point or range is read only:
 * telemetry goes on, and every target is refused with code `read-only`.
 */
export class FtmsLink implements BikeLink {
  private data: BluetoothRemoteGATTCharacteristic | null = null;
  private controlPoint: BluetoothRemoteGATTCharacteristic | null = null;
  private range: ResistanceRange | null = null;
  private state: BikeControl = 'unknown';
  private awaiting: ((success: boolean) => void) | null = null;
  private readonly onResponse = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (value) this.tap?.received(characteristic.uuid, bytesOf(value), 'indication', null);
    const response = value ? FtmsProtocol.decodeControlPointResponse(value) : null;
    if (response?.requestOpCode === FtmsProtocol.requestControl()[0])
      this.awaiting?.(response.success);
  };

  constructor(
    private readonly queue: GattWriteQueue,
    private readonly onValue: (event: Event) => void,
    /** The tap on the link, bound only while a diagnostic recording is on (L2-178). */
    private readonly tap: BikeLinkTap | null = null,
  ) {}

  get control(): BikeControl {
    return this.state;
  }

  async open(service: BluetoothRemoteGATTService): Promise<void> {
    this.data = await service.getCharacteristic(FtmsProtocol.indoorBikeData);
    this.data.addEventListener('characteristicvaluechanged', this.onValue);
    await this.data.startNotifications();
    try {
      this.controlPoint = await service.getCharacteristic(FtmsProtocol.controlPoint);
      this.controlPoint.addEventListener('characteristicvaluechanged', this.onResponse);
      await this.controlPoint.startNotifications();
      const range = await service.getCharacteristic(FtmsProtocol.resistanceRange);
      const read = await range.readValue();
      this.tap?.received(range.uuid, bytesOf(read), 'read', null);
      this.range = FtmsProtocol.decodeResistanceRange(read);
    } catch {
      this.state = 'read-only';
    }
  }

  /** An FTMS bike needs no initialisation writes; control is asked for with the first target. */
  async initialise(): Promise<void> {
    return;
  }

  /** An FTMS bike needs no keepalive. */
  connected(): void {
    return;
  }

  async setResistance(level: number): Promise<number> {
    if (this.state === 'unknown') this.state = (await this.requestControl()) ? 'full' : 'read-only';
    const controlPoint = this.controlPoint;
    if (this.state !== 'full' || !controlPoint || !this.range)
      throw new BikeConnectionError(
        'read-only',
        'The bike does not give control of its resistance',
      );
    const raw = FtmsProtocol.mapLevel(level, this.range);
    return this.write(controlPoint, FtmsProtocol.setTargetResistanceLevel(raw), level);
  }

  close(): void {
    this.data?.removeEventListener('characteristicvaluechanged', this.onValue);
    this.controlPoint?.removeEventListener('characteristicvaluechanged', this.onResponse);
    this.awaiting?.(false);
    this.data = null;
    this.controlPoint = null;
  }

  private async requestControl(): Promise<boolean> {
    const controlPoint = this.controlPoint;
    if (!controlPoint || !this.range) return false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const answered = new Promise<boolean>((resolve) => {
      this.awaiting = resolve;
      timer = setTimeout(() => resolve(false), CONTROL_TIMEOUT_MS);
    });
    try {
      await this.write(controlPoint, FtmsProtocol.requestControl());
      return await answered;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
      this.awaiting = null;
    }
  }

  /** One control point command through the queue; `targetResistance` is the level a resistance command asks for. */
  private write(
    controlPoint: BluetoothRemoteGATTCharacteristic,
    bytes: Uint8Array<ArrayBuffer>,
    targetResistance?: number,
  ): Promise<number> {
    return this.queue.enqueue(() => controlPoint.writeValueWithResponse(bytes), 0, {
      to: controlPoint.uuid,
      bytes,
      targetResistance,
    });
  }
}

/** A notification's bytes, copied out of its `DataView`. */
export function bytesOf(value: DataView): Uint8Array {
  return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
}
