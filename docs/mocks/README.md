# Telo Run 1 mocks

Static HTML mocks of every Telo Run 1 screen, in every state. Telo Run 1 is Telo Ride 1 for
running: one class, start to finish, on a treadmill instead of a bike, with a runner in the same
Ibiza. The mocks copy the Magic Patterns OS prototype **"Telo Run 1"** (OS
`vnjsCrjBAfcZGnW9rHMoch`, prototype `pgrYab933NWX1NZCj29RWU`): the machine, the class, the copy,
the readouts, the numbers and the runner's pictures come from its five frames and the OS's
`shared/run1.ts` and `shared/machines.ts`. They are the source of truth for the UI (see
`AGENTS.md`).

The screens, their states, their layout and every block are Telo Ride 1's, and the
[design system](../design-system/README.md) is Ride 1's, unchanged but for one declaration (see
*The design system*). A state Ride 1's mocks drew that the Run 1 frames do not (intensity, the sound
of a run in Ibiza, the diagnostic recording, a treadmill that gives no control, the failures) is
drawn here with the treadmill in the bike's place, because Run 1 is Ride 1 in everything but the
machine.

| Screen | Frame | What it is |
|---|---|---|
| Connect Treadmill | `mbWi6D6VHDtdKNLsu4M9H3` | First run: pair the Echelon Stride-6s. |
| The Class | `1JwKsEMXXj7uubUgYGzHby` | Where the app opens: the class, its length, what to run it with, what the treadmill will do, and the one button. |
| Ibiza Flyover | `9bjdzEBVcTf1ZfAhnHG4hj` | Before a run in Ibiza: the course from above while it loads, landing on the grid. |
| Class Run | `tew2oXkpQRE4UidkmFEbgP` | The run, solo: the countdown, the class, the finish banner and the walk-off. Drawn in Ride 1's layout, not the frame's (see *Where the mocks depart*). |
| Class Done | `w75dDsZk5LixLaFFwJHJuv` | The distance in km, the facts and the 8 sprints. |
| Page not found | — | An addition, as in Ride 1. |
| Diagnostic recording | — | An addition, as in Ride 1, and no part of the runner's design: the dialog the recording mark opens, drawn over Class Run. |

The flow: a **new** runner opens on Connect Treadmill and lands on The Class once paired; a
**returning** runner opens on The Class. The Class → Ibiza Flyover (in Ibiza only) → Class Run
(countdown, the class, finish banner, walk-off) → Class Done → Done → The Class (now returning).

## What running changes

| Telo Ride 1 | Telo Run 1 | From |
|---|---|---|
| Connect Bike, `connect-bike` | Connect Treadmill, `connect-treadmill` | the frame's name |
| Class Ride, `class-ride`, `/ride` | Class Run, `class-run`, `/run` | the frame's name |
| rider, ride, "Ride with", "Ride it again" | runner, run, "Run it with", "Run it again" | The Class |
| Echelon EX-5s, `EX5S-0bf669f1` | Echelon Stride-6s, `STR6S-41c2e807` | `shared/machines.ts` |
| "Pedal once to wake it up…" | "Press Start on the console to wake it up. Telo Run 1 reads your stride and sets the belt speed for every sprint and recovery." | Connect Treadmill |
| the plan sets target resistance, levels 1 to 32 | the plan sets the belt speed, km/h, up to 20 | `shared/run1.ts` |
| Power (W) against a target, Cadence (rpm) | Stride (steps per minute) against a target, Pace (/km) with the km run | Class Run |
| the resistance stepper, "13 of 32" | the same stepper, reading the belt speed, "8.0 km/h" | Class Run's Speed readout |
| efforts | sprints | `IBIZA_RUN.effortName` |
| output in kJ, "New best output" | distance in km, "New best distance" | Class Done |
| Average (W), On target | Average pace (/km), On stride | Class Done |
| "Lost the bike… Pedal to wake the bike, then reconnect." | "Lost the treadmill. The class is paused and the belt has stopped. Press Start on the console, then reconnect." | Class Run |
| the roll-out: "Rolling on", "Easy spin.", resistance eased to 4 | the walk-off: "Walking it off", "Easy walk.", the belt slowed to 5 km/h | Class Run |
| states `no-bike`, `bike-lost`, `rolling-on*` | `no-treadmill`, `treadmill-lost`, `walking-off*` | — |

Class names in the HTML (`class-ride__clock`, `class-bike`, `class-resist`, `ride-with`,
`the-class__bike`, `class-done__watts`) are the design system's and are kept as they are.

## Where the mocks depart from the frames, and why

- **Class Run keeps Ride 1's layout.** The frame draws the course or the video edge to edge, with
  the readouts over it, call-outs as each part arrives ("Sprint 3", "Final sprint!", "Recover"), a
  "Skip to the final sprint" button and no stepper. The mocks draw the video's or the course's box
  above a panel of readouts, as Ride 1's mocks do and as the code this product starts from is
  built; the countdown, the finish banner and the walk-off lie inside the box. The frame's four
  readouts are all here: the segment and its time left, Speed (in the stepper), Stride and Pace.
- **The stepper.** The frame's Speed reads "Set by the plan" and has no buttons. Ride 1 lets the
  rider change the bike's level, so the mocks keep the stepper, reading the belt speed
  (open question 2).
- **Intensity, Sound, YouTube, the intensity question and the diagnostic recording** are not in
  the Run 1 frames. They are Ride 1's (ADRs 0048 and 0050) and are drawn as Ride 1 draws them. At
  7/10 the recovery's 8.0 km/h is set as 9.6 (open question 3).
- **The flyover's captions are the course's as built**, as in Ride 1: The waterfront, The Strip,
  The DJ terrace, The finale, The finish, with "every sprint climbs past the clubs". The frame
  still names a 3.2 km loop around Sant Antoni bay with a marina.
- **No made-up progress.** The frame's status steps through "loading the course", "setting warm-up
  speed" and so on by a timer; the mocks say "Echelon Stride-6s connected", then "Treadmill
  ready · lining up".
- **The runner is alone.** The frame's grid and final-sprint pictures show a field of other
  runners. A run is for one runner (ADR 0049), so the mocks use the frame's picture of the runner
  alone on the promenade wherever the course stands in, and its finish picture under the finish
  banner.
- **Class Done's default is a new best.** The frame's own args are 3.31 km against a best of
  3.34 km, which is `not-best` here. `default` is 3.36 km in gold, as Ride 1's default is its new
  best.
- **A treadmill that gives no control still reports its belt speed**, so in the `*-by-hand`
  states the stepper reads it with both buttons off, where Ride 1's reads "—". The notice reads
  "The class can't set this treadmill's speed. Set it on the console."
- **States the frames do not draw** (`needs-https`, `chooser-blocked`, `chooser-failed`,
  `video-unavailable`, `cannot-draw`, `cannot-load`, `not-saved`, `efforts-none`, `off-target`
  and the rest) are Ride 1's, reworded.

## The design system

`docs/design-system/` is Telo Ride 1's and is not rewritten: the tokens, the fonts, every
component and its page are the same files. One declaration changed:
`.class-done__chart` laid out 17 columns, Ride 1's 17 efforts; it now lays out
`var(--class-done-efforts, 17)`, and Class Done's mocks set `--class-done-efforts: 8`. Nothing
that Ride 1 draws changes. The design system's own pages still show the bike and Ride 1's copy.

## How to open

- Open [index.html](index.html) from disk. It is a gallery of every screen with a link to each state.
- Each mock has a mock bar at the bottom: its sibling states, a theme toggle and a × that hides
  the mock chrome. Links between mocks follow the prototype's wiring.
- Query parameters: `?theme=dark` (the default; the design is dark) or `?theme=light`, and
  `?chrome=0` to hide the mock bar and the notes. `t` toggles the theme.
- Yellow `.mock-note` callouts mark what a static page cannot show.
- Nothing loads from the network: the fonts live in the design system, and the pictures in
  `assets/images/` were downloaded from the prototype.

## Cast and catalog

The design's own data (`shared/machines.ts`, `shared/run1.ts` and the frames' args).

- **Runner:** one person on their own treadmill at home. **new**: has never paired; no runs.
  **returning**: 6 runs of the class, best distance 3.34 km, last time 3.29 km.
- **Treadmill:** *Echelon Stride-6s*, identifier `STR6S-41c2e807`, over Web Bluetooth. Works with:
  Echelon Stride-6s, Stride-8s, Stride Sport and Stride Auto-Fold (full control) and other FTMS
  smart treadmills (beta). `*-by-hand` is an FTMS treadmill, HORIZON 7.4AT 1A2B, that gives no
  control.
- **The class:** *20 Minute HIIT*, GCN Training, focus HIIT. "Eight 30-second sprints. The
  recoveries get shorter each round, and the class ends on the last sprint." Plan: a 4:00 warm-up
  at 10 km/h and 162 steps per minute; eight 0:30 sprints at 16 km/h (3:45 /km) and 182; seven
  recoveries of 2:30, 2:00, 2:00, 1:30, 1:30, 1:30 and 1:00 at 8 km/h and 154. 20:00 and about
  3.3 km in all. The video is `QUoToFsMNig`, synced at 1:12; its cover is
  `assets/images/classes/20-minute-hiit.jpg` (open question 5).
- **Mid-run moment:** 8:30 of 20:00, in the second recovery with 1:00 left (half done): the belt
  at 8.0 km/h, a stride of 155 against 154 (on target, within 4 %), a pace of 7:30 /km and
  1.40 km run. `off-target` is the same moment at 143: "-11 vs 154" in the warning colour.
- **The countdown:** the stepper reads the warm-up's 10.0 km/h, Stride reads "Aim 162", Pace
  "–:––" and 0.00 km run. The belt stands still until "Go!".
- **The finish:** 20:00 on the last sprint: 184 steps per minute, 3:45 /km, the belt slowing from
  16.0. Four seconds into the walk-off: 112, 12:00 /km, the belt at 5.0.
- **Finished run:** 20:00, 3.36 km (a new best over 3.34), 5:57 /km on average, 84% on stride;
  the 8 sprints at 180, 183, 182, 181, 184, 182, 179 and 186 steps per minute, the last the
  strongest. Short of the best (the frame's args): 3.31 km, 6:03 /km, and 178, 181, 180, 179,
  182, 180, 177 and 184.

## Layout of this folder

```
manifest.json          every screen, state and requirement ID (the checker and gallery read it)
index.html             gallery (generated)
assets/tokens.css      a one-line shim importing ../design-system/tokens/tokens.css
assets/images/         the treadmill, the class cover, the course from above, the runner on the promenade and at the finish
assets/mock.css, mock.js   mock bar and notes (not product UI)
pages/<id>/<state>.html
dialogs/<id>/<state>.html   the diagnostic recording, drawn open over Class Run
```

## Re-check and re-screenshot

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write   # regenerates index.html and the coverage table
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks       # PNGs at 360/768/1280, light and dark, into docs/mocks/.cache/
```

The checker reports no errors. Its 63 warnings are Ride 1's: a state's `mock:requirements` names
the requirements that state serves, fewer than its screen's.

## Open questions

None of these is settled by the mocks. Each needs the owner before `docs/specs/` is rewritten.

1. **Where the stride comes from.** The design shows steps per minute and scores "On stride" and
   the 8 sprints by it. A treadmill's FTMS Treadmill Data carries speed, distance and incline, not
   cadence; whether the Echelon Stride reports it is not known here. Without it the app needs a
   foot pod or a watch (the Running Speed and Cadence service), or other readouts.
2. **May the runner change the belt speed from the app?** The frame has no stepper; Ride 1 has
   one. The mocks keep it.
3. **What a notch of intensity is.** Ride 1's is 10 % of the plan's level. At 10 % of the plan's
   speed, 10/10 asks for 24 km/h on a sprint, past the treadmill's 20, and 0/10 halves a walk.
4. **The belt and safety.** "The belt has stopped" when the link drops is the frame's wording and
   an assumption about the hardware (Telo Ride's ADR 0010 made the same one and required a person
   to check it on the machine). So are a belt that stands still through the countdown and then
   comes up about 1 km/h a second, and one that slows by itself to a walk at the finish. Pause
   says nothing yet of what the belt does.
5. **The class video.** The prototype's video is Ride 1's cycling class from GCN, a placeholder
   until a treadmill class is chosen. The cover in the mocks is that video's, and reads
   "30 Minute HIIT Session".
6. **The treadmill's name.** "Echelon Stride-6s" and the other three models are the prototype's,
   and the prototype says the name is made up.
7. **A number to beat.** The plan sets the belt, so every run of the class covers about 3.3 km;
   the cast's 3.29, 3.31, 3.34 and 3.36 km differ only by the stepper, the intensity and the
   ramps. Distance may be a weak thing to ask a runner to beat.
8. **The course's length.** The course as built is 8.4 km for a bike's 20 minutes. A runner covers
   3.3 km. Whether the runner runs the whole course at a scaled speed or the first 3.3 km of it
   is not decided; "Run the Strip at sunset", under Ibiza Sunset Strip on The Class, replaces
   Ride 1's "8.4 km · 159 m of climbing" until it is.
9. **Requirement IDs.** The `L2-…` IDs in the mocks and the manifest are Telo Ride 1's, and
   `docs/specs/L2.md` still describes the bike. The specs are to be rewritten from these mocks.
10. **Light theme.** As in Ride 1, the design is dark only; the design system's light theme applies.

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | searching | pairing | paired | bluetooth-off | unsupported-browser | needs-https | chooser-blocked | chooser-failed | recording | returning | no-treadmill | ibiza | video-unavailable | cannot-draw | needs-chromium | link-copied | cannot-load | landed | treadmill-lost | intensity | countdown | paused | ibiza-intensity | ibiza-sound | ibiza-youtube | ibiza-youtube-class | ibiza-youtube-audio | ibiza-youtube-unavailable | countdown-ibiza | go-ibiza | ibiza-loading | ibiza-unavailable | ibiza-music-off | ibiza-music-unavailable | paused-ibiza | off-target | by-hand | video-unavailable-by-hand | disconnected | disconnected-ibiza | countdown-disconnected | finish | finish-ibiza | walking-off | walking-off-ibiza | finish-by-hand | walking-off-by-hand | first | not-best | efforts-none | not-saved | intensity-kept | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Connect Treadmill (`connect-treadmill`) | [✅](pages/connect-treadmill/default.html) | ➖ | ➖ | ➖ | [✅](pages/connect-treadmill/searching.html) | [✅](pages/connect-treadmill/pairing.html) | [✅](pages/connect-treadmill/paired.html) | [✅](pages/connect-treadmill/bluetooth-off.html) | [✅](pages/connect-treadmill/unsupported-browser.html) | [✅](pages/connect-treadmill/needs-https.html) | [✅](pages/connect-treadmill/chooser-blocked.html) | [✅](pages/connect-treadmill/chooser-failed.html) | [✅](pages/connect-treadmill/recording.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-007`, `L2-008`, `L2-009`, `L2-011`, `L2-012`, `L2-013`, `L2-014`, `L2-018`, `L2-178` |
| The Class (`the-class`) | [✅](pages/the-class/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/the-class/needs-https.html) |  |  | [✅](pages/the-class/recording.html) | [✅](pages/the-class/returning.html) | [✅](pages/the-class/no-treadmill.html) | [✅](pages/the-class/ibiza.html) | [✅](pages/the-class/video-unavailable.html) | [✅](pages/the-class/cannot-draw.html) | [✅](pages/the-class/needs-chromium.html) | [✅](pages/the-class/link-copied.html) | [✅](pages/the-class/cannot-load.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-008`, `L2-009`, `L2-010`, `L2-019`, `L2-080`, `L2-084`, `L2-144`, `L2-173`, `L2-178` |
| Ibiza Flyover (`ibiza-flyover`) | [✅](pages/ibiza-flyover/default.html) | [✅](pages/ibiza-flyover/loading.html) | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/ibiza-flyover/recording.html) |  |  |  |  |  |  |  |  | [✅](pages/ibiza-flyover/landed.html) | [✅](pages/ibiza-flyover/treadmill-lost.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-175`, `L2-178`, `L2-179` |
| Class Run (`class-run`) | [✅](pages/class-run/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/class-run/recording.html) |  |  | [✅](pages/class-run/ibiza.html) | [✅](pages/class-run/video-unavailable.html) |  |  |  |  |  |  | [✅](pages/class-run/intensity.html) | [✅](pages/class-run/countdown.html) | [✅](pages/class-run/paused.html) | [✅](pages/class-run/ibiza-intensity.html) | [✅](pages/class-run/ibiza-sound.html) | [✅](pages/class-run/ibiza-youtube.html) | [✅](pages/class-run/ibiza-youtube-class.html) | [✅](pages/class-run/ibiza-youtube-audio.html) | [✅](pages/class-run/ibiza-youtube-unavailable.html) | [✅](pages/class-run/countdown-ibiza.html) | [✅](pages/class-run/go-ibiza.html) | [✅](pages/class-run/ibiza-loading.html) | [✅](pages/class-run/ibiza-unavailable.html) | [✅](pages/class-run/ibiza-music-off.html) | [✅](pages/class-run/ibiza-music-unavailable.html) | [✅](pages/class-run/paused-ibiza.html) | [✅](pages/class-run/off-target.html) | [✅](pages/class-run/by-hand.html) | [✅](pages/class-run/video-unavailable-by-hand.html) | [✅](pages/class-run/disconnected.html) | [✅](pages/class-run/disconnected-ibiza.html) | [✅](pages/class-run/countdown-disconnected.html) | [✅](pages/class-run/finish.html) | [✅](pages/class-run/finish-ibiza.html) | [✅](pages/class-run/walking-off.html) | [✅](pages/class-run/walking-off-ibiza.html) | [✅](pages/class-run/finish-by-hand.html) | [✅](pages/class-run/walking-off-by-hand.html) |  |  |  |  |  | `L2-014`, `L2-023`, `L2-026`, `L2-027`, `L2-028`, `L2-087`, `L2-088`, `L2-089`, `L2-091`, `L2-092`, `L2-093`, `L2-135`, `L2-173`, `L2-174`, `L2-175`, `L2-178`, `L2-180`, `L2-181`, `L2-182`, `L2-183`, `L2-185`, `L2-186` |
| Class Done (`class-done`) | [✅](pages/class-done/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/class-done/recording.html) |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-done/intensity.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-done/first.html) | [✅](pages/class-done/not-best.html) | [✅](pages/class-done/efforts-none.html) | [✅](pages/class-done/not-saved.html) | [✅](pages/class-done/intensity-kept.html) | `L2-077`, `L2-078`, `L2-079`, `L2-184`, `L2-178` |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-145` |

### Dialogs

| Screen | default | busy | invalid | note-ready | note-added | capturing | capture-kept | capture-refused | capture-unsupported | saved | save-failed | limit-reached | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Diagnostic recording (`diagnostic-recording`) | [✅](dialogs/diagnostic-recording/default.html) | ➖ | ➖ | [✅](dialogs/diagnostic-recording/note-ready.html) | [✅](dialogs/diagnostic-recording/note-added.html) | [✅](dialogs/diagnostic-recording/capturing.html) | [✅](dialogs/diagnostic-recording/capture-kept.html) | [✅](dialogs/diagnostic-recording/capture-refused.html) | [✅](dialogs/diagnostic-recording/capture-unsupported.html) | [✅](dialogs/diagnostic-recording/saved.html) | [✅](dialogs/diagnostic-recording/save-failed.html) | [✅](dialogs/diagnostic-recording/limit-reached.html) | `L2-178` |

<!-- coverage:end -->
