// Unit test
// Traces to: L2-178 AC3, AC4, AC5, AC8, AC9, AC10, AC12, AC13, AC14, AC17; L2-115 AC2
// Description: the recorder on a fake monotonic clock. Each thing told to it becomes one line with its time since the
// recording started; a write has two, numbered alike; readouts are recorded only when they change; screen captures
// are held apart, at most 8; the saved file opens with its header; and nothing is written to the console.
import { TestBed } from '@angular/core/testing';
import { MONOTONIC_TIME } from '@telo/api';
import { DiagnosticRecorder } from './diagnostic-recorder';
import { RECORDING_LIMITS } from './recording-buffer';

const NOTIFY = '0bf669f4-45f2-11e7-9598-0800200c9a66';
const WRITE = '0bf669f2-45f2-11e7-9598-0800200c9a66';

describe('DiagnosticRecorder', () => {
  let now = 1000;
  const create = () => {
    now = 1000;
    TestBed.configureTestingModule({
      providers: [DiagnosticRecorder, { provide: MONOTONIC_TIME, useValue: { now: () => now } }],
    });
    return TestBed.inject(DiagnosticRecorder);
  };
  const text = async (recorder: DiagnosticRecorder) => recorder.files()[0].blob.text();
  /** The recording's entries, with their times. */
  const lines = async (recorder: DiagnosticRecorder) =>
    (await text(recorder)).split('\n').filter((line) => line !== '' && !line.startsWith('#'));
  const picture = (width = 1194, height = 834) => ({ picture: new Blob(['png']), width, height });

  it('starts with one entry, at time zero', async () => {
    const recorder = create();

    expect(await lines(recorder)).toEqual(['       0.0 EVT  recording-started']);
    expect(recorder.entries()).toBe(1);
    expect(recorder.dropped()).toBe(0);
  });

  it('stamps each entry with the monotonic time since it started, in order (AC10)', async () => {
    const recorder = create();
    now = 1250.5;
    recorder.event('ble', 'connecting');
    now = 4000;
    recorder.received(NOTIFY, bytes(), 'notification', 'echelon');

    expect((await lines(recorder)).slice(1)).toEqual([
      '     250.5 EVT  ble connecting',
      `    3000.0 RX   notification ${NOTIFY} F0 D2 01 0C CF | EchelonFrameDecoder D2 resistance=12 checksum=ok`,
    ]);
  });

  it('records a write when it is asked for and its outcome when it settles, numbered alike (AC5)', async () => {
    const recorder = create();
    const first = recorder.writing(WRITE, Uint8Array.of(0xf0, 0xa0, 0x01, 0x01, 0x92));
    now = 1012.4;
    const second = recorder.writing(WRITE, Uint8Array.of(0xf0, 0xb1, 0x01, 0x0c, 0xae), 12);
    first();
    now = 1100;
    second(new DOMException('GATT operation failed for unknown reason.', 'NetworkError'));

    expect((await lines(recorder)).slice(1)).toEqual([
      `       0.0 TX   #1 ${WRITE} F0 A0 01 01 92`,
      `      12.4 TX   #2 ${WRITE} F0 B1 01 0C AE | target-resistance=12`,
      '      12.4 ACK  #1 ok 12ms',
      '     100.0 ACK  #2 failed "NetworkError: GATT operation failed for unknown reason."',
    ]);
  });

  it('records the readouts only when one of them changed, with a dash for an unknown one (AC8)', async () => {
    const recorder = create();
    const readouts = { power: '—', cadence: '—', resistance: '13', targetResistance: '13' };
    recorder.readouts(readouts);
    recorder.readouts({ ...readouts });
    recorder.readouts({ ...readouts, power: '233', cadence: '91' });

    expect((await lines(recorder)).slice(1)).toEqual([
      '       0.0 SCR  power="-" cadence="-" resistance="13" target-resistance="13"',
      '       0.0 SCR  power="233" cadence="91" resistance="13" target-resistance="13"',
    ]);
  });

  it('records a note and a logged line as quoted ASCII text, never markup (AC12, AC17)', async () => {
    const recorder = create();
    recorder.note('bike shows 82 rpm, resistance 14');
    recorder.note('<b>Vélo</b>\n"82"');
    recorder.logged('[bluetooth] NetworkError: GATT Server is disconnected.');

    expect((await lines(recorder)).slice(1)).toEqual([
      '       0.0 NOTE "bike shows 82 rpm, resistance 14"',
      '       0.0 NOTE "<b>V\\u00e9lo</b>\\n\\"82\\""',
      '       0.0 ERR  "[bluetooth] NetworkError: GATT Server is disconnected."',
    ]);
  });

  it('keeps a screen capture as a file of its own, named in its entry (AC13)', async () => {
    const recorder = create();
    now = 6000;

    const number = recorder.keepCapture(picture());

    const name = recorder.files()[1].name;
    expect(number).toBe(1);
    expect(name).toMatch(/^telo-ride-1-capture-\d{8}T\d{6}Z-1\.png$/);
    expect((await lines(recorder)).at(-1)).toBe(`    5000.0 CAP  1 ${name} 1194x834`);
    expect(recorder.captures()).toBe(1);
  });

  it('records a capture that was not taken, and keeps nothing (AC14)', async () => {
    const recorder = create();
    recorder.captureFailed('refused', new DOMException('Permission denied', 'NotAllowedError'));
    recorder.captureFailed('unsupported');

    expect((await lines(recorder)).slice(1)).toEqual([
      '       0.0 CAP  refused "NotAllowedError: Permission denied"',
      '       0.0 CAP  unsupported',
    ]);
    expect(recorder.files()).toHaveLength(1);
  });

  it('holds at most 8 screen captures, drops the oldest and says so (AC9)', async () => {
    const recorder = create();
    for (let taken = 0; taken < RECORDING_LIMITS.captures + 1; taken++)
      recorder.keepCapture(picture());

    const names = recorder
      .files()
      .slice(1)
      .map((file) => file.name);
    expect(names).toHaveLength(8);
    expect(names[0]).toMatch(/-2\.png$/);
    expect(names.at(-1)).toMatch(/-9\.png$/);
    expect((await lines(recorder)).at(-1)).toMatch(
      /CAP {2}dropped telo-ride-1-capture-\d{8}T\d{6}Z-1\.png to keep 8$/,
    );
    expect(recorder.captures()).toBe(8);
  });

  it('drops the oldest entries at its limit and says how many in the file (AC9)', async () => {
    const recorder = create();
    for (let sent = 0; sent < RECORDING_LIMITS.entries + 49; sent++) recorder.event('ble', 'idle');

    expect(recorder.entries()).toBe(RECORDING_LIMITS.entries);
    expect(recorder.dropped()).toBe(50);
    expect(await text(recorder)).toContain('\n# dropped: 50 entries\n');
    expect(await lines(recorder)).toHaveLength(RECORDING_LIMITS.entries);
  });

  it('saves a text file that opens with its header and ends each entry with a line break (AC17)', async () => {
    const recorder = create();

    const [file] = recorder.files();

    expect(file.name).toMatch(/^telo-ride-1-recording-\d{8}T\d{6}Z\.log$/);
    expect(file.blob.type).toBe('text/plain;charset=utf-8');
    const saved = await file.blob.text();
    expect(saved.startsWith('# Telo Ride 1 diagnostic recording\n# format: 1\n')).toBe(true);
    expect(saved.endsWith('EVT  recording-started\n')).toBe(true);
  });

  it('writes nothing to the console, whatever it records (L2-115 AC2)', () => {
    const consoles = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const recorder = create();
    recorder.received(NOTIFY, bytes(), 'notification', 'echelon');
    recorder.writing(WRITE, bytes())(new Error('no'));
    recorder.logged('[bluetooth] Error: no');
    recorder.files();

    for (const spy of consoles) expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

function bytes(): Uint8Array {
  return Uint8Array.of(0xf0, 0xd2, 0x01, 0x0c, 0xcf);
}
