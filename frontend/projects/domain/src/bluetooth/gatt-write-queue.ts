import type { BikeLinkTap } from '@telo/api';

/** What a write sends, for the tap on the link: the characteristic, the bytes, and a resistance command's target. */
export interface SentBytes {
  readonly to: string;
  readonly bytes: Uint8Array;
  readonly targetResistance?: number;
}

/**
 * Every write to the bike, one at a time in the order asked (L2-013 AC3). A write waits while another is pending,
 * and `minGapMs` more after it finishes; each resolves with its acknowledgement time in milliseconds. It is the one
 * place every write of both links passes, so it is where the tap on the link hears of each write as it starts and of
 * its outcome when it settles (L2-178 AC5); with no tap, as for every rider, it tells no one.
 */
export class GattWriteQueue {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(private readonly tap: BikeLinkTap | null = null) {}

  enqueue(write: () => Promise<void>, minGapMs = 0, sent?: SentBytes): Promise<number> {
    const run = async (): Promise<number> => {
      if (minGapMs > 0) await new Promise((resolve) => setTimeout(resolve, minGapMs));
      const settled = sent && this.tap?.writing(sent.to, sent.bytes, sent.targetResistance);
      const started = Date.now();
      try {
        await write();
      } catch (error) {
        settled?.(error);
        throw error;
      }
      settled?.();
      return Date.now() - started;
    };
    const next = this.tail.then(run, run);
    this.tail = next.catch(() => undefined);
    return next;
  }
}
