// Acceptance test
// Traces to: L2-178 AC1, AC2, AC10, AC11, AC15, AC16, AC17; L2-115 AC2; L2-131; L2-132
// Description: the diagnostic recording is off for every rider and on only when the app is opened with ?diagnose.
// Off, no screen shows the recording mark and none of the recording's code is fetched. On, every screen shows the
// mark, its dialog says what a saved recording holds, and Save files saves the recording as a text file without a
// request leaving the page (the shared fixture fails the spec on any request off localhost).
//
// Given the app opened without `diagnose`, when it is used, then no mark shows and no recording code is fetched.
// Given the app opened with `?diagnose`, when it loads, then the recording's code is fetched and the mark shows on
// every screen.
// Given the mark, when it is pressed, then the dialog opens with what the files hold; Escape closes it and focus
// returns to the mark.
// Given the dialog, when Save files is pressed, then one text file is saved whose header says what it is.
import { connectBike } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { ScriptLog } from './fixtures/scripts';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { DiagnosticsPage, entriesOf, timesOf } from './pages/diagnostics.page';
import { NotFoundPage } from './pages/not-found.page';
import { TheClassPage } from './pages/the-class.page';

test.describe('Diagnostic recording', () => {
  test('off by default: no mark, and none of the recording’s code is fetched (L2-178 AC1)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const scripts = new ScriptLog(page);
    const home = new TheClassPage(page);
    await home.open();
    await connectBike(bluetooth);
    await expect(home.start).toHaveText(/^\s*(Start class|Ride it again)\s*$/);
    await page.waitForLoadState('networkidle');

    expect(await scripts.hasRecordingCode()).toBe(false);
    await expect(new DiagnosticsPage(page).mark).toHaveCount(0);
    const messages: string[] = [];
    page.on('console', (message) => messages.push(message.text()));
    await connectBike(bluetooth);
    expect(messages, 'no per-packet console line (L2-115 AC2)').toEqual([]);
  });

  test('?diagnose fetches the recording’s code and shows the mark on every screen (L2-178 AC2)', async ({
    page,
    bluetooth,
  }) => {
    const scripts = new ScriptLog(page);
    const diagnostics = new DiagnosticsPage(page);

    // A new rider is sent on to Connect Bike, and the recording stays on.
    await diagnostics.open('/');
    await expect(new ConnectBikePage(page).title).toHaveText('Connect your bike');
    await expect(diagnostics.mark).toBeVisible();
    await expect(diagnostics.mark).toHaveText('Recording');
    expect(await scripts.hasRecordingCode()).toBe(true);

    // The Class, for a rider with a remembered bike.
    await bluetooth.remember(echelonBike);
    await diagnostics.open('/');
    await expect(new TheClassPage(page).main).toBeAttached();
    await expect(diagnostics.mark).toBeVisible();

    // Page not found shows it too: the mark belongs to no one screen.
    await diagnostics.open('/no-such-address');
    await expect(new NotFoundPage(page).heading).toBeVisible();
    await expect(diagnostics.mark).toBeVisible();
  });

  test('the mark opens a modal dialog that says what the files hold (L2-178 AC11, AC16)', async ({
    page,
  }) => {
    const diagnostics = new DiagnosticsPage(page);
    await diagnostics.open('/connect');
    await expect(diagnostics.dialog).toBeHidden();

    await diagnostics.mark.focus();
    await page.keyboard.press('Enter');

    await expect(diagnostics.dialog).toBeVisible();
    await expect(diagnostics.title).toHaveText('Diagnostic recording');
    await expect(diagnostics.count).toContainText(/\d+ entr(y|ies)/);
    await expect(diagnostics.privacy).toHaveText(
      'The recording holds your bike’s name and identifier and every Bluetooth message. A screen capture holds whatever is on the screen. Nothing is sent anywhere: the files are saved only when you press Save files.',
    );
    await expect(diagnostics.addNote).toBeDisabled();
    // A modal dialog: the page behind it is inert.
    expect(await diagnostics.dialog.evaluate((dialog) => dialog.matches(':modal'))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(diagnostics.dialog).toBeHidden();
    await expect(diagnostics.mark).toBeFocused();

    await diagnostics.mark.click();
    await diagnostics.close.click();
    await expect(diagnostics.dialog).toBeHidden();
    await expect(diagnostics.mark).toBeFocused();
  });

  test('Save files saves the recording as a text file that says what it is (L2-178 AC15, AC17)', async ({
    page,
  }) => {
    const diagnostics = new DiagnosticsPage(page);
    await diagnostics.open('/connect');

    const files = await diagnostics.saveFiles();

    expect(files.map((file) => file.name)).toEqual([
      expect.stringMatching(/^telo-ride-1-recording-\d{8}T\d{6}Z\.log$/),
    ]);
    const recording = files[0].bytes.toString('utf8');
    const header = recording.split('\n').filter((line) => line.startsWith('#'));
    expect(header[0]).toBe('# Telo Ride 1 diagnostic recording');
    expect(header).toContain('# format: 1');
    expect(header).toContainEqual(
      expect.stringMatching(/^# started: \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/),
    );
    expect(header).toContainEqual(expect.stringMatching(/^# address: http:\/\/localhost:\d+\//));
    expect(header).toContainEqual(expect.stringMatching(/^# browser: .*Chrome/));
    expect(header).toContain('# limits: 20000 entries, 3000000 bytes, 8 screen captures');
    expect(header).toContain('# dropped: 0 entries');
    // Plain ASCII, a line an entry, times from the monotonic clock in order (AC10).
    expect(files[0].bytes.every((byte) => byte < 0x80)).toBe(true);
    expect(entriesOf(recording)[0]).toBe('EVT  recording-started');
    const times = timesOf(recording);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    await expect(diagnostics.status).toHaveText('Saved 1 file: the recording.');
  });
});
