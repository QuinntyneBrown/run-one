/// <reference types="web-bluetooth" />
import { Injectable, type OnDestroy, inject, signal } from '@angular/core';
import {
  APP_LOGGER,
  BIKE_LINK_TAP,
  type BikeConnection,
  BikeConnectionError,
  type BikeInfo,
  type BikeKind,
  type BikeLinkTap,
  type BleState,
  type RememberedBikeRecord,
  TICKER,
} from '@telo/api';
import { Subject, firstValueFrom } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { FtmsProtocol } from '../protocol/ftms-protocol';
import type { BikeLink } from './bike-link';
import { bikeIdentity } from './bike-identity';
import { EchelonLink } from './echelon-link';
import { FtmsLink, bytesOf } from './ftms-link';
import { ConsoleAppLogger } from '../diagnostics/console-app-logger';
import { describeError } from './describe-error';
import { DeviceReconnector } from './device-reconnector';
import { GattWriteQueue } from './gatt-write-queue';

/** FTMS (0x1826), the standard service the chooser offers beside Echelon's. */
const FTMS = 0x1826;

/** Echelon's bikes advertise a name that begins with this ("ECH-EX5S-141844", "ECHEX-3-141844"). */
const ECHELON_NAME_PREFIX = 'ECH';

/**
 * The link to a real bike over Web Bluetooth, the only code that touches `navigator.bluetooth` (AGENTS.md). It opens
 * the chooser filtered to the Echelon service and FTMS (L2-012), connects through the link the device's services
 * select, and serialises every write through one `GattWriteQueue` (docs/detailed-designs/bike/connect-a-bike).
 */
@Injectable()
export class WebBluetoothBikeConnection implements BikeConnection, OnDestroy {
  private readonly received = new Subject<Uint8Array>();
  /** The tap on the link, bound only while a diagnostic recording is on (L2-178); `null` for every rider. */
  private readonly tap = inject(BIKE_LINK_TAP, { optional: true });
  private readonly queue = new GattWriteQueue(this.tap);
  private readonly ticker = inject(TICKER);
  private readonly reconnector = new DeviceReconnector();
  private readonly logger = inject(APP_LOGGER, { optional: true }) ?? new ConsoleAppLogger();
  private device: BluetoothDevice | null = null;
  private watched: BluetoothDevice | null = null;
  private link: BikeLink | null = null;
  /** The wait for the remembered bike to advertise: what ends it, and what it resolves to (L2-015 AC1). */
  private advertising: {
    readonly abort: AbortController;
    readonly connected: Promise<boolean>;
  } | null = null;
  /** The last target resistance asked for, sent again first after a reconnect (L2-017 AC4). */
  private target: number | null = null;
  private readonly onDisconnected = (): void => this.onDrop();
  private readonly onValue = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;
    const bytes = bytesOf(value);
    // The recording hears the bytes before anything decodes them (L2-178 AC3).
    this.tap?.received(characteristic.uuid, bytes, 'notification', this.chosen()?.kind ?? null);
    this.received.next(bytes);
  };

  private readonly linkState = signal<BleState>('idle');
  private readonly chosen = signal<BikeInfo | null>(null);
  private readonly failure = signal<string | null>(null);

  readonly frames = this.received.asObservable();
  readonly ble = this.linkState.asReadonly();
  readonly bike = this.chosen.asReadonly();
  /** The last Web Bluetooth error as `name: message`, for the screens to render as text (L2-017 AC5). */
  readonly lastError = this.failure.asReadonly();

  /** Opens the browser's chooser; call it only from the rider's click. A closed chooser resolves `null`. */
  async requestBike(): Promise<BikeInfo | null> {
    const options: RequestDeviceOptions = {
      // An Echelon bike may advertise only its own name ("ECHEX-3-141844") and a sibling of the control service
      // (0bf669f0-…), not the one it is controlled through, so a name filter finds it too; the service it is
      // controlled through is asked for as optional so it can be read once connected.
      filters: [
        { services: [EchelonProtocol.service] },
        { services: [FTMS] },
        { namePrefix: ECHELON_NAME_PREFIX },
      ],
      optionalServices: [EchelonProtocol.service, FTMS],
    };
    this.tap?.event(
      'chooser-opened',
      `filters=${JSON.stringify(options.filters)} optional-services=${JSON.stringify(options.optionalServices)}`,
    );
    try {
      this.device = await navigator.bluetooth.requestDevice(options);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        this.tap?.event('chooser-closed');
        return null;
      }
      this.tap?.event('chooser-failed', JSON.stringify(describeError(error)));
      const blocked = error instanceof DOMException && error.name === 'SecurityError';
      throw new BikeConnectionError(blocked ? 'blocked' : 'failed', String(error));
    }
    this.tap?.event(
      'chooser-picked',
      `name=${JSON.stringify(this.device.name ?? null)} id=${JSON.stringify(this.device.id)}`,
    );
    return this.choose(this.info(this.device));
  }

  /**
   * Opens GATT, picks the link by the services the bike offers (the Echelon service first, else FTMS), subscribes,
   * initialises, and resolves on the first notification after that (L2-013, L2-014).
   */
  async connect(): Promise<void> {
    if (!this.device?.gatt) throw new BikeConnectionError('failed', 'No bike was chosen');
    // A bike the rider picks in the chooser ends the wait for the remembered one.
    this.stopWaiting();
    this.watch(this.device);
    this.setBle('connecting');
    try {
      const link = await this.open(this.device.gatt);
      this.setBle('connected');
      link.connected();
    } catch (error) {
      this.report(error);
      this.closeLink();
      this.setBle('idle');
      throw error;
    }
  }

  /** Cancels the wait for the next retry and tries the dropped bike at once (L2-017 AC3). */
  reconnectNow(): void {
    if (this.linkState() === 'disconnected') this.reconnector.retryNow();
  }

  /** One attempt: GATT, the link, its initialisation, and the first notification after it. */
  private async open(gatt: BluetoothRemoteGATTServer): Promise<BikeLink> {
    const server = await gatt.connect();
    const services = await server.getPrimaryServices();
    if (this.tap) await this.describe(services, this.tap);
    const echelon = services.find((service) => service.uuid === EchelonProtocol.service);
    const ftms = services.find((service) => service.uuid === FtmsProtocol.service);
    const service = echelon ?? ftms;
    if (!service)
      throw new BikeConnectionError(
        'failed',
        'The bike offers neither the Echelon service nor FTMS',
      );
    const link: BikeLink = echelon
      ? new EchelonLink(this.queue, this.onValue, this.ticker, (error) => this.onFailure(error))
      : new FtmsLink(this.queue, this.onValue, this.tap);
    this.tap?.event('link', echelon ? 'echelon' : 'ftms');
    // The bike's kind is the link its services selected, not what its name suggested: an Echelon may advertise a
    // name other than `ECH-<model>-<serial>` ("ECHEX-3-141844"), and its frames must still be read as an Echelon's.
    const kind: BikeKind = echelon ? 'echelon' : 'ftms';
    const bike = this.chosen();
    if (bike && bike.kind !== kind) this.choose({ ...bike, kind });
    await link.open(service);
    this.link = link;
    await link.initialise();
    await firstValueFrom(this.frames);
    return link;
  }

  /**
   * A drop (`gattserverdisconnected`, or a write that failed while connected): the link closes, which stops the
   * keepalive, `ble` reads `disconnected`, and the same bike is tried every 3 seconds without the chooser (L2-017).
   */
  private onDrop(error?: unknown): void {
    if (error !== undefined) this.report(error);
    if (this.linkState() !== 'connected') return;
    this.tap?.event('dropped');
    this.closeLink();
    this.setBle('disconnected');
    this.reconnector.start(() => this.attempt());
  }

  /** One retry: on success the last target goes before anything else, the keepalive after it (L2-017 AC4). */
  private async attempt(): Promise<boolean> {
    const gatt = this.device?.gatt;
    if (!gatt) return false;
    this.tap?.event('reconnect-attempt');
    try {
      const link = await this.open(gatt);
      if (this.target !== null)
        await link.setResistance(this.target).catch((error: unknown) => {
          if (!(error instanceof BikeConnectionError)) throw error;
        });
      this.tap?.event('reconnect-ok');
      this.setBle('connected');
      link.connected();
      return true;
    } catch (error) {
      this.report(error);
      this.tap?.event('reconnect-failed');
      this.closeLink();
      return false;
    }
  }

  private watch(device: BluetoothDevice): void {
    if (this.watched === device) return;
    this.watched?.removeEventListener('gattserverdisconnected', this.onDisconnected);
    device.addEventListener('gattserverdisconnected', this.onDisconnected);
    this.watched = device;
  }

  private closeLink(): void {
    this.link?.close();
    this.link = null;
  }

  /**
   * Finds the permitted device by id through `getDevices()` and connects to it as soon as it advertises (L2-015 AC1);
   * `false` where that cannot work. A browser without `watchAdvertisements()` gets one attempt at once. While the
   * bike stays silent the link reads `idle`, so The Class shows no bike (AC2).
   */
  async reconnectRemembered(bike: RememberedBikeRecord): Promise<boolean> {
    if (this.link) return true;
    if (this.advertising) return this.advertising.connected;
    const bluetooth = 'bluetooth' in navigator ? navigator.bluetooth : undefined;
    if (typeof bluetooth?.getDevices !== 'function') return false;
    try {
      const device = (await bluetooth.getDevices()).find((permitted) => permitted.id === bike.id);
      if (!device) return false;
      // The rider paired a bike while the browser was listing its devices: that one stands.
      if (this.link || this.linkState() === 'connecting') return true;
      // Asked twice before the browser answered: the second call joins the first one's wait.
      const waiting = this.waiting();
      if (waiting) return await waiting;
      this.device = device;
      // The identifier and the protocol are read from the device; only its name was kept (AC4).
      this.tap?.event(
        'remembered-bike',
        `name=${JSON.stringify(device.name ?? null)} id=${JSON.stringify(device.id)}`,
      );
      this.choose({ ...this.info(device), name: bike.name });
      if (typeof device.watchAdvertisements !== 'function') {
        await this.connect();
        return true;
      }
      return await this.whenAdvertising(device);
    } catch {
      return false;
    }
  }

  /** Watches the permitted device and connects on its first advertisement; `false` when the wait is ended first. */
  private whenAdvertising(device: BluetoothDevice): Promise<boolean> {
    const abort = new AbortController();
    const { signal } = abort;
    const connected = new Promise<boolean>((resolve) => {
      let reached = false;
      const connect = (): void => {
        if (reached || signal.aborted) return;
        reached = true;
        this.tap?.event('advertising');
        // The bike is here: the browser's watch ends, and the wait with it.
        this.advertising = null;
        abort.abort();
        this.connect().then(
          () => resolve(true),
          () => resolve(false),
        );
      };
      signal.addEventListener('abort', () => !reached && resolve(false), { once: true });
      device.addEventListener('advertisementreceived', connect, { once: true, signal });
      this.tap?.event('watching-advertisements');
      // A browser that cannot watch after all gets the one attempt at once.
      device.watchAdvertisements({ signal }).catch(connect);
    });
    this.advertising = { abort, connected };
    return connected;
  }

  /** The wait under way, read afresh after an `await`. */
  private waiting(): Promise<boolean> | null {
    return this.advertising?.connected ?? null;
  }

  /** Ends the wait for the remembered bike, and the browser's watch with it. */
  private stopWaiting(): void {
    this.advertising?.abort.abort();
    this.advertising = null;
  }

  async setResistance(level: number): Promise<number> {
    this.target = level;
    if (!this.link) throw new BikeConnectionError('failed', 'The bike is not connected');
    try {
      return await this.link.setResistance(level);
    } catch (error) {
      if (!(error instanceof BikeConnectionError)) this.onDrop(error);
      throw error;
    }
  }

  forgetTarget(): void {
    this.target = null;
  }

  disconnect(): void {
    this.stopWaiting();
    this.reconnector.stop();
    this.closeLink();
    this.setBle('idle');
    this.device?.gatt?.disconnect();
  }

  /** A keepalive that failed while connected counts as a drop (L2-017 AC1). */
  private onFailure(error: unknown): void {
    this.onDrop(error);
  }

  /**
   * A Web Bluetooth error's name and message go to `lastError` as text, and to the console with its area (L2-017 AC5,
   * L2-115 AC3).
   */
  private report(error: unknown): void {
    this.failure.set(describeError(error));
    this.logger.error('bluetooth', error);
  }

  /** The one place `ble` changes, so a diagnostic recording hears every state (L2-178 AC6). */
  private setBle(state: BleState): void {
    if (state !== this.linkState()) this.tap?.event('ble', state);
    this.linkState.set(state);
  }

  /** The bike the app took the device for: the name and identifier the card shows, and the kind it is decoded by. */
  private choose(bike: BikeInfo): BikeInfo {
    this.tap?.event(
      'bike',
      `name=${JSON.stringify(bike.name)} identifier=${JSON.stringify(bike.identifier)} kind=${bike.kind}`,
    );
    this.chosen.set(bike);
    return bike;
  }

  /**
   * Tells the tap each service the bike offers with its characteristics and what each can do (L2-178 AC6). It is the
   * one call a diagnostic recording adds to the link (ADR 0048): a rider's app never lists them, and a bike that
   * refuses is recorded and connected as it would have been.
   */
  private async describe(
    services: readonly BluetoothRemoteGATTService[],
    tap: BikeLinkTap,
  ): Promise<void> {
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        const listed = characteristics.map((characteristic) => {
          const can = (['read', 'write', 'writeWithoutResponse', 'notify', 'indicate'] as const)
            .filter((property) => characteristic.properties[property])
            .join(',');
          return can === '' ? characteristic.uuid : `${characteristic.uuid}(${can})`;
        });
        tap.event('service', `${service.uuid} characteristics=${listed.join(',')}`);
      } catch (error) {
        tap.event(
          'service',
          `${service.uuid} characteristics-unknown ${JSON.stringify(describeError(error))}`,
        );
      }
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.watched?.removeEventListener('gattserverdisconnected', this.onDisconnected);
    this.received.complete();
  }

  private info(device: BluetoothDevice): BikeInfo {
    const { name, identifier } = bikeIdentity(device.name, device.id);
    return { id: device.id, name, identifier, kind: identifier ? 'echelon' : 'ftms' };
  }
}
