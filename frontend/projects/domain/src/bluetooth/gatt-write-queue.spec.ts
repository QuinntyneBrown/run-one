// Unit test
// Traces to: L2-013 AC2, AC3; L2-178 AC5
// Description: writes go one at a time in the order asked, a gapped write waits its gap after the one before, and a
// failed write does not stop the next. With a tap on the link (L2-178 AC5), each write is told to it as it starts and
// as it settles. Vitest's fake clock drives the gaps; nothing sleeps.
import type { BikeLinkTap } from '@telo/api';
import { GattWriteQueue } from './gatt-write-queue';

describe('GattWriteQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** A write that stays pending until the test settles it. */
  const pending = () => {
    let settle!: (ok: boolean) => void;
    const done = new Promise<void>(
      (resolve, reject) => (settle = (ok) => (ok ? resolve() : reject(new Error('no')))),
    );
    return { write: () => done, settle };
  };

  it('starts a write only once the one before it has finished', async () => {
    const queue = new GattWriteQueue();
    const started: string[] = [];
    const first = pending();
    void queue.enqueue(() => (started.push('a'), first.write()));
    const second = queue.enqueue(async () => void started.push('b'));

    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual(['a']);

    first.settle(true);
    await second;
    expect(started).toEqual(['a', 'b']);
  });

  it('waits the gap after the write before, and not before it is over', async () => {
    const queue = new GattWriteQueue();
    const started: number[] = [];
    void queue.enqueue(async () => void started.push(Date.now()));
    void queue.enqueue(async () => void started.push(Date.now()), 300);
    void queue.enqueue(async () => void started.push(Date.now()), 300);

    await vi.advanceTimersByTimeAsync(299);
    expect(started).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(started).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(300);
    expect(started).toHaveLength(3);
    expect(started[2] - started[1]).toBe(300);
  });

  it('goes on to the next write after one fails', async () => {
    const queue = new GattWriteQueue();
    const failing = pending();
    const first = queue.enqueue(failing.write);
    const second = queue.enqueue(async () => undefined);

    failing.settle(false);

    await expect(first).rejects.toThrow('no');
    await expect(second).resolves.toBeGreaterThanOrEqual(0);
  });

  describe('with a tap on the link (L2-178 AC5)', () => {
    const WRITE = '0bf669f2-45f2-11e7-9598-0800200c9a66';
    /** A tap that keeps what it is told, in order. */
    const tapped = () => {
      const heard: string[] = [];
      const tap: BikeLinkTap = {
        received: () => undefined,
        event: () => undefined,
        writing: (to, bytes, targetResistance) => {
          const write = `${to} ${Array.from(bytes).join(',')} ${targetResistance ?? '-'}`;
          heard.push(`writing ${write}`);
          return (error) => heard.push(error === undefined ? 'ok' : `failed ${String(error)}`);
        },
      };
      return { tap, heard };
    };

    it('tells the tap of a write when it starts, after its gap, and when the bike acknowledges it', async () => {
      const { tap, heard } = tapped();
      const queue = new GattWriteQueue(tap);
      const write = pending();
      const done = queue.enqueue(write.write, 300, {
        to: WRITE,
        bytes: Uint8Array.of(0xf0, 0xb1),
        targetResistance: 12,
      });

      await vi.advanceTimersByTimeAsync(299);
      expect(heard).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      expect(heard).toEqual([`writing ${WRITE} 240,177 12`]);

      write.settle(true);
      await done;
      expect(heard).toEqual([`writing ${WRITE} 240,177 12`, 'ok']);
    });

    it('tells the tap the error a write failed with, and still rejects', async () => {
      const { tap, heard } = tapped();
      const queue = new GattWriteQueue(tap);
      const write = pending();
      const done = queue.enqueue(write.write, 0, { to: WRITE, bytes: Uint8Array.of(0xf0) });
      await vi.advanceTimersByTimeAsync(0);

      write.settle(false);

      await expect(done).rejects.toThrow('no');
      expect(heard).toEqual([`writing ${WRITE} 240 -`, 'failed Error: no']);
    });

    it('tells the tap nothing of a write that says nothing of its bytes', async () => {
      const { tap, heard } = tapped();

      await new GattWriteQueue(tap).enqueue(async () => undefined);

      expect(heard).toEqual([]);
    });
  });
});
