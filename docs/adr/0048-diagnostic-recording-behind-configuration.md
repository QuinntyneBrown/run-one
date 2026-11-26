# 0048. Diagnostic recording behind configuration

- **Status:** Accepted
- **Date:** 2026-11-23
- **Amends:** [0040](0040-four-screens-and-no-menus.md) ("No Diagnostics and no packet log": a record of the Bluetooth link comes back, in a narrower form and off by default)
- **Departs from:** `AGENTS.md`, *Frontend* ("Button-triggered editing opens a CDK Dialog"): the recording's dialog is the platform's `<dialog>` element, for the reason measured below

## Context

ADR 0040 removed Telo Ride's Diagnostics dialog, its packet log and the tap on both bike links,
and said what that cost: "A fault with a bike in the field can no longer be read from a packet
log; the console's Bluetooth errors are what is left." That fault has arrived. An Echelon EX-3
connects and does not report pedalling, and nothing in the app says what bytes it sent, what the
decoder made of them or what the screen showed. The console holds handled errors only, and
L2-115 AC2 keeps every Bluetooth message out of it.

L2-178 asks for a diagnostic recording that answers, for any moment of a ride: what bytes did the
bike send, what did the decoder make of them, what did the screen show, and what was the bike
really doing. It must be off for every rider, and it meets six rules of this repository head on:
no per-packet console line (L2-115 AC2), four screens and no menus (ADR 0040), nothing that grows
with the ride (L2-138 AC2), nothing sent anywhere (L2-131, L2-132, ADRs 0037 and 0043), nothing
added to the initial bundle (L2-136 AC1), and a dialog for anything a button edits (`AGENTS.md`).

## Decision

### What comes back from ADR 0040, and what does not

A recording of the Bluetooth link comes back: every byte in both directions, the link's events and
the logged errors, with what the app decoded beside the bytes. It is switched on by configuration
and is not part of the app a rider gets.

The Diagnostics dialog as Telo Ride had it does not come back: no screen or menu entry, no
connection history view, no packet list on screen, no build version or commit, no device check,
no viewer for a recording and no replay. The recording is read in the file the person diagnosing
saves.

### The switch: `diagnose` in the address, read once

- **Chosen: `?diagnose` in the address the app is opened at**, in production and development
  builds alike. `diagnosticsRequested()` in `ride`'s `diagnostics/diagnostic-switch.ts` is the one
  place that reads it, once, when the lazy parent route loads; a later navigation that drops the
  query keeps the recording, as `?simulate` keeps the simulator. It lasts for the visit: a reload
  without it is the plain app.
- *A build flag or a file replacement* (the simulator's way): rejected. The person with the bike
  that misbehaves uses the deployed app; they cannot be handed another build.
- *A setting kept in the browser's storage*: rejected. There is no settings screen to turn it off
  from (ADR 0040), and a recording that stays on by itself is the thing a rider must never get.
- *A key chord or a hidden gesture*: rejected. It cannot be put in a link, and a tablet beside the
  bike has no keyboard.

### The tap: one optional contract, called where bytes cross

- **Chosen: `BikeLinkTap` in `api`, bound to `BIKE_LINK_TAP` only when the recording is on.**
  The two connections hold `inject(BIKE_LINK_TAP, { optional: true })` and hand it to the write
  queue and the FTMS link they build; it is `null`
  for a rider, and calls it behind `?.`:
  - `GattWriteQueue` for every write of both links (initialisation, keepalive, resistance
    commands, FTMS control point commands): `writing()` when the write's turn comes, after its wait in the queue, and the
    function it returns when the write settles, with the error if it failed.
  - `WebBluetoothBikeConnection.onValue` for every notification either link's data
    characteristic sends, before `frames` emits it; `FtmsLink` for control point indications and
    the resistance range it reads.
  - `WebBluetoothBikeConnection` for the link's events: the chooser, the device, the services and
    their characteristics, the link chosen, each `ble` state, a drop and each reconnect attempt.
  - `SimulatedBikeConnection` for the frames it sends and the commands it is given, on the
    Echelon characteristics it plays.
- The default path pays one `null` check per message and holds no recording code.
- *Wrapping `BIKE_CONNECTION` in a recording decorator*: rejected. It sees `frames` and
  `setResistance` only: no keepalive, no initialisation, no FTMS control point, no failed write
  and no link event.
- *Subscribing to `frames`*: rejected for the same reason, and because a frame is recorded before
  the decoder sees it, not after.
- *Wrapping the browser's GATT objects in proxies*: rejected. It would sit between the app and
  Web Bluetooth and could change what it is there to observe.
- **Listing a service's characteristics is the one call the recording adds to the link.** With the
  tap bound, each service's `getCharacteristics()` is read and recorded before the link opens; a
  failure is recorded and changes nothing. A rider's app never makes the call.

### Decoded beside raw: the same decoder, chosen the same way

The recorder decodes each telemetry notification again with the pure decoder `BikeTelemetry`
uses, picked by the one function both call (`telemetryDecoder(kind)` in `protocol/`), so "which
decoder ran" is the app's own answer and not a second opinion. The frame's name and the reason a
frame was dropped are worked out in the recording's code (`frame-reading.ts`), so the decoders a
rider loads do not grow; a unit test holds the two together, frame by frame. The readouts Class
Ride shows are recorded from `ClassRideStore`, as the strings the screen draws.

The recording also says whether an Echelon frame's checksum holds. The app does not check an
incoming checksum (`docs/protocol/echelon-ble-frames.md`), and that is not changed; but a frame
the bike corrupted and a frame the app misreads look the same without it.

### The store: a ring in memory, 20,000 entries or 3,000,000 bytes

- **Chosen: `RecordingBuffer`, a ring of formatted lines.** Each entry is formatted to its line of
  ASCII text when it is made, so its size in bytes is the line's length and the limit is exact.
  Past 20,000 entries or 3,000,000 bytes the oldest lines go, and a count of the dropped entries
  is kept and written into the saved file. At the five entries a second an Echelon ride makes,
  that is the last hour: the 20-minute class three times over. Captures are held apart, at most
  8, the oldest dropped.
- *IndexedDB, or both*: rejected for now. A write for every Bluetooth message is work on the
  ride's path, and a recording kept in storage outlives the visit, which the switch says it does
  not. A recording lost with a crashed tab is the cost (L2, open question 33).
- *Structured entries formatted on saving*: rejected. Their size in memory can only be estimated,
  and L2-138 needs a limit that is exact.

### The console: not at all

The recording writes nothing to the console. L2-115 AC2 holds with the recording on as with it
off, and no file of the recording calls `console`. A logged error still goes to the console through
`ConsoleAppLogger`; `RecordingAppLogger` wraps it and adds the same redacted line to the
recording.

### Screen capture: the Screen Capture API, one still at a time

- **Chosen: `navigator.mediaDevices.getDisplayMedia()` with `preferCurrentTab`**, behind
  `ScreenCapture` in `api`, implemented by `BrowserScreenCapture` in `domain`'s `browser/`. One
  press asks the browser's own permission, draws one frame of the tab's video track to a canvas,
  keeps it as a PNG and stops the track at once.
- *Rasterising the page's DOM* (a library that redraws the document into a canvas): rejected.
  Class Ride's box holds a cross-origin YouTube frame, which a rasteriser cannot read, and a
  WebGL course canvas, which it reads as blank without `preserveDrawingBuffer`; the capture would
  miss the half of the screen that is not the readouts, and the library would be a dependency.
- *Holding the stream open between captures*: rejected. It would spare the second and later
  permission prompts, but a live tab capture is work for the whole ride on a low-power laptop, and
  a stream is one more thing to release. Continuous recording of the screen is out of scope.
- A refusal, a failure or a browser without the API (Chrome on Android) keeps nothing, says so,
  and leaves the ride alone. The readouts are in the recording as `SCR` entries either way.

### Saving: a download of a Blob, and no change to the policy

- **Chosen: an `<a download>` on an object URL**, behind `FileSaver` in `api`, implemented by
  `BrowserFileSaver` in `domain`'s `browser/`; the URL is revoked once the click is made. The
  recording is one `.log` file of text and each capture a `.png`.
- *The File System Access API (`showSaveFilePicker`)*: rejected. It is missing on Android, asks
  once for every file, and gives nothing a download does not.
- *A zip of everything*: rejected. It needs a library, and a text file a person can open is the
  point.
- The Content Security Policy in `staticwebapp.config.json` is not changed: nothing is fetched,
  and a download of a `blob:` URL is not a connection. No origin is added and nothing is uploaded.

### The controls: one mark and one dialog, and why the dialog is not the CDK's

- **Chosen: the recording mark and one dialog.** With the recording on, every screen shows a
  button that reads "Recording", fixed at the foot of the screen at the left. It is the mark that
  the recording is on, which a person whose bike's name and bytes are being held is owed, and the
  one way in. It opens the "Diagnostic recording" dialog: the note, **Capture screen**, what the
  files hold, **Save files**. No screen, route or menu is added, and with the recording off no
  screen changes by a pixel.
- *A row of buttons on each screen*: rejected. Class Ride does not scroll and has no room for
  them, and a note is button-triggered editing, which needs a dialog.
- *No control at all, with keys only*: rejected. A tablet has no keyboard, and the mark must be
  seen.
- **The dialog is the platform's `<dialog>` element, opened with `showModal()`, not the CDK
  Dialog.** `@angular/cdk` left the workspace with ADR 0043, as ADR 0040 said it would. Measured
  on this branch: a production build with `@angular/cdk/dialog` imported from one lazy chunk
  grows `main` from 243.05 kB to 250.95 kB raw, because the parts of `@angular/core` the CDK needs
  are bundled into the initial chunk whichever chunk asks for them. That is 7.9 kB (2.25 kB
  transferred) paid by every rider for a dialog none of them can open, and L2-178 AC1 and
  `AGENTS.md` put the initial bundle first. `<dialog>` with `showModal()` gives what the rule is
  there to protect, from the browser: the top layer, an inert page behind it, focus kept inside
  it, Escape to close, focus returned on closing and the `dialog` role. It is not a hand-rolled
  modal. The rule stands for every other dialog, and `AGENTS.md` now says so.
- **The mark is mounted from the recording's own chunk.** The first lazy route's providers gain
  an environment initializer, only when the recording is on, that creates `DiagnosticsHost` with
  the root component's `ViewContainerRef`. `AppShell` and `app.config.ts` are not changed, so the
  initial bundle holds no line of it.

### Where the code lives

`api` gains the contracts and tokens (`diagnostics/`). `domain` gains `diagnostics/recording/`
(the recorder, the buffer, the formatter, the frame reading, the recording logger) and
`browser/` gains the screen capture and the file saver. `components` gains the presentation: the
mark and the dialog's panel. `ride` gains `diagnostics/`, which holds the switch, the providers
and the host. No library is added: every part is reached only through
`import('./diagnostics/provide-diagnostics')`, which `ride.routes.ts` makes when the switch is on.

- **Entry points of its own.** Exported from `@telo/domain` and `@telo/components`, the
  recorder and the panel were bundled into a chunk every rider loads: the bundler places a file
  by every entry that can reach it, and the libraries' main entry points reach all they export.
  The acceptance test for "off" caught it. The recording's code is therefore exported only from
  `@telo/domain/diagnostics` and `@telo/components/diagnostics` (`tsconfig.json` paths), which
  only `ride`'s dynamically imported chunk imports; ESLint keeps every library from importing
  them. The code stays in the libraries the rules put it in.
- **The routes wait for the switch.** `rideRoutes` is a promise of the routes: opened with
  `?diagnose` it resolves once the recording's chunk is in and its providers are in the first
  route's injector, so the tap is bound before anything asks for the bike connection. Without
  `?diagnose` it is already resolved. `app.routes.ts`, in the initial bundle, is not changed.
- **The service worker does not keep it for riders.** The worker prefetches every script of the
  build, which would have downloaded the recording's chunk to every installed rider's device.
  The production build now names its lazy chunks (`namedChunks`), and `ngsw-config.json` leaves
  `provide-diagnostics-*.js` out of the prefetched group and lists it in a lazy group of its
  own: the worker fetches and keeps it only when a page opened with `?diagnose` asks for it.

## Consequences

- A rider's app fetches none of the recording's code, and its service worker keeps none. The
  initial chunk is 243.06 kB raw, from 243.05 kB (the first route is now awaited), and 79.25 kB
  gzipped with its stylesheet, as before; no budget in `angular.json` changed. With `?diagnose`,
  one more chunk is fetched: 21.68 kB raw, 6.81 kB transferred.
- The production build's lazy chunks carry their names (`class-ride-page-….js`), where they were
  `chunk-….js`. Nothing reads the names but the service worker's configuration.
- The link's code has a seam it did not have: `GattWriteQueue.enqueue` takes what is written
  beside the function that writes it, and `WebBluetoothBikeConnection` reports each `ble` state
  through one method. A new write or a new link event must call the tap, or the recording will
  not hold it.
- With the recording on, the link makes one more GATT call per service than a rider's does. A
  bike that fails only without that call would not be caught.
- A recording holds the bike's name and identifier, every byte it sent and, in a capture, the
  whole tab. It is on the device until the person saves it and gone when the tab closes. What is
  done with a saved file is the person's own business; the dialog says what it holds first.
- A reload, a crash or a closed tab loses a recording that was not saved.
- On a tablet there is no screen capture; the `SCR` entries stand in for it.
- The dialog is the app's only one and is not the CDK's. The next dialog a rider can open pays
  the CDK's cost in the initial bundle or makes the same departure with its own reason.
- `AGENTS.md` changes in three lines: the recording is named as the one thing behind
  configuration; the dialog rule names this exception; and "Bound what grows" names the recording.
