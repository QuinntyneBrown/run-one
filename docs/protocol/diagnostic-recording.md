# Diagnostic recording

This page says how to record what a bike and Telo Ride 1 said to each other, and how to read the
file that comes out. It is for finding why a bike will not connect, will not report pedalling or
will not take a target resistance. The requirement is `L2-178` in
[`docs/specs/L2.md`](../specs/L2.md); the decisions are in
[ADR 0048](../adr/0048-diagnostic-recording-behind-configuration.md).

The recording is off for every rider. Nothing is recorded, shown or even downloaded unless the app
is opened as below. Nothing is ever sent anywhere: a recording leaves the device only as files you
save yourself.

## Make a recording

1. **Open the app with `?diagnose` on the end of its address**, in Chrome or Edge: for example
   `https://<the app's address>/?diagnose`, or `http://localhost:4200/?diagnose` from `npm start`.
   Add it to `?simulate` with `&` to record the simulated bike: `/?simulate&diagnose`. A button
   that reads **Recording** appears at the foot of every screen. It stays for the visit; reload
   the page without `?diagnose` to turn it off.
2. **Use the app as usual**: connect the bike, start the class, pedal. Everything is recorded
   from the moment the page opens, so the pairing is in it too.
3. **Say what the bike itself shows.** Press **Recording**, type what the bike's own display
   reads at that moment (for example `bike shows 82 rpm, resistance 14`) and press **Add note**.
   The note is stamped into the recording with its time. This is the only way the recording
   learns what the bike was really doing, so add one whenever the screen and the bike disagree.
4. **Capture the screen**, if the browser can. Press **Recording**, then **Capture screen**. The
   dialog closes, the browser asks to share this tab, and one still picture is kept. On a tablet
   (Chrome on Android) the button is off; the readouts the screen showed are in the recording
   anyway, as `SCR` lines.
5. **Save.** Press **Recording**, then **Save files**. The browser downloads
   `telo-ride-1-recording-<UTC time>.log` and one `telo-ride-1-capture-<UTC time>-<n>.png` for each
   capture. If the browser asks whether the site may download several files, allow it.

Save before you close or reload the tab: the recording is held in the page and goes with it.

## What a recording holds

A recording holds the bike's name and identifier, every byte the bike sent and the app wrote, and
the address and browser it was made in. A screen capture holds whatever was on the screen. Read
the file before you attach it to an issue, and leave out a capture that shows anything you would
rather not share.

It holds the newest 20,000 entries or 3,000,000 bytes, whichever comes first: about the last hour
of a ride, or the 20-minute class three times over. Past that the oldest entries go, and the file
says how many. It holds the newest 8 screen captures.

## Read a recording

The file is plain ASCII text, one entry a line. Lines that begin `#` describe the file:

```text
# Telo Ride 1 diagnostic recording
# format: 1
# started: 2026-11-23T18:00:00.000Z
# saved: 2026-11-23T18:21:07.412Z
# address: https://ride.example/?diagnose
# browser: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ... Chrome/140.0.0.0 ...
# limits: 20000 entries, 3000000 bytes, 8 screen captures
# dropped: 0 entries
```

Every other line is three fields: the time in milliseconds since the recording started (from the
monotonic clock, so it never jumps), the entry's kind, and its detail. Bytes are upper-case hex
separated by spaces, as [the frame reference](echelon-ble-frames.md) writes them. Text from the
bike or from you is in double quotes, escaped as JSON escapes it, with anything outside ASCII as
`\uXXXX`.

| Kind | What it is | Detail |
|---|---|---|
| `RX` | Bytes from the bike | how they came (`notification`, `indication`, `read`), the characteristic, the bytes, then ` \| ` and what the app's decoder made of them |
| `TX` | A write to the bike | `#` and the write's number, the characteristic, the bytes, then ` \| target-resistance=<level>` on a resistance command |
| `ACK` | A write settled | the write's number, then `ok <n>ms` (how long the bike took to acknowledge it) or `failed "<error>"` |
| `EVT` | Something the link did | see the table below |
| `ERR` | An error the app logged | the line the console got, quoted |
| `SCR` | The readouts Class Ride showed | `power`, `cadence`, `resistance` and `target-resistance` as the screen drew them; `"-"` is the screen's dash for unknown |
| `NOTE` | Your note of the bike's display | the note, quoted |
| `CAP` | A screen capture | its number, its file name and its size in pixels; or `refused`, `failed` or `unsupported` with the browser's error; or `dropped <file>` when a ninth pushed the oldest out |

### What the decoder made of the bytes

After the ` | ` of an `RX` line:

- **The decoder**, `EchelonFrameDecoder` or `IndoorBikeDataDecoder`. It is the decoder the app
  really uses for this bike, chosen by the bike's kind (see the `bike` event). If an Echelon's
  frames are being read by `IndoorBikeDataDecoder`, that is the fault.
- **The frame**: `D1` (cadence), `D2` (resistance) or another type byte for an Echelon;
  `IndoorBikeData flags=0x....` for an FTMS bike.
- **The values** the readouts got from it: `cadence=`, `resistance=`, `power=`, `speed=`. An
  Echelon reports no power; the app estimates it from cadence and resistance, and the estimate
  shows in the next `SCR` line.
- Or **`dropped:`** and why the decoder read nothing from the frame: `shorter than 4 bytes`,
  `byte 0 is not F0`, `D1 shorter than 13 bytes`, `D0 is not read`, `unknown frame type`,
  `shorter than 2 bytes`.
- **`checksum=ok`** or **`checksum=bad`** for an Echelon frame. The app does not check an incoming
  checksum; the recording does, so a corrupted frame can be told from a frame the app misreads.

An FTMS bike's other bytes are read too: `FtmsResistanceRange minimum= maximum= increment=` for
the range the app read, and `FtmsControlPoint response to=0x.. success` or `refused result=0x..`
for the control point's answer.

### Link events

| Event | When |
|---|---|
| `recording-started` | The page opened with `?diagnose` |
| `chooser-opened filters=… optional-services=…` | The app asked the browser for a bike, with these filters |
| `chooser-picked name="…" id="…"` | A bike was picked: the name it advertises and the browser's identifier for it |
| `chooser-closed`, `chooser-failed "<error>"` | The chooser was closed with no bike, or could not open |
| `remembered-bike name="…" id="…"` | The app found the bike it paired before, without the chooser |
| `watching-advertisements`, `advertising` | The app is waiting for that bike to advertise; it did |
| `bike name="…" identifier="…" kind=echelon\|ftms` | What the app took the device for. `kind` picks the decoder |
| `service <uuid> characteristics=<uuid>(read,write,notify,…),…` | A service the bike offers and what each characteristic can do |
| `link echelon\|ftms\|simulated` | Which protocol the app chose, from the services |
| `ble idle\|connecting\|connected\|disconnected` | Each change of the link state |
| `dropped` | The link was lost |
| `reconnect-attempt`, `reconnect-ok`, `reconnect-failed` | Each automatic try to get the bike back |

### An example

A bike that pairs, takes a resistance command and reports back:

```text
       0.0 EVT  recording-started
    2140.5 EVT  chooser-opened filters=[{"services":["0bf669f1-45f2-11e7-9598-0800200c9a66"]},{"services":[6182]},{"namePrefix":"ECH"}] optional-services=["0bf669f1-45f2-11e7-9598-0800200c9a66",6182]
    5870.2 EVT  chooser-picked name="ECH-EX5S-141844" id="kK3fA9=="
    5870.3 EVT  bike name="Echelon EX-5s" identifier="EX5S-141844" kind=echelon
    5870.4 EVT  ble connecting
    6412.0 EVT  service 0bf669f1-45f2-11e7-9598-0800200c9a66 characteristics=0bf669f2-45f2-11e7-9598-0800200c9a66(write),0bf669f4-45f2-11e7-9598-0800200c9a66(notify)
    6412.1 EVT  link echelon
    6530.7 TX   #1 0bf669f2-45f2-11e7-9598-0800200c9a66 F0 A1 00 91
    6561.9 ACK  #1 ok 31ms
    7204.4 RX   notification 0bf669f4-45f2-11e7-9598-0800200c9a66 F0 D2 01 0C CF | EchelonFrameDecoder D2 resistance=12 checksum=ok
    7204.5 EVT  ble connected
   61230.8 TX   #9 0bf669f2-45f2-11e7-9598-0800200c9a66 F0 B1 01 0E B0 | target-resistance=14
   61262.1 ACK  #9 ok 31ms
   61904.3 RX   notification 0bf669f4-45f2-11e7-9598-0800200c9a66 F0 D1 09 00 05 00 00 00 00 00 50 00 1F | EchelonFrameDecoder D1 cadence=80 checksum=ok
   61910.0 SCR  power="218" cadence="80" resistance="14" target-resistance="14"
   75012.6 NOTE "bike shows 82 rpm, resistance 14"
```

### Questions a recording answers

- **Does the bike send cadence at all?** Look for `RX` lines whose frame is `D1`. None means the
  bike never sent a workout frame: check that the `B0 01` start command (`TX`) was acknowledged.
- **Does it send cadence the app drops?** Look for `dropped:` on the `D1` lines, or a frame type
  the app does not know.
- **Is the wrong decoder reading it?** Compare `link` with the decoder named on the `RX` lines.
- **Does the bike take a target resistance?** Each `TX … | target-resistance=N` should have an
  `ACK … ok`, and a later `D2 resistance=N`. A `failed` or a missing `ACK` is a write the bike did
  not accept; a `D2` that never changes is a bike that ignored it.
- **Did the screen show what the bike sent?** Compare the `SCR` line after an `RX` line with the
  values decoded on it, and both with your `NOTE` and the capture.
