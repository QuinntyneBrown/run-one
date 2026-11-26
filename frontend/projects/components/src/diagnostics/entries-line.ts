const count = (value: number): string => value.toLocaleString('en-US');

/**
 * The dialog's line about the recording (L2-178 AC9, AC11): "1,284 entries since 18:00", or, once the recording has
 * reached its limit, "20,000 entries · the oldest 4,312 were dropped".
 */
export function entriesLine(entries: number, dropped: number, since: string): string {
  const held = `${count(entries)} ${entries === 1 ? 'entry' : 'entries'}`;
  return dropped > 0
    ? `${held} · the oldest ${count(dropped)} ${dropped === 1 ? 'was' : 'were'} dropped`
    : `${held} since ${since}`;
}
