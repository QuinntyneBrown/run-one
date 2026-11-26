// Acceptance test
// Traces to: L2-178 AC9, AC12, AC13, AC14, AC15, AC20; L2-129 AC1; L2-138 AC2
// Description: what the person diagnosing adds to the recording, and its limit. A note of what the bike's own display
// reads is stamped into the recording as text. A screen capture is one still of the tab, kept with the recording and
// saved with it as a PNG; the browser's sharing ends as soon as it is taken. A refusal, or a browser with no Screen
// Capture API, keeps nothing, says so and leaves the ride alone. Past 20,000 entries the oldest go, and the dialog and
// the saved file say how many.
//
// Given the dialog, when a note is typed and added, then the recording holds it with its time and the dialog says so.
// Given the dialog, when Capture screen is pressed and the tab is shared, then one PNG is kept and saved, its entry
// names it, and the sharing has ended.
// Given the person refuses, when the capture ends, then nothing is kept, the dialog says so and the ride carries on.
// Given a browser with no Screen Capture API, then Capture screen is off and the dialog says why.
// Given more than 20,000 entries, when the recording is saved, then it holds the newest 20,000 and says what went.
import { connectBike, startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame } from './fixtures/echelon';
import { SHARED_SCREEN, ScreenCaptureFixture } from './fixtures/screen-capture';
import { expect, test } from './fixtures/test';
import { DiagnosticsPage, entriesOf } from './pages/diagnostics.page';
import { TheClassPage } from './pages/the-class.page';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

test.describe('Diagnostic recording: notes, screen captures and the limit', () => {
  test('a note of what the bike’s display reads is stamped into the recording as text (L2-178 AC12)', async ({
    page,
  }) => {
    const diagnostics = new DiagnosticsPage(page);
    await diagnostics.open('/connect');
    await diagnostics.mark.click();
    await expect(diagnostics.addNote).toBeDisabled();
    await expect(diagnostics.note).toHaveAttribute('maxlength', '200');

    await diagnostics.note.fill('bike shows 82 rpm, resistance 14');
    await expect(diagnostics.addNote).toBeEnabled();
    await diagnostics.addNote.click();

    await expect(diagnostics.status).toHaveText('Note added');
    await expect(diagnostics.note).toHaveValue('');
    await expect(diagnostics.addNote).toBeDisabled();

    // Enter adds a note too, and markup in one is text, in the dialog and in the file (L2-129 AC1).
    await diagnostics.note.fill('<img src=x onerror=alert(1)> "82" — é');
    await page.keyboard.press('Enter');
    await expect(diagnostics.note).toHaveValue('');

    const entries = await diagnostics.entries();
    expect(entries.filter((entry) => entry.startsWith('NOTE '))).toEqual([
      'NOTE "bike shows 82 rpm, resistance 14"',
      'NOTE "<img src=x onerror=alert(1)> \\"82\\" \\u2014 \\u00e9"',
    ]);
  });

  test('Capture screen keeps one still of the tab, saves it with the recording and ends the sharing (L2-178 AC13, AC15, AC20)', async ({
    page,
  }) => {
    const sharing = await ScreenCaptureFixture.install(page);
    const diagnostics = new DiagnosticsPage(page);
    await diagnostics.open('/connect');
    await diagnostics.mark.click();

    await diagnostics.capture.click();

    await expect(diagnostics.status).toHaveText('Screen capture 1 kept');
    await expect(diagnostics.mark).toHaveText('Recording');
    // The current tab was asked for, with no sound, and the sharing ended once the picture was taken.
    expect(await sharing.asked()).toEqual([{ video: true, audio: false, preferCurrentTab: true }]);
    expect(await sharing.tracks()).toEqual(['ended']);

    const files = await diagnostics.saveFiles(2);
    expect(files.map((file) => file.name)).toEqual([
      expect.stringMatching(/^telo-ride-1-recording-\d{8}T\d{6}Z\.log$/),
      expect.stringMatching(/^telo-ride-1-capture-\d{8}T\d{6}Z-1\.png$/),
    ]);
    expect([...files[1].bytes.subarray(0, 8)]).toEqual(PNG);
    expect(entriesOf(files[0].bytes.toString('utf8'))).toContain(
      `CAP  1 ${files[1].name} ${SHARED_SCREEN.width}x${SHARED_SCREEN.height}`,
    );
    await expect(diagnostics.status).toHaveText(
      'Saved 2 files: the recording and 1 screen capture.',
    );
  });

  test('a refused screen capture keeps nothing, says so, and the ride carries on (L2-178 AC14)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const sharing = await ScreenCaptureFixture.install(page);
    const ride = await startClassRide(page, bluetooth, api, { diagnose: true });
    await page.clock.resume();
    const diagnostics = new DiagnosticsPage(page);
    await sharing.refuse();
    await diagnostics.mark.click();
    const before = await ride.clockSeconds();
    const written = bluetooth.writes().length;

    await diagnostics.capture.click();

    await expect(diagnostics.status).toHaveText(
      'The browser didn’t share the screen, so no capture was kept. The ride carries on.',
    );
    await diagnostics.close.click();
    // The clock, the keepalive and the recording all carry on.
    await expect.poll(() => ride.clockSeconds()).toBeGreaterThan(before);
    await expect.poll(() => bluetooth.writes().length).toBeGreaterThan(written);
    const files = await diagnostics.saveFiles();
    expect(files).toHaveLength(1);
    expect(entriesOf(files[0].bytes.toString('utf8'))).toContain(
      'CAP  refused "NotAllowedError: Permission denied"',
    );
  });

  test('a browser with no Screen Capture API has Capture screen off and says why (L2-178 AC14)', async ({
    page,
  }) => {
    const sharing = await ScreenCaptureFixture.install(page);
    await sharing.remove();
    const diagnostics = new DiagnosticsPage(page);
    await diagnostics.open('/connect');
    await diagnostics.mark.click();

    await expect(diagnostics.capture).toBeDisabled();
    await expect(diagnostics.dialog).toContainText(
      'This browser can’t capture the screen. Notes and the recording still work.',
    );
    // Notes and saving still work.
    await diagnostics.addNoteOf('bike shows 82 rpm, resistance 14');
    await expect(diagnostics.status).toHaveText('Note added');
    expect(await diagnostics.entries()).toContain('NOTE "bike shows 82 rpm, resistance 14"');
  });

  test('past 20,000 entries the oldest go, and the dialog and the file say how many (L2-178 AC9)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const home = new TheClassPage(page);
    await home.open({ diagnose: true });
    await connectBike(bluetooth);
    await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/);
    const diagnostics = new DiagnosticsPage(page);

    // More notifications than the recording holds: an hour and more of a ride, at once.
    await bluetooth.notifyTimes(ECHELON_NOTIFY, resistanceFrame(13), 20_100);

    await diagnostics.mark.click();
    await expect(diagnostics.count).toHaveText(
      /^20,000 entries · the oldest [1-9][\d,]* were dropped$/,
    );
    const [file] = await diagnostics.saveFiles();
    const recording = file.bytes.toString('utf8');
    // The connection's own entries came first, so more than the 100 extra notifications went (keepalives go on).
    const dropped = Number(/^# dropped: (\d+) entries$/m.exec(recording)?.[1]);
    expect(dropped).toBeGreaterThan(100);
    expect(dropped).toBeLessThan(200);
    const entries = entriesOf(recording);
    expect(entries).toHaveLength(20_000);
    // The newest are kept: the last notification is there, and the recording's first entry is not.
    expect(entries).not.toContain('EVT  recording-started');
    expect(entries.filter((entry) => entry.startsWith('RX ')).length).toBeGreaterThan(19_900);
    expect(file.bytes.length).toBeLessThan(3_000_000 + 2_000);
  });
});
