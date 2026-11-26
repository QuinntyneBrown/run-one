// Acceptance test
// Traces to: L2-178 AC3, AC4, AC5, AC8, AC10; L2-129 AC4; L2-020; L2-025
// Description: with the recording on, a saved recording holds every byte that crossed the link in a ride, in order.
// Each notification's entry holds its raw bytes and what the app's decoder made of them, a frame the decoder drops
// included; each write holds its bytes and, in a second entry, its outcome, a failed write included; a resistance
// command holds its target resistance; and the readouts Class Ride showed are there beside them.
//
// Given a ride with the recording on, when the bike notifies `F0 D2 01 0C CF`, then one entry holds those bytes and
// "EchelonFrameDecoder D2 resistance=12"; and `F0 D1 … 50 00 1F` gives "D1 cadence=80".
// Given a frame the decoder drops, when it arrives, then its bytes are recorded with "dropped" and the reason, and no
// readout changes.
// Given the ride, when the app writes, then each write has a TX entry with its bytes and an ACK entry with its
// outcome; a resistance command's TX holds its target resistance; a write that fails has "failed" and its error.
// Given Class Ride, when a readout changes, then an SCR entry holds power, cadence, resistance and target resistance.
import { startClassRide } from './fixtures/class-ride';
import {
  ECHELON_NOTIFY,
  ECHELON_WRITE,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { DiagnosticsPage } from './pages/diagnostics.page';

const RX = `RX   notification ${ECHELON_NOTIFY}`;
const WARM_UP = theClass.segments[0];

test.describe('Diagnostic recording of the link', () => {
  test(
    'a notification is recorded as raw bytes with what the decoder made of them (L2-178 AC3, AC4)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      const ride = await startClassRide(page, bluetooth, api, { diagnose: true });
      await page.clock.runFor(2000);

      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(12));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(250);
      await expect(ride.cadence).toHaveText('80');
      await expect(ride.power).toHaveText('193');

      await page.clock.resume();
      const entries = await new DiagnosticsPage(page).entries();
      const received = entries.filter((entry) => entry.startsWith('RX '));
      // The bike's two frames, in the order it sent them, after the one that connected it.
      expect(received.slice(-2)).toEqual([
        `${RX} F0 D2 01 0C CF | EchelonFrameDecoder D2 resistance=12 checksum=ok`,
        `${RX} F0 D1 09 00 05 00 00 00 00 00 50 00 1F | EchelonFrameDecoder D1 cadence=80 checksum=ok`,
      ]);
      // What the rider saw of them (AC8): power is the estimate from cadence 80 at resistance 12.
      expect(entries).toContain(
        `SCR  power="193" cadence="80" resistance="12" target-resistance="${WARM_UP.level}"`,
      );
      // The readouts follow the bytes they came from.
      expect(
        entries.indexOf(
          `SCR  power="193" cadence="80" resistance="12" target-resistance="${WARM_UP.level}"`,
        ),
      ).toBeGreaterThan(entries.indexOf(received.at(-1)!));
    },
  );

  test('a frame the decoder drops is recorded with its bytes and the reason, and changes no readout (L2-178 AC3, AC4; L2-129 AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api, { diagnose: true });
    await page.clock.runFor(2000);
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    await page.clock.runFor(250);
    await expect(ride.cadence).toHaveText('80');

    await bluetooth.notify(ECHELON_NOTIFY, [0xf0, 0xd1, 0x02]);
    await bluetooth.notify(ECHELON_NOTIFY, [0x0f, 0xd1, 0x01, 0x5a, 0x3b]);
    await bluetooth.notify(ECHELON_NOTIFY, [0xf0, 0xd1, 0x02, 0x00, 0x5a, 0x1d]);
    await bluetooth.notify(ECHELON_NOTIFY, [0xf0, 0xd0, 0x01, 0x00, 0xc1]);
    await bluetooth.notify(ECHELON_NOTIFY, [0xf0, 0xe7, 0x01, 0x00, 0xd8]);
    await bluetooth.notify(ECHELON_NOTIFY, [0xf0, 0xd2, 0x01, 0x0c, 0x00]);
    await page.clock.runFor(250);
    await expect(ride.cadence).toHaveText('80');

    await page.clock.resume();
    const received = (await new DiagnosticsPage(page).entries()).filter((entry) =>
      entry.startsWith('RX '),
    );
    expect(received.slice(-6)).toEqual([
      `${RX} F0 D1 02 | EchelonFrameDecoder dropped: shorter than 4 bytes`,
      `${RX} 0F D1 01 5A 3B | EchelonFrameDecoder dropped: byte 0 is not F0`,
      `${RX} F0 D1 02 00 5A 1D | EchelonFrameDecoder D1 dropped: D1 shorter than 13 bytes checksum=ok`,
      `${RX} F0 D0 01 00 C1 | EchelonFrameDecoder D0 dropped: D0 is not read checksum=ok`,
      `${RX} F0 E7 01 00 D8 | EchelonFrameDecoder E7 dropped: unknown frame type checksum=ok`,
      // The app does not check an incoming checksum (docs/protocol): the recording says when one is wrong.
      `${RX} F0 D2 01 0C 00 | EchelonFrameDecoder D2 resistance=12 checksum=bad`,
    ]);
  });

  test('each write is recorded with its bytes, its outcome and a resistance command’s target resistance (L2-178 AC5)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api, { diagnose: true });
    // Two keepalives go, a second apart.
    await page.clock.runFor(2500);

    await page.clock.resume();
    const entries = await new DiagnosticsPage(page).entries();
    const sent = entries.filter((entry) => entry.startsWith('TX '));
    // The initialisation, in order, numbered from 1.
    expect(sent.slice(0, 3)).toEqual([
      `TX   #1 ${ECHELON_WRITE} F0 A1 00 91`,
      `TX   #2 ${ECHELON_WRITE} F0 A3 00 93`,
      `TX   #3 ${ECHELON_WRITE} F0 B0 01 01 A2`,
    ]);
    // The ride's first resistance command, with the target resistance the plan asked for.
    const command = sent.find((entry) => entry.includes(targetResistanceWrite(WARM_UP.level)))!;
    expect(command).toMatch(
      new RegExp(
        `^TX   #\\d+ ${ECHELON_WRITE} ${targetResistanceWrite(WARM_UP.level)} \\| target-resistance=${WARM_UP.level}$`,
      ),
    );
    // Keepalives are writes too.
    expect(sent.filter((entry) => entry.endsWith('F0 A0 01 01 92')).length).toBeGreaterThanOrEqual(
      2,
    );
    // Every write the fake bike received is in the recording, in the order it received them.
    expect(sent.map((entry) => entry.split(' ').slice(5).join(' ').split(' | ')[0])).toEqual(
      bluetooth
        .writes()
        .slice(0, sent.length)
        .map((write) => write.hex),
    );
    // Each write settles in an entry of its own, after it, with the time the bike took.
    for (const entry of sent.slice(0, 4)) {
      const number = entry.split(/\s+/)[1];
      const settled = entries.findIndex((other) => other.startsWith(`ACK  ${number} `));
      expect(settled, `${number} settles after it is written`).toBeGreaterThan(
        entries.indexOf(entry),
      );
      expect(entries[settled]).toMatch(new RegExp(`^ACK  ${number} ok \\d+ms$`));
    }
  });

  test('a write that fails is recorded with its error (L2-178 AC5)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api, { diagnose: true });
    await page.clock.runFor(500);

    await bluetooth.failWrites();
    await page.clock.runFor(1500);

    await page.clock.resume();
    await bluetooth.allowWrites();
    const entries = await new DiagnosticsPage(page).entries();
    const failed = entries.find((entry) => /^ACK {2}#\d+ failed /.test(entry));
    expect(failed).toMatch(/^ACK {2}#\d+ failed "NetworkError: GATT operation failed/);
    const number = failed!.split(/\s+/)[1];
    expect(entries.find((entry) => entry.startsWith(`TX   ${number} `))).toContain(
      `${ECHELON_WRITE} F0 A0 01 01 92`,
    );
  });
});
