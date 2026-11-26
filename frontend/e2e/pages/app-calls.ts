import type { Page } from '@playwright/test';

/**
 * Makes, in the page, the browser calls the app will make once its Bluetooth and API clients exist
 * (slices 2.3 and 9.1). It lets the harness spec prove the fakes from the outside before the app uses them.
 */
export class AppCalls {
  constructor(private readonly page: Page) {}

  /** Chooses the bike offering `service`, connects, and subscribes to `notify`; `write` is kept for `write()`. */
  async pairBike(service: string, write: string, notify: string): Promise<void> {
    await this.page.evaluate(
      async ({ service, write, notify }) => {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [service] }],
        });
        const server = await device.gatt!.connect();
        const gatt = await server.getPrimaryService(service);
        const updates = await gatt.getCharacteristic(notify);
        const page = window as unknown as {
          heard: string[];
          writer: BluetoothRemoteGATTCharacteristic;
        };
        page.heard = [];
        updates.addEventListener('characteristicvaluechanged', () => {
          const bytes = new Uint8Array(updates.value!.buffer);
          page.heard.push(
            Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
          );
        });
        await updates.startNotifications();
        page.writer = await gatt.getCharacteristic(write);
      },
      { service, write, notify },
    );
  }

  /** Writes `hex` ("F0 A1 00 91") with response to the characteristic `pairBike` kept. */
  async write(hex: string): Promise<void> {
    await this.page.evaluate(async (hex) => {
      const bytes = Uint8Array.from(hex.split(' '), (b) => parseInt(b, 16));
      await (
        window as unknown as { writer: BluetoothRemoteGATTCharacteristic }
      ).writer.writeValueWithResponse(bytes);
    }, hex);
  }

  /** Every notification the page has heard since pairing, as hex. */
  heard(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { heard: string[] }).heard);
  }

  /** Asks for a bike without catching the refusal, as a careless app would. */
  async requestAnyBike(): Promise<void> {
    await this.page.evaluate(() =>
      navigator.bluetooth.requestDevice({ acceptAllDevices: true }).catch(() => undefined),
    );
  }

  /** Sends `method path` with credentials, as the app's HTTP client will, and returns the status and JSON body. */
  request(method: string, path: string): Promise<{ status: number; body: unknown }> {
    return this.page.evaluate(
      async ({ method, path }) => {
        const response = await fetch(path, { method, credentials: 'include' });
        return {
          status: response.status,
          body: response.status === 204 ? null : await response.json(),
        };
      },
      { method, path },
    );
  }
}
