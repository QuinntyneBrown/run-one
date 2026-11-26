// Unit test
// Traces to: L2-178 AC15, AC17; L2-129 AC1
// Description: the saved recording's text. A line is the time, the kind and the detail; text from a bike or a person
// is quoted and escaped to ASCII on one line; the header says what the file is; the file names carry the UTC time.
import {
  captureFileName,
  entryLine,
  quote,
  recordingFileName,
  recordingHeader,
} from './recording-format';

describe('recording format', () => {
  it.each([
    [0, 'EVT', 'recording-started', '       0.0 EVT  recording-started'],
    [1234.56, 'RX', 'notification x F0', '    1234.6 RX   notification x F0'],
    [10_800_000, 'NOTE', '"x"', '10800000.0 NOTE "x"'],
  ] as const)('%d %s: %s', (time, kind, detail, line) => {
    expect(entryLine(time, kind, detail)).toBe(line);
  });

  it.each([
    ['bike shows 82 rpm, resistance 14', '"bike shows 82 rpm, resistance 14"'],
    ['a "quoted" \\ name', '"a \\"quoted\\" \\\\ name"'],
    ['two\nlines', '"two\\nlines"'],
    ['<img src=x onerror=alert(1)>', '"<img src=x onerror=alert(1)>"'],
    ['Vélo — 82', '"V\\u00e9lo \\u2014 82"'],
    ['\u0007bell', '"\\u0007bell"'],
  ])('quotes %j as %s', (text, quoted) => {
    expect(quote(text)).toBe(quoted);
  });

  it('cuts a quoted value past 400 characters and says so', () => {
    const quoted = quote('x'.repeat(500));

    expect(quoted).toBe(`"${'x'.repeat(400)}...[cut]"`);
  });

  it('names the files by the UTC time the recording started', () => {
    const startedAt = new Date('2026-11-23T18:04:05.678Z');

    expect(recordingFileName(startedAt)).toBe('telo-ride-1-recording-20261123T180405Z.log');
    expect(captureFileName(startedAt, 2)).toBe('telo-ride-1-capture-20261123T180405Z-2.png');
  });

  it('opens the file with what it is, when it started, where, the limits and what was dropped', () => {
    const header = recordingHeader({
      startedAt: new Date('2026-11-23T18:00:00.000Z'),
      savedAt: new Date('2026-11-23T18:21:00.000Z'),
      address: 'https://ride.example/?diagnose',
      browser: 'Mozilla/5.0 Chrome/140 — tablet',
      dropped: 4312,
    });

    expect(header.slice(0, 8)).toEqual([
      '# Telo Ride 1 diagnostic recording',
      '# format: 1',
      '# started: 2026-11-23T18:00:00.000Z',
      '# saved: 2026-11-23T18:21:00.000Z',
      '# address: https://ride.example/?diagnose',
      '# browser: Mozilla/5.0 Chrome/140 ? tablet',
      '# limits: 20000 entries, 3000000 bytes, 8 screen captures',
      '# dropped: 4312 entries',
    ]);
    expect(header.every((line) => line.startsWith('#'))).toBe(true);
  });
});
