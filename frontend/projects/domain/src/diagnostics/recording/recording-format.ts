import { RECORDING_LIMITS } from './recording-buffer';

/** The first line of every saved recording: what the file is. */
export const RECORDING_TITLE = 'Telo Ride 1 diagnostic recording';

/** The version of the saved recording's format (L2-178 AC17); it goes up when a tool that parses it must change. */
export const RECORDING_FORMAT = 1;

/** What an entry is: bytes from the bike, a write, its outcome, a link event, a logged error, the readouts, a note, a capture. */
export type EntryKind = 'RX' | 'TX' | 'ACK' | 'EVT' | 'ERR' | 'SCR' | 'NOTE' | 'CAP';

/** The longest text a quoted value keeps; what a bike or an error sends beyond it is cut and marked. */
const QUOTE_LIMIT = 400;

/**
 * Text from a bike, an error or the person diagnosing, as a quoted value of the recording (L2-178 AC17): JSON's
 * quoting, with every character outside printable ASCII escaped, so the file is ASCII and a line never breaks. It is
 * data, never markup (L2-129 AC1).
 */
export function quote(text: string): string {
  const cut = text.length > QUOTE_LIMIT ? `${text.slice(0, QUOTE_LIMIT)}...[cut]` : text;
  return ascii(JSON.stringify(cut));
}

/**
 * Text with every character outside printable ASCII written as a `\\uXXXX` escape, so a line of the recording is
 * ASCII and never breaks, whatever a device's name holds.
 */
export function ascii(text: string): string {
  return text.replace(
    /[^\x20-\x7e]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

/** One entry's line: the time in milliseconds since the recording started, the kind and the detail. */
export function entryLine(sinceStartMs: number, kind: EntryKind, detail: string): string {
  return `${sinceStartMs.toFixed(1).padStart(10)} ${kind.padEnd(4)} ${detail}`;
}

/** A time as a file name carries it: "20261123T180000Z". */
function stamp(at: Date): string {
  return `${at.toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`;
}

/** The recording's file name (L2-178 AC15). */
export function recordingFileName(startedAt: Date): string {
  return `telo-ride-1-recording-${stamp(startedAt)}.log`;
}

/** A screen capture's file name, which its entry names (L2-178 AC13). */
export function captureFileName(startedAt: Date, number: number): string {
  return `telo-ride-1-capture-${stamp(startedAt)}-${number}.png`;
}

/** What a saved recording says of itself. */
export interface RecordingFacts {
  readonly startedAt: Date;
  readonly savedAt: Date;
  /** The address the app was opened at, redacted as a logged line is. */
  readonly address: string;
  readonly browser: string;
  readonly dropped: number;
}

/** The `#` lines that open a saved recording (L2-178 AC17). */
export function recordingHeader(facts: RecordingFacts): string[] {
  const { entries, bytes, captures } = RECORDING_LIMITS;
  return [
    `# ${RECORDING_TITLE}`,
    `# format: ${RECORDING_FORMAT}`,
    `# started: ${facts.startedAt.toISOString()}`,
    `# saved: ${facts.savedAt.toISOString()}`,
    `# address: ${plain(facts.address)}`,
    `# browser: ${plain(facts.browser)}`,
    `# limits: ${entries} entries, ${bytes} bytes, ${captures} screen captures`,
    `# dropped: ${facts.dropped} entries`,
    '# line: <milliseconds since started> <kind> <detail>',
    '# kinds: RX bytes from the bike, TX a write, ACK a write settled, EVT a link event, ERR a logged error,',
    '#        SCR the readouts Class Ride showed, NOTE the bike display as the person read it, CAP a screen capture',
  ];
}

/** A header value with anything outside printable ASCII replaced, so the file stays ASCII. */
function plain(text: string): string {
  return text.replace(/[^\x20-\x7e]/g, '?');
}
