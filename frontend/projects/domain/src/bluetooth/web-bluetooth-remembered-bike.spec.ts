// Unit test
// Traces to: L2-015 AC1, AC2, AC4
// Description: the connection finds the remembered bike among the devices the browser permits and connects to it
// without the chooser on its first advertisement; until then the link reads idle. Where getDevices() is missing or
// does not hold the bike it gives up at once, a browser without watchAdvertisements() gets one attempt at once, and
// the wait ends when the rider pairs another bike or the connection is closed. A fake device stands in for
// navigator.bluetooth; Vitest's fake clock moves time.
import { TestBed } from '@angular/core/testing';
import { type RememberedBikeRecord, TICKER } from '@telo/api';
import { Subject } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { WebBluetoothBikeConnection } from './web-bluetooth-bike-connection';

const FRAME = [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f];
const REMEMBERED: RememberedBikeRecord = { id: 'bike-1', name: 'Echelon EX-5s' };

/** An Echelon the browser permits: it counts GATT connections, and advertises when told to. */
function permittedEchelon(id: string, name: string, { watches = true } = {}) {
  let connections = 0;
  let watch: AbortSignal | null = null;
  const notify = Object.assign(new EventTarget(), {
    value: null as DataView | null,
    startNotifications: async () => notify,
  });
  const server = {
    connected: false,
    connect: async () => {
      connections += 1;
      server.connected = true;
      return server;
    },
    disconnect: () => (server.connected = false),
    getPrimaryServices: async () => [
      {
        uuid: EchelonProtocol.service,
        getCharacteristic: async (uuid: string) =>
          uuid === EchelonProtocol.notify
            ? notify
            : { writeValueWithResponse: async () => undefined },
      },
    ],
  };
  const device = Object.assign(new EventTarget(), {
    id,
    name,
    gatt: server,
    ...(watches
      ? {
          watchAdvertisements: async ({ signal }: { signal: AbortSignal }) => {
            watch = signal;
          },
        }
      : {}),
  });
  return {
    device,
    connections: () => connections,
    /** Whether the browser is watching for the bike's advertisements now. */
    watched: () => watch !== null && !watch.aborted,
    advertise: () => device.dispatchEvent(new Event('advertisementreceived')),
    frame() {
      notify.value = new DataView(Uint8Array.from(FRAME).buffer);
      notify.dispatchEvent(new Event('characteristicvaluechanged'));
    },
  };
}

describe('WebBluetoothBikeConnection, the remembered bike', () => {
  let connection: WebBluetoothBikeConnection;

  const browser = (bluetooth: object): void => {
    Object.defineProperty(navigator, 'bluetooth', { value: bluetooth, configurable: true });
  };
  /** Lets the initialisation's 300 ms gaps pass, then sends the bike's first frame. */
  const initialiseAndStream = async (bike: ReturnType<typeof permittedEchelon>) => {
    await vi.advanceTimersByTimeAsync(700);
    bike.frame();
    await vi.advanceTimersByTimeAsync(0);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        WebBluetoothBikeConnection,
        { provide: TICKER, useValue: { seconds: new Subject<number>() } },
      ],
    });
    connection = TestBed.inject(WebBluetoothBikeConnection);
  });

  afterEach(() => {
    connection.ngOnDestroy();
    Reflect.deleteProperty(navigator, 'bluetooth');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('gives up at once where the browser has no getDevices() (AC2)', async () => {
    browser({});

    expect(await connection.reconnectRemembered(REMEMBERED)).toBe(false);
    expect(connection.ble()).toBe('idle');
  });

  it('gives up at once where the browser no longer permits the bike (AC2)', async () => {
    const other = permittedEchelon('bike-2', 'ECH-EX3-208731');
    browser({ getDevices: async () => [other.device] });

    expect(await connection.reconnectRemembered(REMEMBERED)).toBe(false);
    expect(other.watched()).toBe(false);
    expect(other.connections()).toBe(0);
  });

  it('waits, reading idle, and connects on the bike’s first advertisement (AC1)', async () => {
    const bike = permittedEchelon('bike-1', 'ECH-EX5S-141844');
    browser({ getDevices: async () => [bike.device] });

    const reconnected = connection.reconnectRemembered(REMEMBERED);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(bike.watched()).toBe(true);
    expect(bike.connections()).toBe(0);
    expect(connection.ble()).toBe('idle');

    bike.advertise();
    await initialiseAndStream(bike);

    expect(await reconnected).toBe(true);
    expect(connection.ble()).toBe('connected');
    expect(bike.connections()).toBe(1);
    // The browser's watch ends with the wait.
    expect(bike.watched()).toBe(false);
  });

  it('names the bike as it was kept, and reads its identifier and protocol from the device (AC4)', async () => {
    const bike = permittedEchelon('bike-1', 'ECH-EX5S-141844');
    browser({ getDevices: async () => [bike.device] });

    void connection.reconnectRemembered(REMEMBERED);
    await vi.advanceTimersByTimeAsync(0);

    expect(connection.bike()).toEqual({
      id: 'bike-1',
      name: 'Echelon EX-5s',
      identifier: 'EX5S-141844',
      kind: 'echelon',
    });
  });

  it('keeps one wait however often it is asked', async () => {
    const bike = permittedEchelon('bike-1', 'ECH-EX5S-141844');
    const getDevices = vi.fn(async () => [bike.device]);
    browser({ getDevices });

    const first = connection.reconnectRemembered(REMEMBERED);
    await vi.advanceTimersByTimeAsync(0);
    const second = connection.reconnectRemembered(REMEMBERED);
    bike.advertise();
    bike.advertise();
    await initialiseAndStream(bike);

    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(getDevices).toHaveBeenCalledTimes(1);
    expect(bike.connections()).toBe(1);
  });

  it('connects at once where the browser has no watchAdvertisements()', async () => {
    const bike = permittedEchelon('bike-1', 'ECH-EX5S-141844', { watches: false });
    browser({ getDevices: async () => [bike.device] });

    const reconnected = connection.reconnectRemembered(REMEMBERED);
    await initialiseAndStream(bike);

    expect(await reconnected).toBe(true);
    expect(connection.ble()).toBe('connected');
  });

  it('ends the wait when the connection is closed', async () => {
    const bike = permittedEchelon('bike-1', 'ECH-EX5S-141844');
    browser({ getDevices: async () => [bike.device] });
    const reconnected = connection.reconnectRemembered(REMEMBERED);
    await vi.advanceTimersByTimeAsync(0);

    connection.disconnect();

    expect(await reconnected).toBe(false);
    expect(bike.watched()).toBe(false);
    bike.advertise();
    await vi.advanceTimersByTimeAsync(700);
    expect(bike.connections()).toBe(0);
  });

  it('ends the wait when the rider pairs another bike, which stays the connected one', async () => {
    const remembered = permittedEchelon('bike-1', 'ECH-EX5S-141844');
    const other = permittedEchelon('bike-2', 'ECH-EX3-208731');
    browser({
      getDevices: async () => [remembered.device],
      requestDevice: async () => other.device,
    });
    const reconnected = connection.reconnectRemembered(REMEMBERED);
    await vi.advanceTimersByTimeAsync(0);

    await connection.requestBike();
    const connected = connection.connect();
    await initialiseAndStream(other);
    await connected;
    remembered.advertise();
    await vi.advanceTimersByTimeAsync(700);

    expect(await reconnected).toBe(false);
    expect(remembered.watched()).toBe(false);
    expect(remembered.connections()).toBe(0);
    expect(connection.bike()?.name).toBe('Echelon EX-3');
    expect(connection.ble()).toBe('connected');
  });
});
