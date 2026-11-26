// Unit test (the slice's acceptance table: the ride screens that show resistance come with journeys 5, 7 and 21)
// Traces to: L2-025 AC2, AC4; L2-026 AC1; L2-027 AC1, AC4; L2-028 AC1 to AC4
// Description: a plan's level becomes the target resistance, clamped to 1 to 32 and sent, with its acknowledgement
// time kept; the bike's reported resistance stays apart from the target; with the bike away or refusing control the
// controller cannot control it, and the connection keeps the target for the reconnect. A fake connection stands in
// for the bike, and the simulated bike runs the path end to end.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  BikeConnectionError,
  type BikeConnection,
  type BleState,
  MONOTONIC_TIME,
  TICKER,
} from '@telo/api';
import { Subject } from 'rxjs';
import { SimulatedBikeConnection } from '../bluetooth/simulated-bike-connection';
import { BikeTelemetry } from './bike-telemetry';
import { ResistanceController, resistanceControl } from './resistance-controller';
import { RideClock } from './ride-clock';

describe('ResistanceController', () => {
  const ble = signal<BleState>('connected');
  let setResistance: ReturnType<typeof vi.fn<(level: number) => Promise<number>>>;
  let forgetTarget: ReturnType<typeof vi.fn<() => void>>;
  let controller: ResistanceController;

  beforeEach(() => {
    ble.set('connected');
    setResistance = vi.fn(async () => 34);
    forgetTarget = vi.fn();
    const connection: Partial<BikeConnection> = { ble, setResistance, forgetTarget };
    TestBed.configureTestingModule({
      providers: [ResistanceController, { provide: BIKE_CONNECTION, useValue: connection }],
    });
    controller = TestBed.inject(ResistanceController);
  });

  it('sends a plan’s level as the target resistance, and keeps its acknowledgement time (L2-027 AC1, L2-025 AC4)', async () => {
    await controller.applyPlanLevel(12);

    expect(setResistance).toHaveBeenCalledWith(12);
    expect(controller.target()).toBe(12);
    expect(controller.source()).toBe('plan');
    expect(controller.last()).toEqual({ rideTime: null, level: 12, source: 'plan', ackMs: 34 });
  });

  it.each([
    [40, 32],
    [33, 32],
    [0, 1],
    [-3, 1],
    [12.6, 13],
  ])('clamps a target of %d to %d before it is sent (L2-025 AC2)', async (level, sent) => {
    await controller.applyPlanLevel(level);

    expect(setResistance).toHaveBeenCalledWith(sent);
    expect(controller.target()).toBe(sent);
  });

  it('can control a connected bike', () => {
    expect(controller.canControl()).toBe(true);
  });

  it('cannot control a bike that is away, but asks the connection, which keeps the target for the reconnect (L2-027 AC4, L2-028 AC4)', async () => {
    ble.set('disconnected');
    setResistance.mockRejectedValue(new BikeConnectionError('failed', 'The bike is not connected'));

    await controller.applyPlanLevel(10);

    expect(controller.canControl()).toBe(false);
    expect(setResistance).toHaveBeenCalledWith(10);
    expect(controller.target()).toBe(10);
    expect(controller.last()).toBeNull();
  });

  it('stops controlling an FTMS bike once it refuses control (L2-028 AC4)', async () => {
    setResistance.mockRejectedValue(
      new BikeConnectionError('read-only', 'The bike does not give control'),
    );

    await controller.applyPlanLevel(10);

    expect(controller.canControl()).toBe(false);
    expect(controller.last()).toBeNull();
  });

  it('is not set by hand while the bike takes its targets, or is only away (L2-014 AC3)', async () => {
    await controller.applyPlanLevel(10);
    expect(controller.byHand()).toBe(false);

    ble.set('disconnected');
    setResistance.mockRejectedValue(new BikeConnectionError('failed', 'The bike is not connected'));
    await controller.applyPlanLevel(12);

    expect(controller.byHand()).toBe(false);
    expect(forgetTarget).not.toHaveBeenCalled();
  });

  it('once an FTMS bike refuses control it is set by hand: the connection forgets the target and the bike is asked nothing more (L2-014 AC3)', async () => {
    setResistance.mockRejectedValue(
      new BikeConnectionError('read-only', 'The bike does not give control'),
    );

    await controller.applyPlanLevel(10);

    expect(controller.byHand()).toBe(true);
    expect(forgetTarget).toHaveBeenCalledTimes(1);

    // The next segment's level, a nudge, and the level again after a reconnect: the target moves, nothing is sent.
    await controller.applyPlanLevel(19);
    await controller.nudge(1);
    ble.set('disconnected');
    ble.set('connected');
    await controller.applyPlanLevel(19);

    expect(setResistance).toHaveBeenCalledTimes(1);
    expect(controller.target()).toBe(19);
    expect(controller.byHand()).toBe(true);
    expect(controller.canControl()).toBe(false);
  });
});

describe('resistanceControl', () => {
  // Can the app set the bike's resistance (L2-014 AC3, L2-028 AC4)? One case per row.
  const rows: readonly (readonly [BleState, boolean, boolean, boolean])[] = [
    // ble, the bike refused control, the controls work, the rider sets it by hand
    ['connected', false, true, false],
    ['connected', true, false, true],
    ['disconnected', false, false, false],
    ['disconnected', true, false, true],
    ['connecting', false, false, false],
    ['idle', false, false, false],
  ];

  for (const [state, refused, canControl, byHand] of rows)
    it(`a bike that is ${state} and ${refused ? 'refused control' : 'has not refused control'}: ${canControl ? 'takes a target' : 'takes none'}, ${byHand ? 'set by hand' : 'not set by hand'}`, () => {
      expect(resistanceControl(state, refused)).toEqual({ canControl, byHand });
    });
});

describe('ResistanceController on the simulated bike', () => {
  it('the bike follows the target and reports it back as its resistance, kept apart from the target (L2-026 AC1)', async () => {
    const second = new Subject<number>();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ResistanceController,
        BikeTelemetry,
        SimulatedBikeConnection,
        { provide: BIKE_CONNECTION, useExisting: SimulatedBikeConnection },
        { provide: TICKER, useValue: { seconds: second } },
      ],
    });
    const bike = TestBed.inject(SimulatedBikeConnection);
    const telemetry = TestBed.inject(BikeTelemetry);
    const controller = TestBed.inject(ResistanceController);
    await bike.requestBike();
    await bike.connect();

    await controller.applyPlanLevel(14);
    second.next(0);

    expect(telemetry.resistance()).toBe(14);
    expect(controller.target()).toBe(14);
    expect(controller.last()).toEqual({ rideTime: null, level: 14, source: 'plan', ackMs: 0 });
    TestBed.resetTestingModule();
  });
});

describe('ResistanceController by hand', () => {
  const ble = signal<BleState>('connected');
  const reported = signal<number | null>(null);
  let setResistance: ReturnType<typeof vi.fn<(level: number) => Promise<number>>>;
  let controller: ResistanceController;

  beforeEach(() => {
    ble.set('connected');
    reported.set(null);
    setResistance = vi.fn(async () => 30);
    const connection: Partial<BikeConnection> = { ble, setResistance };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ResistanceController,
        { provide: BIKE_CONNECTION, useValue: connection },
        { provide: BikeTelemetry, useValue: { resistance: reported } },
      ],
    });
    controller = TestBed.inject(ResistanceController);
  });

  it('raises and lowers the target by one level and sends it, as the rider’s own (L2-028 AC1)', async () => {
    await controller.applyPlanLevel(12);

    await controller.nudge(1);
    expect(setResistance).toHaveBeenLastCalledWith(13);
    expect(controller.target()).toBe(13);
    expect(controller.source()).toBe('manual');

    await controller.nudge(-1);
    await controller.nudge(-1);
    expect(controller.target()).toBe(11);
    expect(controller.last()).toEqual({ rideTime: null, level: 11, source: 'manual', ackMs: 30 });
  });

  it.each([
    [32, 1, 32],
    [1, -1, 1],
  ] as const)(
    'keeps a target of %d at %d after a nudge of %d, clamped to 1 to 32 (L2-028 AC1)',
    async (level, delta, kept) => {
      await controller.applyPlanLevel(level);

      await controller.nudge(delta);

      expect(controller.target()).toBe(kept);
    },
  );

  it('nudges from the bike’s reported resistance before any target', async () => {
    reported.set(8);

    await controller.nudge(1);

    expect(setResistance).toHaveBeenCalledWith(9);
  });

  it('sets the level the rider picks as the target (L2-028 AC2)', async () => {
    await controller.setManual(20);

    expect(setResistance).toHaveBeenCalledWith(20);
    expect(controller.target()).toBe(20);
    expect(controller.source()).toBe('manual');
  });

  it('applies the plan’s level again when the next segment starts (L2-028 AC3)', async () => {
    await controller.applyPlanLevel(12);
    await controller.setManual(18);

    await controller.applyPlanLevel(10);

    expect(controller.target()).toBe(10);
    expect(controller.source()).toBe('plan');
  });

  it('sends nothing by hand while the bike is away (L2-028 AC4)', async () => {
    await controller.applyPlanLevel(12);
    setResistance.mockClear();
    ble.set('disconnected');

    await controller.nudge(1);
    await controller.setManual(20);

    expect(setResistance).not.toHaveBeenCalled();
    expect(controller.target()).toBe(12);
    expect(controller.source()).toBe('plan');
  });

  it('keeps the last command the bike took at the ride clock’s second', async () => {
    TestBed.resetTestingModule();
    let now = 0;
    TestBed.configureTestingModule({
      providers: [
        ResistanceController,
        RideClock,
        { provide: BIKE_CONNECTION, useValue: { ble, setResistance } },
        { provide: MONOTONIC_TIME, useValue: { now: () => now } },
      ],
    });
    const clock = TestBed.inject(RideClock);
    const logged = TestBed.inject(ResistanceController);
    clock.start();

    await logged.applyPlanLevel(8);
    now = 330_400;
    await logged.setManual(20);

    expect(logged.last()).toEqual({ rideTime: 330, level: 20, source: 'manual', ackMs: 30 });
  });
});
