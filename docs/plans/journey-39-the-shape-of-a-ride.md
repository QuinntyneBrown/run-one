# Build journey 39: the shape of a ride

## Context

The mocks, `docs/specs/L2.md` (L2-179 to L2-182), ADR 0049 and four detailed designs now describe
a ride shaped like a race for one: **Ibiza Flyover** before a ride in Ibiza, a **countdown** to
"Go!", a **finish banner** at 20:00, the bike **easing off** during a **roll-out**, then Class
Done opening on its own. None of it is built: `docs/detailed-journeys.md` lists slices 39.1 to
39.6 (16 days) at 0%. This plan builds those six slices, test-first, in the order the journey
fixes: 39.1 → 39.2 → 39.3 → 39.4 → 39.5 → 39.6.

The designs to follow (already written, they name every class, file and signal):

- `docs/detailed-designs/class-ride/count-down-to-the-start/README.md` (39.1)
- `docs/detailed-designs/class-ride/show-the-finish-banner/README.md` (39.2)
- `docs/detailed-designs/class-ride/ease-off-and-roll-on/README.md` (39.3, 39.4)
- `docs/detailed-designs/ibiza-flyover/fly-over-the-course/README.md` (39.5, 39.6)

## How each slice runs (AGENTS.md)

1. Invoke the `implementing-incrementally` skill; read `docs/lessons-learned.md` (L26/L96/L219,
   L75/L243, L192, L225/L226, L37, L46, L239/L244, L5/L247 apply most).
2. Draw the slice's missing mock first, if it has one (below); bring its design's `<TO SUPPLY>`
   line in line with the mock.
3. Given-When-Then per acceptance criterion → Playwright spec with page objects → run it and see
   it fail for the expected reason → implement only that → refactor → regression run.
4. Unit tests (Vitest, fake clock through `MONOTONIC_TIME`) for every pure rule and service.
5. End of slice: lessons-learned entry, **% complete** in `detailed-journeys.md` and
   `journeys.md`, one commit per slice on a branch `journey-39-shape-of-a-ride` (not `main`).
6. After 39.6: fix the stale lines ("not built") in `AGENTS.md`, ADR 0049's consequences,
   `detailed-journeys.md` line 7 and the designs' "none of the designed parts is built".

## Step 0: mocks still to draw (docs only, before the slice that needs them)

Per `docs/specs/L2.md` *Mock gaps*; each is a copy of an existing state with small changes, added
to `manifest.json`, every sibling's `mock-bar`, then
`python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write`.

| Mock | From | Before |
|---|---|---|
| `class-ride/countdown-disconnected` | `disconnected.html`, clock 0:00, no Pause/Resume | 39.1 |
| `class-ride/finish-by-hand`, `rolling-on-by-hand` | `finish`/`rolling-on` over `by-hand`, stepper "—" | 39.3 |
| `ibiza-flyover/recording` | `default.html` + the `diagnostic-mark` on the band | 39.5 |

## Shared test groundwork (first step of 39.1)

Nearly every riding spec goes through `frontend/e2e/fixtures/class-ride.ts`, so the new shape is
absorbed there, not in ~50 specs:

- `startClassRide` / `startClassRideOnFtms` / `startRideInIbiza*`: after the first target write,
  step `page.clock.runFor` to "Go!" (3,000 ms) so specs still begin at `0:00`; option
  `{ countdown: 'hold' }` for the countdown's own specs.
- New `rideOut(page)`: `runFor` across the 8,400 ms ending in chained steps; used by every spec
  that asserts `/done` (class-done*, ride-record*, no-account, ride-lost-network, long-ride,
  app-update, class-pause-leave finish, the-one-class, class-ride-ibiza-clock).
- From 39.5: `openTheClassForIbiza`/`startRideInIbiza*` press **Skip flyover** and step 900 ms;
  option `{ flyover: 'watch' }` for the flyover's specs.
- Page objects: add countdown, finish-banner, roll-out locators to
  `e2e/pages/class-ride.page.ts`; new `e2e/pages/ibiza-flyover.page.ts`; `e2e/fixtures/screens.ts`
  gains the flyover.
- Specs whose rule really changes are edited, not weakened: `the-one-class` (levels now end with
  the ease-off to 4), `class-pause-leave` ("no command after the ride" measured after the
  ease-off), `class-video` (video parked at 0:03 until "Go!"), `class-ride-ibiza-music` (music
  starts on "Go!"), `four-screens` (five), `class-ride-ibiza` ("no screen between").

## 39.1 Countdown (L2-180)

- `domain/src/engine/countdown.ts`: `countdownStep(elapsedMs)`, `Countdown` service (timer +
  `visibilitychange`, read from `MONOTONIC_TIME`, `goAt`), with spec. `RideClock.start(at?)`.
- `ride/src/app/class-ride/ride-phase.ts`; `ClassRideStore`: `phase` signal, constructor only
  `engine.follow(plan)` + wake lock, `beginCountdown()`, private `go()` (clock, ticker,
  `RIDE_ACTIVITY.begin()`, recorder, tally, play parked video); `running` true only in `riding`;
  `followBike` stops/restarts the countdown.
- `ride-hold.ts`: `rideHeader(phase, hold)`; `stat-view.ts`: no hint/tone outside `riding`.
- `components/src/class-ride/class-countdown.*` (`wz-class-countdown`, block from the design
  system); one `overlay` slot on `wz-class-video` and `wz-class-course`.
- `playVideo`: `autoplay: false` at the sync offset during `countdown`.
- New spec `e2e/countdown.spec.ts` (one `@critical` path: 3-2-1-Go, clock holds then starts,
  first write sent, no Pause; plus Leave, lost bike, hidden tab, screen reader text, reduced
  motion).

## 39.2 Finish banner (L2-181)

- `domain/src/engine/ride-ending.ts`: `rideEndingAt(elapsedMs)`, `RideEnding` service, spec.
- `ClassRideStore.finish()`: keeps clock pause, ticker stop, result, `RIDE_RECORD.add`; sets
  `finished`, starts `RideEnding`; no longer pauses the player, releases music/wake lock, forgets
  the target or navigates. `finished` signal; `plan` holds the cool-down at 0:00.
- `components/src/class-ride/finish-banner.*` (`wz-finish-banner`) in the overlay slot.
- Interim so the suite stays green between slices: navigation to `/done` moves to the ending's
  `over` stage here (the roll-out card and ease-off arrive in 39.3).
- New spec `e2e/finish-banner.spec.ts` (`@critical`: banner with the output Class Done shows,
  record already written; tab closed during the banner still counts the ride).

## 39.3 Ease off and roll on (L2-182 AC1–4, 6–11)

- `domain/src/engine/ease-off.ts`: `easeOffLevels(from, to)`, `ResistanceEaseOff`, spec.
- Store: `stepperOff`, `close()` (forgetTarget, activity end, navigate), `rideHold` and
  `followBike` ignore a lost bike in `finished`/`rolling-out`; music effect counts the ending as
  running. `rollOutTitle(way)` in `ride-hold.ts`.
- `components/src/class-ride/class-rollout.*` (`wz-class-rollout`, progressbar).
- New spec `e2e/roll-out.spec.ts` (`@critical`: levels 10…4 written 110 ms apart, stepper
  disabled, card, Class Done opens by itself; by-hand bike sends nothing; lost bike; hidden tab).

## 39.4 Roll on past the finish line (L2-174 AC7, L2-182 AC5)

- `ClassRideStore.courseSeconds` (class length + whole seconds of the ending), bound to
  `CourseSceneHost`'s `elapsed` with `running` true through the ending. `Course.metresAt` and
  `chaseCamera` already carry the rider down the 202 m run-out; no `world` change expected.
- Extend `e2e/class-ride-ibiza-clock.spec.ts`: probe `metres` passes the finish and grows.

## 39.5 Ibiza Flyover (L2-179 AC1–6, 11–12)

- `ride/src/app/class-ride/ride-page.*` (`RidePage`): takes over `ClassRidePage`'s providers,
  renders the flyover or Class Ride, calls `beginCountdown()`; `class-ride.routes.ts` loads it.
  `ride/src/app/ibiza-flyover/`: `opens-on-flyover.ts`, `flyover-places.ts`, `flyover-store.ts`,
  `ibiza-flyover-page.*`. All in the `/ride` chunk; initial bundle untouched (check
  `npm run bundle:size`, `main` was 243 kB).
- `course-session.ts` (`CourseSession`): creates the one `CourseScene`, `attach`/`detach` its
  host view; `CourseSceneHost` becomes a borrower and gains the `flyover` input.
- `api/src/course/course-renderer.ts`: `CourseFrame.flyover`; `world`: `flyover-camera.ts`
  (pure, spec), `CourseScene` input, `SceneDriver` pass-through, `ThreeCourseRenderer.aim`.
- `domain/src/engine/flyover.ts`: `flyoverAt`, constants, spec.
- `components/src/ibiza-flyover/ibiza-flyover.*` (`wz-ibiza-flyover`): bar, scene slot, band.
- New spec `e2e/ibiza-flyover.spec.ts` (`@critical`: flyover shows, Skip lands, countdown opens
  with the course already drawn and the course files fetched once; captions, Cancel, loading).

## 39.6 When the flyover falls short (L2-179 AC7–10)

- `FlyoverStore`: bike lost holds the landing with **Try again**; gives way on
  `unavailable` or 10,000 ms; `opensOnFlyover` false with reduced motion; Cancel releases the
  renderer (probe `released`).
- Budgets: extend `e2e/class-ride-ibiza-budgets.spec.ts` to a flyover frame (≤120,000 triangles,
  ≤140 draw calls). The camera's height and pitch are open (L2 open question 45): start high,
  measure, and fall back to the design's cheap form (low over the road) if it does not hold;
  record the outcome in the design and the open question.

## Not decided here (built as the requirements stand)

Open questions 41–46 stay open: flyover and countdown silent, flyover every ride, no button out
of the roll-out, no "new best" on the banner, the prototype's timings. Nothing is tried on a real
bike (hardware smoke tests are a person's).

## Verification

- Per slice: the new spec red then green; `npm test` (unit); the changed specs with
  `CI=1 npx playwright test <files> --repeat-each 10`; `npx playwright test --grep @critical`.
- Before each commit: `node tools/verify/verify.mjs` from the repo root (format, lint, unit,
  build, bundle size, full e2e), judged by exit status; Ibiza specs that flake under the full
  parallel run are rerun alone (L250).
- By hand: `npm start`, `/?simulate`, ride with the class video and in Ibiza through flyover,
  countdown, a ride, the banner and the roll-out to Class Done.
- Not run unless asked: visual, responsive, accessibility sweeps, heap and perf checks (their
  helpers are kept compiling).
