# Telo Ride 1 mocks

Static HTML mocks of every Telo Ride 1 screen, in every state the design draws. They copy the Magic
Patterns OS prototype **"Telo Ride 1"** (OS `vnjsCrjBAfcZGnW9rHMoch`, prototype
`26KV6fJjK53f6bW6xiGNjP`). Layout, spacing, type, colour, copy and numbers come from the
prototype's five frames and the OS's `shared/` code; each state is a frame drawn with the args the
prototype passes it. They are the source of truth for the UI (see `AGENTS.md`).

Telo Ride 1 is one class, start to finish: pair the bike, ride *Intervals to the Beat* (GCN Training)
along to its video while the plan sets resistance, and see your output. There is no Home, Race, class
library, Profile or sign-in in this design. The set replaces the earlier mocks of the larger
**"Ride"** prototype (`f5zb7cLTQFMdzC5JcFyupj`, in the same OS); they are in git history.

| Screen | Frame | What it is |
|---|---|---|
| Connect Bike | `v5ssJFYbW1uP99Fy2dbgW9` | First run: pair the Echelon. The same frame as Ride's Connect Bike, branded Ride 1. |
| The Class | `ptsPeNsftV4aApQQjN1LQX` | Where the app opens: the class, its length, how to ride it, what the bike will do, and the one button. |
| Ibiza Flyover | `2b7QoPtdWBQRkuFtnCJLSA` | Before a ride in Ibiza: the course from above while it loads, landing on the grid (L2-179). |
| Class Ride | `aoEFCcdCfGyw78yfGMkVPr` | The ride, solo: the countdown, the class, the finish banner and the roll-out. Drawn as built, not as the frame's newest layout (see *The shape of a ride*). |
| Class Done | `6eiQRDcbF5DL67X51aRw3D` | The output in kJ, the facts and the 17 efforts. |
| Page not found | — | An addition: the design has none (L2-145). |
| Diagnostic recording | — | An addition, and no part of the rider’s design: the dialog the recording mark opens, drawn over Class Ride (L2-178). |

These mocks are the source of truth for the UI. `docs/specs/`, the ADRs (0049 for the shape of a
ride) and `docs/detailed-designs/` follow them; where the prototype and the mocks disagree, the
mocks stand.

The prototype's flow: a **new** rider opens on Connect Bike and lands on The Class once paired; a
**returning** rider opens on The Class. The Class → Ibiza Flyover (in Ibiza only) → Class Ride
(countdown, the class, finish banner, roll-out) → Class Done → Done → The Class (now returning). The OS also holds a canvas, *The Class · Form Factors* (`f63HnRzoU7dNKbsvUoH3eZ`), that
draws The Class at 11" tablet landscape (1194 × 834), desktop (1440 × 900), tablet portrait
(834 × 1194) and phone (390 × 844); the mocks follow it.

## The shape of a ride

The thread *Ride 1 Class Flow* redrew the prototype so that a ride runs like a race against nobody:
a flyover, a countdown, the class, a finish banner, and a roll-out while the bike eases off
(L2-179 to L2-182). The mocks take those five things from it and nothing else.

- **Ibiza Flyover** (`pages/ibiza-flyover/*`, block `ibiza-flyover`): a bar (the wordmark, **Skip
  flyover**, Cancel), the course from above, and a band (the course's name, a caption, the bike).
  `default` is two seconds into the flight, `loading` is before the course can be drawn, `landed`
  is the camera on the grid, and `bike-lost` is the bike gone during the flight.
- **Countdown** (`class-ride/countdown`, `countdown-ibiza`, `go-ibiza`; block `class-countdown`):
  three lights, the numeral and "The plan sets your resistance. Just pedal.", over the video's or
  the course's box. "3" has no light lit, "2" one, "1" two, and "Go!" all three in the accent.
- **Finish banner** (`class-ride/finish`, `finish-ibiza`; block `finish-banner`): "Finish!" and
  "351 kJ output · 20:00" on a band with a chequered edge, across the box.
- **Roll-out** (`class-ride/rolling-on`, `rolling-on-ibiza`; block `class-rollout`): a card at the
  foot of the box, with resistance eased to 4 of 32 and the stepper off.

Where these depart from the frames, and why:

- **Class Ride keeps its layout.** The frame now draws the video or the course edge to edge with
  the readouts over it and no stepper. The mocks draw the new moments inside the video's or the
  course's box, above the bike panel as built (L2.md, open question 39). The frame's effort
  call-outs ("Drop 4", "Final drop!", "Recover") and its "Skip to the final drop" are not drawn.
- **The class and the course are the product's.** The frame's class is "20 Minute HIIT" on "one
  3.2 km loop"; the mocks show Intervals to the Beat, which ends on a cool-down at level 11, and
  the flyover's captions were rewritten from the course as built (open question 40).
- **The view from above is the design's target still**
  (`assets/images/courses/ibiza-sunset-strip-from-above.jpg`, from the canvas *Ibiza Sunset
  Strip*). It shows a loop and a marina the built course does not have, and stands in until the
  app can supply its own picture. The grid, the finish and the roll-out use the solo ride's still.
- **No made-up progress.** The frame's status steps through "loading the course", "setting warm-up
  resistance", "laying the road from your plan", "filling the grid" and "nearly there" on a timer.
  The mocks say only what is true: "Echelon EX-5s connected", then "Bike ready · lining up".
- **The band is not laid over the course.** The frame letterboxes the picture with bars drawn on
  top of it; the mocks give the bar and the band rows of their own, so the course is never hidden.
- **Touch targets.** **Skip flyover** and Cancel are 44 px, not the frame's 40 px.
- **The finish banner's output** is the deep signal orange on the light band, for 3:1 contrast
  (L2-181 AC9); the frame's orange on bone falls short of it.
- **The roll-out card has no second resistance readout.** The frame shows "Resistance · Eased
  off" beside the card because it has no stepper; here the stepper under the box shows it.
- **Numbers.** The finish is the cast's 351 kJ at 20:00 (the frame reads 19:59); 187 W at 83 rpm
  and level 11 as the banner shows, 82 W at 70 rpm and level 4 four seconds into the roll-out,
  by L2-023's formula.

The four new blocks have component pages in `../design-system/components/` (`ibiza-flyover`,
`countdown`, `finish-banner` and `roll-out`); their styles are in
`../design-system/assets/components.css`.

## Intensity and the sound of a ride in Ibiza

Not in the prototype: the owner asked for them after riding Ibiza (ADR 0050, L2-183 to L2-186),
and the mocks draw them in the prototype's own parts.

- **Intensity** (block `class-intensity`): on the left edge of the video's or the course's box on
  every Class Ride state, like a volume control: "Intensity", "5/10", **+**, a range input standing
  up and **−**; a row, − 7/10 +, with no slider, on a phone (`class-ride/intensity`,
  `ibiza-intensity`). Off wherever the stepper is.
- **Sound** (`class-course__sound`, block `class-sound`): the "Music" toggle becomes Sound in the
  course box's top-left corner, opening a panel of two radio groups (`ibiza-sound`,
  `ibiza-youtube-class`); `ibiza-music-off` and `ibiza-music-unavailable` are its No music and its
  Music that cannot play.
- **YouTube** (`class-course__inset`): the chosen video in a 16:9 inset in the top-right corner,
  a step further from the right edge than from the top (`ibiza-youtube`, `ibiza-youtube-class`);
  hidden for YouTube audio (`ibiza-youtube-audio`); a dark inset and a notice when it cannot play
  (`ibiza-youtube-unavailable`). A class cover stands in for the default video, whose own cover was
  not to hand.
- **The intensity question** on Class Done (`class-done__end`, `class-done__intensity`): asked above
  **Done**, and beside it from lg so the screen still fits (`class-done/intensity`,
  `intensity-kept`).

## The diagnostic recording

The diagnostic recording (L2-178, ADR 0048) is a diagnostic aid that is off for every rider. It is drawn in
`dialogs/diagnostic-recording/*` (the dialog and each of its states, open over Class Ride) and in the
`recording` state of four of the five screens (`pages/connect-bike/recording`, `pages/the-class/recording`,
`pages/class-ride/recording`, `pages/class-done/recording`): that screen’s `default` with the recording mark
added and nothing else changed. On Ibiza Flyover it stands above the band, on the bottom-left corner of the course (`diagnostic-mark--on-ibiza-flyover`). **Every other mock is the app with the recording off and is unchanged**; with
the recording off no screen differs by a pixel. The Magic Patterns prototype has none of these: the
recording is no part of the rider’s design.

- **The recording mark** (`diagnostic-mark`) is a button that reads “Recording”, a dot and the word, 44 px
  tall, fixed at the foot of the screen at the left, 12 px in and above the home bar. On The Class it stands
  above the pinned start button below 1024 px and above “What the bike will do” from 1024 px
  (`diagnostic-mark--on-the-class`); on Class Ride in a landscape window from 768 px, where the foot of the
  screen is the bike panel, it stands above the panel on the video’s bottom-left corner
  (`diagnostic-mark--on-class-ride`). While a screen capture is taken it reads “Capturing…” with a turning
  ring (`diagnostic-mark--busy`, `aria-busy`).
- **The dialog** is the platform’s `<dialog>` element (`diagnostic-dialog`), which the app opens with
  `showModal()`; the mocks draw it with the `open` attribute so the mock bar stays in reach, and `mock.css`
  stands in for the top layer and the backdrop. It is a sheet at the foot of the screen below 640 px and a
  centred card 448 px wide from 640 px, and holds one block, `diagnostic-panel`.
- **Its numbers** are placeholders: 1,284 entries since 18:00, the note “bike shows 82 rpm, resistance 14”,
  screen capture 1, three saved files, and 4,312 entries dropped at the limit of 20,000. The copy in quotes
  is L2-178’s, word for word.
- On a mock with the mark the mock bar is at the top of the window, so it never lies over the mark.

## How to open

- Open [index.html](index.html) from disk. It is a gallery of every screen with a link to each state.
- Each mock has a mock bar at the bottom: its sibling states, a theme toggle and a × that hides
  the mock chrome. Links between mocks follow the prototype's wiring, so you can click through
  the product.
- Query parameters: `?theme=dark` (the default; the design is dark) or `?theme=light`, and
  `?chrome=0` to hide the mock bar and the notes. `t` toggles the theme.
- Yellow `.mock-note` callouts mark what a static page cannot show: the video, the ticking clock,
  pairing's timing and the efforts rising on Class Done.
- Nothing loads from the network: fonts (Inter Tight, Barlow Condensed, JetBrains Mono, all OFL)
  live in the design system (`../design-system/assets/fonts/`); the bike photo and the class cover
  are in `assets/images/`.
- The mocks consume the [design system](../design-system/README.md): every page links
  `../design-system/tokens/tokens.css` and `../design-system/assets/components.css`. Add or change a
  component there, never in a mock.

## Cast and catalog

Every mock uses this cast, which is the design's own data (`shared/machines.ts`,
`shared/videoWorkouts.ts`, `shared/workout.ts`, and the frames' args).

- **Rider:** one person on their own bike at home, in one of two stages (the prototype's `rider`
  control):
  - **new**: has never paired; no rides.
  - **returning**: 6 rides of the class, best output 342 kJ, last time 318 kJ.
- **Bike:** *Echelon EX-5s*, identifier `EX5S-0bf669f1`, strong signal, over Web Bluetooth. Works
  with: EX-5s, EX-3, EX-8s, Connect Sport (full control) and other FTMS smart bikes (beta).
- **The class:** *Intervals to the Beat* by GCN Training, focus Intervals, video `il_OFz6o42I`
  synced at 0:03. "Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast
  sprints to finish." Plan (L2-080 AC2): 33 segments, 2:30 warm-up at level 14; 17 efforts of 0:15
  to 1:15 at levels 19 to 24, the last five sprints of 0:20 at 110 rpm, with recoveries of 0:20 to
  1:00 at levels 11 to 14; 2:30 cool-down at level 11. 20:00 in all, about 254 W on average. The
  Class's mocks draw it (slice 30.3), and so do Class Ride's (slice 31.1) and Class Done's
  (slices 32.2 and 32.4). No mock draws the prototype's *30 Minute HIIT Cardio* or *20 Minute
  HIIT*.
- **Mid-ride moment:** 5:30 of 20:00, in the second recovery with 0:30 left (half done); 233 W against
  a 231 W target (on target), 91 rpm aiming 90, resistance 13 of 32, as L2-023's formula gives them
  (slice 31.1). The prototype's moment was 7:00 of 30:00 with 108 W against 107 W. `off-target`, which
  the design does not draw, is the same moment at 75 rpm: 192 W, "-39 W" in the warning colour. In
  a landscape window from md Class Ride does not scroll (L2-087 AC5); the prototype's layout began
  at lg, and the stylesheet was brought in line with L2.
- **A ride short of something** (slice 31.3; the design draws neither): `video-unavailable` is the same
  moment with the class video unable to play, the notice “The video can’t play. The bike will still
  follow the class.” under the cover. `by-hand` is the moment on an FTMS bike (KICKR BIKE 1A2B) that
  gives no control of its resistance: it reports 233 W and 91 rpm and no level, so the stepper reads
  “—” with both buttons disabled, and the notice “The class can’t set this bike’s resistance. Set it
  by hand.” stands under the bike panel. `video-unavailable-by-hand` is both. Each notice is an
  `inline-message--warn` with `role="status"`, 8 px under what it speaks of.
- **Finished ride:** 20:00, 351 kJ (a new best over 342), 293 W average, 84% on target; the 17
  efforts 407, 380, 398, 378, 369, 359, 349, 417, 427 (the strongest), 420, 400, 390, 380, 370,
  360, 350 and 340 W. Short of the best: 318 kJ, 265 W average, efforts from 299 to 376 W, the
  ninth again the strongest. `efforts-none` is the new best with every effort at 0 W, and
  `not-saved` is the new best with "This ride could not be saved on this device. Your result is
  above." under the facts (L2-168 AC4).

## Layout of this folder

```
manifest.json          every screen, state and requirement ID (the checker and gallery read it)
index.html             gallery (generated)
assets/tokens.css      a one-line shim importing ../design-system/tokens/tokens.css (the gallery links it)
assets/images/         the bike photo and the class cover
assets/mock.css, mock.js   mock bar and notes (not product UI)
pages/<id>/<state>.html
dialogs/<id>/<state>.html   a dialog, drawn open over its page (the diagnostic recording)
```

## Re-check and re-screenshot

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write   # regenerates index.html and the coverage table
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks       # PNGs at 360/768/1280, light and dark, into docs/mocks/.cache/
```

## Open questions

Each of these is a place where the design, `docs/specs/` or `AGENTS.md` disagreed, or where the
design says nothing. None was settled quietly. Those marked closed are kept for their numbers.

1. **Product scope against the direction.** Closed. Telo Ride 1 is a product of its own: one
   class, five screens, no racing, progression, maps or sign-in (`AGENTS.md`, ADRs 0036 to 0043
   and 0049). The specs, the journeys and the code were rewritten for it.
2. **Requirements no longer match.** Closed. `docs/specs/L2.md` is rewritten for these mocks, and
   the IDs in `manifest.json` are its own. The routes are `/connect`, `/`, `/ride` (Ibiza
   Flyover, then Class Ride) and `/done`; pairing lands on The Class, and the 404 goes back to
   the class.
3. **Spec copy the design does not use.** Closed for Connect Bike by slice 29.1: the design showed
   "Strong signal · EX5S-0bf669f1" before Pair, which a browser cannot supply. The mock's `default`
   now names the offered model alone, and `pairing` and `paired` show the identifier of the bike
   the rider picked, with no signal strength (L2-011 AC3, L2's open question 17). L2-092
   AC4's solo text is "Your ride is paused. Pedal to wake the bike and it carries on from here."; the
   design says "The video is paused. Pedal to wake the bike, then reconnect." The earlier mocks'
   hint ("Not in the list? Close the Echelon app…") is not in the design.
4. **Where rides go.** Closed by ADRs 0037 and 0039: there is no sign-in and no backend. The ride
   count, the best and the last output stay on the device, and Class Done has `not-saved` for a
   record that cannot be written.
5. **HTTPS on Connect Bike.** Closed by slice 29.2. The prototype maps every unsupported browser,
   plain http included, to Connect Bike's "This browser can't reach the bike", whose copy is about
   Chrome and Edge, so a new rider on http was told to change browser. L2-009 AC4 stands: Connect
   Bike has its own `needs-https` state, the same alert with a lock, "Open the secure version of
   this page" and **Open over HTTPS**. The same slice drew `chooser-blocked` and `chooser-failed`
   (L2-012 AC4), which the prototype does not draw either.
6. **Unreachable or frame-only states.** `connect-bike/searching` is reachable only through the
   frame's controls (the prototype starts at "found"). A new rider whose browser is unsupported can
   never leave Connect Bike, so The Class's banners are drawn for a returning rider, as the Form
   Factors canvas draws them. A first-time rider is never without a bike on The Class.
7. **The ride starts at 0:00.** A ride starts at 0:00 on "Go!" (`class-ride/countdown`,
   `go-ibiza`). The mid-ride mocks freeze it at 5:30, the cast's moment.
8. **Class Done's numbers.** Closed by slices 32.2 to 32.5. The frame's args gave 30:12 for a
   30:00 plan, a fixed 84% and an output of 0.19 × seconds. The mocks draw 20:00, 351 kJ and
   293 W, which L2-078's rules give, and 318 kJ for `not-best`; "84%" is still the cast's number.
9. **Light theme.** The design is dark only. The design system's light theme (paper, white panels,
   deeper accent text) applies; the design never draws it.
10. **Finish.** The Class Ride frame has a "Finish" button ("Skip to the end (prototype only)").
    L2-087 AC3 keeps it out of production, so the mocks leave it out; a note links to Class Done.

### Where the mocks depart from the design's source, and why

- **Frozen moments.** The class ride is frozen at 5:30 with every number computed by L2-023's
  formula. The YouTube players are the class cover in the player's box; the plan
  chart is inline SVG from the same data.
- **The Class in an unsupported browser shows "No bike".** The prototype keeps a returning rider's
  bike "connected" in a browser that cannot use Web Bluetooth, which cannot happen. `needs-chromium`
  and `needs-https` show "No bike · Connect" and a disabled "Connect your bike".
- **Phone overflow fixed.** On a phone the frame squeezes a returning rider's three stats (Rides, Best
  output, Last time) into the row beside "20:00", where they overlap; they wrap under it instead.
  Nothing changes at tablet and desktop widths.
- **Accessibility.** Class Ride has a visually hidden `<h1>`; Class Done's verdict line is its
  `<h1>`; the strongest effort says so in text, not only in orange. On phones the header's "· Change"
  is hidden from sight but still read, so the bike link says what it does. The header bike link is
  44 px tall for touch.
- **Additions.** `pages/not-found` (the design has none). In the design system: the `the-class` and
  `class-done` blocks and the tokens `--font-size-score`, `--font-size-score-lg`,
  `--line-height-display`, `--duration-stagger`, `--the-class-aside-width(-xl)`,
  `--class-done-chart-height` and `--class-done-action-width`.
- **The Class after the prototype (slice 30.2).** The prototype was drawn for 30 Minute HIIT Cardio
  and has no Ibiza. On The Class the mocks now follow `docs/specs/L2.md`: the title, the summary,
  "GCN Training · Intervals", 20:00 and the video `il_OFz6o42I` parked at 0:03 are Intervals to the
  Beat's (L2-080, L2-084), and every state with a body draws **Ride with** (L2-173), the radio group
  between the summary and the length, in the new design-system block `ride-with`. Three states are
  new: `ibiza` (the course's still in the video's box), `video-unavailable` (the cover alone,
  L2-084 AC9) and `cannot-draw` (Ibiza disabled, L2-173 AC6). Slice 30.3 brought the rest in line:
  the cover is the video's own (`assets/images/classes/intervals-to-the-beat.jpg`), and "What the
  bike will do" reads "~254 W average", draws the plan's 33 segments in a 1200-second box, each bar
  as wide as its segment lasts and as tall as its level against the highest (24), and ends "17
  efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal." (L2-084 AC2). Slice 30.6 added `link-copied`: `needs-chromium` just after Copy link was pressed, the button reading "Copied" with a check (`data-copied`), as the design system's alert page gives the state (L2-008 AC3). Slice 31.2 drew Class Ride paused and with the bike lost in Ibiza (`class-ride/paused-ibiza`, `disconnected-ibiza`: the alert reads "The ride is paused.") and raised the header above the lost-bike alert in `class-ride/disconnected`, so Leave stays in reach (L2-092 AC2). Slice 37.1 drew a ride in Ibiza: `class-ride/ibiza`, the course in the video's box in the new design-system block `class-course`, with no video (L2-174 AC1), and `class-ride/ibiza-loading`, the box reading "Loading Ibiza Sunset Strip" (`role="status"`) over the course's still two seconds into the ride (L2-175 AC1). The still (`assets/images/courses/ibiza-sunset-strip.jpg`) is now one of the solo ride, taken from the running app, with the rider alone; in the mocks it also stands in for the canvas. Slice 37.4 drew `class-ride/ibiza-unavailable`: a ride in Ibiza whose course cannot be drawn, the still left in the box without “Loading Ibiza Sunset Strip” and the notice “Ibiza can’t be drawn. The bike will still follow the class.” under it (`class-course__notice`, as the class video’s notice stands under its box; L2-175 AC2). Slice 37.6 drew the “Music” toggle in the top-right corner of the course’s box in every Ibiza mock (`class-course__music`, a 44 px `btn--raised`, `aria-pressed`), and two states: `class-ride/ibiza-music-off` (not pressed, a stroke through the note) and `class-ride/ibiza-music-unavailable` (disabled, with no alert; L2-176 AC5, AC7).

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | searching | pairing | paired | bluetooth-off | unsupported-browser | needs-https | chooser-blocked | chooser-failed | recording | returning | no-bike | ibiza | video-unavailable | cannot-draw | needs-chromium | link-copied | cannot-load | landed | bike-lost | intensity | countdown | paused | ibiza-intensity | ibiza-sound | ibiza-youtube | ibiza-youtube-class | ibiza-youtube-audio | ibiza-youtube-unavailable | countdown-ibiza | go-ibiza | ibiza-loading | ibiza-unavailable | ibiza-music-off | ibiza-music-unavailable | paused-ibiza | off-target | by-hand | video-unavailable-by-hand | disconnected | disconnected-ibiza | countdown-disconnected | finish | finish-ibiza | rolling-on | rolling-on-ibiza | finish-by-hand | rolling-on-by-hand | first | not-best | efforts-none | not-saved | intensity-kept | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Connect Bike (`connect-bike`) | [✅](pages/connect-bike/default.html) | ➖ | ➖ | ➖ | [✅](pages/connect-bike/searching.html) | [✅](pages/connect-bike/pairing.html) | [✅](pages/connect-bike/paired.html) | [✅](pages/connect-bike/bluetooth-off.html) | [✅](pages/connect-bike/unsupported-browser.html) | [✅](pages/connect-bike/needs-https.html) | [✅](pages/connect-bike/chooser-blocked.html) | [✅](pages/connect-bike/chooser-failed.html) | [✅](pages/connect-bike/recording.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-007`, `L2-008`, `L2-009`, `L2-011`, `L2-012`, `L2-013`, `L2-014`, `L2-018`, `L2-178` |
| The Class (`the-class`) | [✅](pages/the-class/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/the-class/needs-https.html) |  |  | [✅](pages/the-class/recording.html) | [✅](pages/the-class/returning.html) | [✅](pages/the-class/no-bike.html) | [✅](pages/the-class/ibiza.html) | [✅](pages/the-class/video-unavailable.html) | [✅](pages/the-class/cannot-draw.html) | [✅](pages/the-class/needs-chromium.html) | [✅](pages/the-class/link-copied.html) | [✅](pages/the-class/cannot-load.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-008`, `L2-009`, `L2-010`, `L2-019`, `L2-080`, `L2-084`, `L2-144`, `L2-173`, `L2-178` |
| Ibiza Flyover (`ibiza-flyover`) | [✅](pages/ibiza-flyover/default.html) | [✅](pages/ibiza-flyover/loading.html) | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/ibiza-flyover/recording.html) |  |  |  |  |  |  |  |  | [✅](pages/ibiza-flyover/landed.html) | [✅](pages/ibiza-flyover/bike-lost.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-175`, `L2-178`, `L2-179` |
| Class Ride (`class-ride`) | [✅](pages/class-ride/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/class-ride/recording.html) |  |  | [✅](pages/class-ride/ibiza.html) | [✅](pages/class-ride/video-unavailable.html) |  |  |  |  |  |  | [✅](pages/class-ride/intensity.html) | [✅](pages/class-ride/countdown.html) | [✅](pages/class-ride/paused.html) | [✅](pages/class-ride/ibiza-intensity.html) | [✅](pages/class-ride/ibiza-sound.html) | [✅](pages/class-ride/ibiza-youtube.html) | [✅](pages/class-ride/ibiza-youtube-class.html) | [✅](pages/class-ride/ibiza-youtube-audio.html) | [✅](pages/class-ride/ibiza-youtube-unavailable.html) | [✅](pages/class-ride/countdown-ibiza.html) | [✅](pages/class-ride/go-ibiza.html) | [✅](pages/class-ride/ibiza-loading.html) | [✅](pages/class-ride/ibiza-unavailable.html) | [✅](pages/class-ride/ibiza-music-off.html) | [✅](pages/class-ride/ibiza-music-unavailable.html) | [✅](pages/class-ride/paused-ibiza.html) | [✅](pages/class-ride/off-target.html) | [✅](pages/class-ride/by-hand.html) | [✅](pages/class-ride/video-unavailable-by-hand.html) | [✅](pages/class-ride/disconnected.html) | [✅](pages/class-ride/disconnected-ibiza.html) | [✅](pages/class-ride/countdown-disconnected.html) | [✅](pages/class-ride/finish.html) | [✅](pages/class-ride/finish-ibiza.html) | [✅](pages/class-ride/rolling-on.html) | [✅](pages/class-ride/rolling-on-ibiza.html) | [✅](pages/class-ride/finish-by-hand.html) | [✅](pages/class-ride/rolling-on-by-hand.html) |  |  |  |  |  | `L2-014`, `L2-023`, `L2-026`, `L2-027`, `L2-028`, `L2-087`, `L2-088`, `L2-089`, `L2-091`, `L2-092`, `L2-093`, `L2-135`, `L2-173`, `L2-174`, `L2-175`, `L2-178`, `L2-180`, `L2-181`, `L2-182`, `L2-183`, `L2-185`, `L2-186` |
| Class Done (`class-done`) | [✅](pages/class-done/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/class-done/recording.html) |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-done/intensity.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-done/first.html) | [✅](pages/class-done/not-best.html) | [✅](pages/class-done/efforts-none.html) | [✅](pages/class-done/not-saved.html) | [✅](pages/class-done/intensity-kept.html) | `L2-077`, `L2-078`, `L2-079`, `L2-184`, `L2-178` |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-145` |

### Dialogs

| Screen | default | busy | invalid | note-ready | note-added | capturing | capture-kept | capture-refused | capture-unsupported | saved | save-failed | limit-reached | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Diagnostic recording (`diagnostic-recording`) | [✅](dialogs/diagnostic-recording/default.html) | ➖ | ➖ | [✅](dialogs/diagnostic-recording/note-ready.html) | [✅](dialogs/diagnostic-recording/note-added.html) | [✅](dialogs/diagnostic-recording/capturing.html) | [✅](dialogs/diagnostic-recording/capture-kept.html) | [✅](dialogs/diagnostic-recording/capture-refused.html) | [✅](dialogs/diagnostic-recording/capture-unsupported.html) | [✅](dialogs/diagnostic-recording/saved.html) | [✅](dialogs/diagnostic-recording/save-failed.html) | [✅](dialogs/diagnostic-recording/limit-reached.html) | `L2-178` |

<!-- coverage:end -->
