import { Injectable, computed, inject, signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  BikeConnectionError,
  type BleState,
  type ResistanceSource,
  type SentCommand,
} from '@telo/api';
import { MAX_RESISTANCE, MIN_RESISTANCE } from '../protocol/echelon-protocol';
import { BikeTelemetry } from './bike-telemetry';
import { RideClock } from './ride-clock';

const clamp = (level: number): number =>
  Math.min(MAX_RESISTANCE, Math.max(MIN_RESISTANCE, Math.round(level)));

/** Whether Telo Ride 1 can set the bike's resistance, and whether the rider has to. */
export interface ResistanceControl {
  /** The resistance controls work: a target can be sent now. */
  readonly canControl: boolean;
  /** The rider sets the resistance on the bike by hand, for the rest of the ride (L2-014 AC3). */
  readonly byHand: boolean;
}

/**
 * Can the app set the bike's resistance (L2-014 AC3, L2-028 AC4)? Only a connected bike that has not refused control
 * takes a target. A bike that refused (an FTMS control point that answered anything but Success, did not answer, or is
 * not there) is set by hand from then on, connected or not; a bike that is only away is not.
 */
export function resistanceControl(ble: BleState, refused: boolean): ResistanceControl {
  return { canControl: ble === 'connected' && !refused, byHand: refused };
}

/**
 * The target resistance (docs/detailed-designs/bike/control-resistance): a plan's level, clamped to 1 to 32 and sent
 * through the connection (L2-025 AC2, L2-027 AC1), with the last command and its acknowledgement time (L2-025 AC4).
 * The target stays the plan's level whatever resistance the bike reports (L2-026 AC1). With the bike away the
 * connection keeps the target and sends it first after the reconnect (L2-027 AC4); with the bike away, or once an
 * FTMS bike refuses control, `canControl` is false (L2-028 AC4). Once a bike has refused, `byHand` is true, the
 * connection forgets the target and nothing more is asked of the bike, so no resistance command follows, at the next
 * segment or after a reconnect (L2-014 AC3). The last command carries the ride clock's whole second when the screen has one. Provided by each ride
 * screen.
 */
@Injectable()
export class ResistanceController {
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly telemetry = inject(BikeTelemetry, { optional: true });
  private readonly level = signal<number | null>(null);
  private readonly from = signal<ResistanceSource>('plan');
  private readonly refused = signal(false);
  private readonly sent = signal<SentCommand | null>(null);
  private readonly clock = inject(RideClock, { optional: true });

  readonly target = this.level.asReadonly();
  readonly source = this.from.asReadonly();
  private readonly control = computed(() =>
    resistanceControl(this.connection.ble(), this.refused()),
  );
  readonly canControl = computed(() => this.control().canControl);
  /** Whether the bike refused control, so the rider sets its resistance by hand (L2-014 AC3). */
  readonly byHand = computed(() => this.control().byHand);
  readonly last = this.sent.asReadonly();

  applyPlanLevel(level: number): Promise<void> {
    return this.send(level, 'plan');
  }

  /**
   * "Raise resistance" or "Lower resistance": one level from the target, or from the bike's reported resistance before
   * any target, clamped and sent as the rider's own (L2-028 AC1). Nothing is sent while it cannot control the bike
   * (AC4); the next segment's plan level replaces it (AC3).
   */
  nudge(delta: 1 | -1): Promise<void> {
    const from = this.level() ?? this.telemetry?.resistance() ?? MIN_RESISTANCE;
    return this.setManual(from + delta);
  }

  /** A "Level N" bar: N becomes the target, as the rider's own (L2-028 AC2). */
  async setManual(level: number): Promise<void> {
    if (!this.canControl()) return;
    await this.send(level, 'manual');
  }

  private async send(level: number, source: ResistanceSource): Promise<void> {
    const target = clamp(level);
    this.level.set(target);
    this.from.set(source);
    // A bike that refused control is asked nothing more (L2-014 AC3).
    if (this.refused()) return;
    const rideTime = this.clock === null ? null : Math.floor(this.clock.elapsedMs() / 1000);
    try {
      const ackMs = await this.connection.setResistance(target);
      const command: SentCommand = { rideTime, level: target, source, ackMs };
      this.sent.set(command);
    } catch (error) {
      if (error instanceof BikeConnectionError && error.code === 'read-only') {
        this.refused.set(true);
        // The connection kept the target for the next reconnect; a bike set by hand is sent none.
        this.connection.forgetTarget();
      }
    }
  }
}
