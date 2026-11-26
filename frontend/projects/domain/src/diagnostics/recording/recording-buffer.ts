/** The most a diagnostic recording holds (L2-178 AC9): past either limit of the entries, the oldest go first. */
export const RECORDING_LIMITS = { entries: 20_000, bytes: 3_000_000, captures: 8 } as const;

/**
 * The diagnostic recording's entries, as the lines a saved recording holds: a ring that never grows past its limits
 * (L2-178 AC9, L2-138 AC2). A line is ASCII, so its length is its size in bytes; each counts one more for its line
 * break. When a line would take the ring past either limit the oldest lines go, and `dropped` counts them.
 */
export class RecordingBuffer {
  private readonly slots: string[] = [];
  private first = 0;
  private count = 0;
  private held = 0;
  private gone = 0;

  constructor(
    private readonly maxEntries: number = RECORDING_LIMITS.entries,
    private readonly maxBytes: number = RECORDING_LIMITS.bytes,
  ) {}

  /** How many lines are held. */
  get size(): number {
    return this.count;
  }

  /** The size of the held lines in bytes, line breaks included. */
  get bytes(): number {
    return this.held;
  }

  /** How many lines have gone to keep the ring within its limits. */
  get dropped(): number {
    return this.gone;
  }

  push(line: string): void {
    const size = line.length + 1;
    while (this.count > 0 && (this.count >= this.maxEntries || this.held + size > this.maxBytes))
      this.drop();
    this.slots[(this.first + this.count) % this.maxEntries] = line;
    this.count += 1;
    this.held += size;
  }

  /** The held lines, oldest first. */
  lines(): string[] {
    return Array.from(
      { length: this.count },
      (_, index) => this.slots[(this.first + index) % this.maxEntries],
    );
  }

  private drop(): void {
    this.held -= this.slots[this.first].length + 1;
    this.slots[this.first] = '';
    this.first = (this.first + 1) % this.maxEntries;
    this.count -= 1;
    this.gone += 1;
  }
}
