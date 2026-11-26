// Unit test
// Traces to: L2-178 AC9; L2-138 AC2
// Description: the recording's ring keeps its lines in order within its two limits. Past the limit of entries or of
// bytes the oldest lines go first and are counted; a long ride's worth of lines leaves it no larger than its limits.
import { RECORDING_LIMITS, RecordingBuffer } from './recording-buffer';

describe('RecordingBuffer', () => {
  it('holds its lines in the order they were pushed', () => {
    const buffer = new RecordingBuffer(4, 1000);

    for (const line of ['a', 'b', 'c']) buffer.push(line);

    expect(buffer.lines()).toEqual(['a', 'b', 'c']);
    expect(buffer.size).toBe(3);
    expect(buffer.bytes).toBe(6);
    expect(buffer.dropped).toBe(0);
  });

  it('drops the oldest line once it holds its limit of entries', () => {
    const buffer = new RecordingBuffer(3, 1000);

    for (const line of ['a', 'b', 'c', 'd', 'e']) buffer.push(line);

    expect(buffer.lines()).toEqual(['c', 'd', 'e']);
    expect(buffer.size).toBe(3);
    expect(buffer.dropped).toBe(2);
  });

  it('drops as many of the oldest lines as a new line needs to stay within its limit of bytes', () => {
    const buffer = new RecordingBuffer(100, 10);
    buffer.push('aa'); // 3 bytes with its line break
    buffer.push('bb');
    buffer.push('cc');

    buffer.push('dddddd'); // 7 bytes: two of the three must go

    expect(buffer.lines()).toEqual(['cc', 'dddddd']);
    expect(buffer.bytes).toBe(10);
    expect(buffer.dropped).toBe(2);
  });

  it('counts each line’s bytes as its length and a line break', () => {
    const buffer = new RecordingBuffer(10, 1000);

    buffer.push('F0 D2 01 0C CF');

    expect(buffer.bytes).toBe(15);
  });

  it('stays within its limits over a three-hour ride’s entries (L2-138 AC2)', () => {
    const buffer = new RecordingBuffer();
    const line = '  123456.7 RX   notification 0bf669f4-45f2-11e7-9598-0800200c9a66 F0 D2 01 0C CF';
    const entries = 3 * 60 * 60 * 5;

    for (let index = 0; index < entries; index++) buffer.push(`${line} ${index}`);

    expect(buffer.size).toBe(RECORDING_LIMITS.entries);
    expect(buffer.bytes).toBeLessThanOrEqual(RECORDING_LIMITS.bytes);
    expect(buffer.dropped).toBe(entries - RECORDING_LIMITS.entries);
    expect(buffer.lines().at(-1)).toBe(`${line} ${entries - 1}`);
    expect(buffer.lines()[0]).toBe(`${line} ${entries - RECORDING_LIMITS.entries}`);
  });

  it('holds the default limits L2-178 states', () => {
    expect(RECORDING_LIMITS).toEqual({ entries: 20_000, bytes: 3_000_000, captures: 8 });
  });
});
