import { Injectable, type OnDestroy, inject, signal } from '@angular/core';
import {
  BIKE_LINK_TAP,
  type BikeConnection,
  type BikeInfo,
  type BleState,
  TICKER,
} from '@telo/api';
import { Subject, type Subscription } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { SimulatedRiderProfile } from './simulated-rider-profile';

/** The bike the simulator plays: an Echelon EX-5s. */
export const SIMULATED_BIKE: BikeInfo = {
  id: 'EX5S-0bf669f1',
  name: 'Echelon EX-5s',
  identifier: 'EX5S-0bf669f1',
  kind: 'echelon',
};

/**
 * A simulated Echelon EX-5s for development builds opened with `?simulate` (L2-024). It never calls
 * `navigator.bluetooth`: `requestBike()` resolves at once, with no chooser. Once connected it sends a `D1` and a `D2`
 * frame each second of the `TICKER`, encoded by `EchelonProtocol`, through `frames`, exactly as a real bike's
 * notifications arrive; a set-resistance command is parsed back and its level reported by the next `D2`.
 */
@Injectable()
export class SimulatedBikeConnection implements BikeConnection, OnDestroy {
  private readonly ticker = inject(TICKER);
  /** The tap on the link, bound only while a diagnostic recording is on: the simulated bike is recorded as a real one (L2-178 AC18). */
  private readonly tap = inject(BIKE_LINK_TAP, { optional: true });
  private readonly sent = new Subject<Uint8Array>();
  private ticking: Subscription | null = null;
  private elapsed = 0;
  private revolutions = 0;
  private level = 8;
  private readonly link = signal<BleState>('idle');
  private readonly chosen = signal<BikeInfo | null>(null);

  readonly frames = this.sent.asObservable();
  readonly ble = this.link.asReadonly();
  readonly bike = this.chosen.asReadonly();
  readonly lastError = signal<string | null>(null).asReadonly();

  async requestBike(): Promise<BikeInfo> {
    this.chosen.set(SIMULATED_BIKE);
    return SIMULATED_BIKE;
  }

  async connect(): Promise<void> {
    this.chosen.set(SIMULATED_BIKE);
    if (this.link() !== 'connected') {
      this.tap?.event(
        'bike',
        `name=${JSON.stringify(SIMULATED_BIKE.name)} identifier=${JSON.stringify(SIMULATED_BIKE.identifier)} kind=${SIMULATED_BIKE.kind}`,
      );
      this.tap?.event('link', 'simulated');
      this.tap?.event('ble', 'connected');
    }
    this.ticking ??= this.ticker.seconds.subscribe(() => this.tick());
    this.link.set('connected');
  }

  /** The simulated bike is always in reach: reconnecting starts it as `connect()` does. */
  async reconnectRemembered(): Promise<boolean> {
    await this.connect();
    return true;
  }

  /** The simulated bike never drops, so there is nothing to retry. */
  reconnectNow(): void {
    return;
  }

  async setResistance(level: number): Promise<number> {
    const command = EchelonProtocol.setResistance(level);
    // The simulator acknowledges at once, so the write settles as it is asked for.
    this.tap?.writing(EchelonProtocol.write, command, level)();
    const parsed = EchelonProtocol.parseSetResistance(command);
    if (parsed !== null) this.level = parsed;
    return 0; // the simulator acknowledges at once
  }

  /** The simulated bike never drops, so no target is kept for a reconnect. */
  forgetTarget(): void {
    return;
  }

  disconnect(): void {
    this.ticking?.unsubscribe();
    this.ticking = null;
    if (this.link() !== 'idle') this.tap?.event('ble', 'idle');
    this.link.set('idle');
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.sent.complete();
  }

  private tick(): void {
    const cadence = SimulatedRiderProfile.cadenceAt(this.elapsed);
    this.elapsed += 1;
    this.revolutions += cadence / 60;
    this.send(
      EchelonProtocol.workout({
        elapsedSeconds: this.elapsed,
        revolutions: Math.floor(this.revolutions),
        cadence,
      }),
    );
    this.send(EchelonProtocol.resistance(this.level));
  }

  /** One frame, as a real bike's notification arrives: the tap hears it before anything decodes it. */
  private send(frame: Uint8Array): void {
    this.tap?.received(EchelonProtocol.notify, frame, 'notification', SIMULATED_BIKE.kind);
    this.sent.next(frame);
  }
}
