// Unit test
// Traces to: L2-178 AC9, AC11
// Description: the dialog's line about the recording, one case a row: how many entries since when, and how many of
// the oldest were dropped once the recording has reached its limit.
import { entriesLine } from './entries-line';

describe('entriesLine', () => {
  it.each([
    [0, 0, '0 entries since 18:00'],
    [1, 0, '1 entry since 18:00'],
    [2, 0, '2 entries since 18:00'],
    [1284, 0, '1,284 entries since 18:00'],
    [20_000, 0, '20,000 entries since 18:00'],
    [20_000, 1, '20,000 entries · the oldest 1 was dropped'],
    [20_000, 4312, '20,000 entries · the oldest 4,312 were dropped'],
  ])('%d held, %d dropped: %s', (entries, dropped, line) => {
    expect(entriesLine(entries, dropped, '18:00')).toBe(line);
  });
});
