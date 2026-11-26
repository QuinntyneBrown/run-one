# 0049. A ride is shaped like a race for one: five screens, with Ibiza Flyover before a ride in Ibiza

- **Status:** Accepted
- **Date:** 2026-11-24
- **Amends:** [0040](0040-four-screens-and-no-menus.md) (four screens become five), [0047](0047-a-ride-in-ibiza-is-class-ride-with-the-course-in-the-box.md) ("No screen before the ride": a ride in Ibiza has Ibiza Flyover before it, and the clock starts on "Go!", not when Class Ride opens)
- **Narrows:** [0046](0046-class-ride-at-ride-behind-a-connected-bike.md) (`/ride` shows Ibiza Flyover, then Class Ride)

## Context

The mocks in `docs/mocks/` are the source of truth for the UI (`AGENTS.md`). They now draw a ride
that runs like a race against nobody: a new screen, Ibiza Flyover (`pages/ibiza-flyover/`), and
on Class Ride a countdown, a finish banner and a roll-out
(`pages/class-ride/countdown*`, `go-ibiza`, `finish*`, `rolling-on*`). `docs/specs/` follows them
in L1-015, L1-028 and L2-179 to L2-182.

Three earlier decisions say otherwise. ADR 0040 fixed Telo Ride 1 at four screens. ADR 0047 took
World loading out and decided there is no screen before the ride: the clock, the plan and the
first target resistance start when Class Ride opens, and the course appears in its box when it
can be drawn. ADR 0046 made `/ride` Class Ride's address and nothing else's.

The mocks copy the Magic Patterns prototype *Telo Ride 1*, whose thread *Ride 1 Class Flow* drew
these moments. The same thread also redrew Class Ride edge to edge with the readouts over the
picture and no stepper, called each effort out as a "drop", and drew a class ("20 Minute HIIT")
and a course ("one 3.2 km loop") that are not the product's. The mocks did not take those, so
this record has to say which side of the prototype stands.

## Decision

- **Five screens and page not found.** Connect Bike, The Class, Ibiza Flyover, Class Ride and
  Class Done. There is still no menu, and no link in any header leads anywhere but the ones the
  requirements name (L2-167 AC4).
- **Ibiza Flyover is a screen, at `/ride`, with no address of its own.** The start button on The
  Class is still the only way in, behind `connectedBikeGuard` (ADR 0046). In Ibiza, `/ride` shows
  Ibiza Flyover and then Class Ride; with the class video it shows Class Ride at once. A reload
  or a typed `/ride` opens The Class, as before, so the flyover cannot be bookmarked or opened
  without a bike. Cancel on the flyover opens The Class with no ride started.
- **The flyover is the course, not a loading screen.** What ADR 0047 removed stays removed: a
  load card, steps, a progress the rider waits on, and a button to press when the download ends.
  The flyover draws the course itself from above while its files load, lands on the grid, and
  never holds the ride: it can be skipped, it gives way to Class Ride when the course cannot be
  drawn or is not drawn within 10 seconds, and it is not shown to a rider who asks for reduced
  motion (L2-179 AC4, AC8, AC9). It says only what is true of the bike ("Echelon EX-5s
  connected", then "Bike ready · lining up"), never a made-up step.
- **The course loads once, for the flyover and the ride together.** The renderer and the
  course's files are fetched when Ibiza Flyover opens (when Class Ride opens, if the flyover is
  not shown), and the first segment's target resistance is sent then, so the bike is ready on the
  grid (L2-175 AC1). The Class still fetches none of it, and a ride with the class video never
  does (L2-136 AC1).
- **The clock starts on "Go!".** Class Ride opens on a countdown of "3", "2", "1" and "Go!", in
  Ibiza and with the class video alike. This replaces ADR 0047's "starts the clock, the ticker
  and the plan at once": the ride's 0:00, the video's playback, the rider rolling off the grid
  and the music all begin on "Go!" (L2-180, L2-176 AC1). The countdown is counted by the ride's
  clock source, so a hidden tab does not stretch it.
- **A ride ends on the banner, and Class Done opens by itself.** At 20:00 the ride is finished
  and the record is written at once; then the finish banner shows for 3.2 seconds and the
  roll-out for 5.2, while the target resistance steps down to level 4 and the video or the
  course carries on (L2-181, L2-182). The commands that ease the bike off are the ride's last.
  Nothing the rider pedals after 20:00 is counted, and a tab closed in those seconds loses
  nothing.
- **A race's shape and nothing else of a race.** No other rider, ghost, bot, position, gap, lap,
  place or leaderboard is drawn anywhere, the flyover's grid and the finish banner included
  (ADR 0036, ADR 0038, L2-174 AC6, L2-179 AC12, L2-181 AC8).
- **Class Ride keeps the layout the mocks draw.** The new moments lie inside the video's or the
  course's box, above the bike panel with its stepper. The prototype's edge-to-edge Class Ride,
  its effort call-outs ("Drop 4", "Final drop!", "Recover"), its "Skip to the final drop", the
  word "drop" for an effort, its class and its 3.2 km loop are not taken (L2 open questions 39
  and 40). Taking any of them later means changing the mocks first, then the requirements.
- **The words.** The course seen from above is the "flyover", the three seconds before the clock
  starts the "countdown", the banner at 20:00 the "finish banner", and the seconds after it the
  "roll-out". `AGENTS.md` and `docs/specs/L2.md` use them in that sense only.

## Consequences

- None of this is built. Journey 39 in `docs/journeys.md` plans it; each slice brings its
  detailed design in line first (`docs/detailed-designs/class-ride/`).
- `ClassRideStore` no longer starts the clock when it is created. The countdown, the finished
  ride's banner and the roll-out are states of the ride that its store has to hold, and the
  finish no longer navigates at 20:00 but 8.4 seconds after it.
- The course's renderer has to outlive one view and serve the next: created for Ibiza Flyover and
  handed to Class Ride without a second download or a second build, and released by whichever of
  them the rider leaves from (L2-179 AC5, L2-174 AC8).
- The course is seen from above for the first time. Whether a frame from there stays within
  120,000 triangles and 140 draw calls is not known until it is drawn; the cheap form is a
  camera low over the road (L2 open question 45).
- A rider can do nothing for the 8.4 seconds after the finish but watch (L2 open question 46),
  and seven resistance commands go to the bike in under a second (open question 42). Both are the
  prototype's timings and have not been tried on a bike.
- Three criteria have no mock yet: the bike lost during the countdown, the recording mark on
  Ibiza Flyover, and the finish on a bike that gives no control (`docs/specs/L2.md`, *Mock
  gaps*).
- ADR 0040's title and its first decision now read as history: the count is five. Its other
  decisions stand.
