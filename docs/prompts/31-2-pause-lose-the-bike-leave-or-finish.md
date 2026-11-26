# Feature: Slice 31.2 — Pause, lose the bike, leave or finish

## Goal

The class ride is always solo, so the rider can pause, lose the bike and get it back, leave, or
finish (L2-091, L2-092 and L2-093 in `docs/specs/L2.md`; the mocks
`docs/mocks/pages/class-ride/paused.html` and `disconnected.html`; the detailed design
`docs/detailed-designs/class-ride/pause-leave-or-finish-the-class/`):

- **Pause** (L2-091): the video and clock stop, an overlay on the video reads "Paused", Pause
  becomes **Resume**, the resistance controls stay enabled; Resume picks the clock, the plan
  and the video up where they left off; each change is announced once to a screen reader. In
  Ibiza the course holds as L2-091 AC1 says.
- **Lost bike** (L2-092): the ride pauses, an alert (`role="alert"`) reads "Lost the bike" and
  "The video is paused. Pedal to wake the bike, then reconnect." with **Reconnect**; the clock,
  the plan and the video hold, Resume and the resistance controls are disabled, Leave stays
  active; when the bike is back (by a retry or by Reconnect, L2-017) the alert goes, the
  current segment's level is sent and the ride carries on, unless the rider had paused before
  the bike was lost, in which case it stays paused until Resume.
- **Leaving and finishing** (L2-093): Leave opens The Class without a confirmation, the ride is
  not finished and the record does not change; when the clock reaches 20:00 the ride is
  finished and Class Done opens; either way no further resistance command is sent for that
  ride and its timers, listeners and video (or its course) are released.

Today the carried-over class ride at `/ride` (slice 31.1; `frontend/projects/ride/src/app/
class-ride/`, the engine in `frontend/projects/domain/src/engine/`) already pauses, holds on a
lost bike, leaves and finishes, with specs (`e2e/class-ride*.spec.ts`,
`keep-the-bike-connected.spec.ts`, `long-ride.spec.ts`). Check each criterion against it before
building, redraw what differs from the two mocks, and delete what the design does not draw
(a confirmation on Leave, if one is left). Finishing opens the carried-over Results at
`/results` today; Class Done as designed, its address and "the record is updated" (L2-168) are
journey 32. In this slice a finished ride opens the screen that exists, and the hand-over of
the ride's result to it keeps working.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: requirement, design and mock alignment,
  test-first slices, green tests, the film and a local commit. Go through every phase and every slice in one continuous
  run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result,
  a plan, or "the next steps would be..." is not done.
- Where the repo's instructions say "stop and ask", treat this prompt as the confirmation in
  advance for everything in scope here. Choose the simplest option that fits the existing
  architecture, record it (an ADR or the lessons log), and keep going.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a
  test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself. If that happens, finish everything
  else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially: removing a feature is a change of its own, with its
  docs and tests cut down in the same change and an ADR where it reverses one; dependency
  direction; lazy loading and memory first; no architecture tests; behaviour specs only (never
  run or update visual, responsive, accessibility or heap sweeps); Chromium only; backend tests
  on EF Core InMemory, never sleeping.
- Read `docs/lessons-learned.md` first. Apply L2 (`E2E_PORT=4377` for every spec and verify run;
  never kill a server you did not start), L3 (format and `eslint --fix` before the first verify), L17 (judge
  verify by its exit status), L25 (all-or-nothing scripted edits), L147 (remove from the outside
  in), L148 (a spec that used the removed feature as its vehicle keeps its assertion on a solo
  class) and L150 (the film tools' Python).
- This slice adds behaviour, so it is built by ATDD: the acceptance test first, seen to fail for
  the expected reason, then the code. Never weaken a test to make it pass.
- Copy the house style of each folder.

## Phase 1: Requirement, design and mock

- Read the slice's row in `docs/detailed-journeys.md`, the L2s it names in `docs/specs/L2.md`
  with their open questions and mock gaps, the detailed design that covers it in
  `docs/detailed-designs/`, and its mocks in `docs/mocks/` (the source of truth for the UI).
  ADRs 0036 to 0041 say what Telo Ride 1 no longer has.
- Where L2 lists a mock gap for this slice, draw the missing state first
  (`writing-html-mocks`), in the mocks' house style, and add it to the mocks' index and
  manifest. Where the mock and L2 disagree, L2 stands and the mock is brought in line first.
- Bring the detailed design in line with what will be built
  (`writing-software-design-documents`), and the design system if a component's markup,
  classes or tokens change (`extracting-design-systems`).
- Where the slice's row and `docs/specs/` disagree, the specs stand (L149); correct the row.
- An open question that blocks the slice is settled the simplest way that fits the
  requirements, written into L2's open questions as closed, with an ADR if it is architectural.

## Phase 2: Incremental implementation (`implementing-incrementally`, test-first)

Suggested slices, which you may adjust:

1. **Pause and Resume** (L2-091 AC1, AC2), with the class video and in Ibiza; then the
   announcement (AC3).
2. **Lost bike** (L2-092 AC1, AC2), then **the bike is back** (AC3: the level sent, the ride
   carries on) and **paused before it was lost** (AC4). The rule for which state the ride is in
   (running, paused by the rider, held for the bike, both) is a pure helper or the engine's,
   with unit tests, one case per row.
3. **Leave** (L2-093 AC1, AC3): no confirmation, no command after, everything released.
4. **Finish** (L2-093 AC2, AC3): at 20:00 on the fake clock.

For each slice: write the Given-When-Then criteria and the acceptance test (Playwright, through
page objects, importing `test` and `expect` from the shared fixture), run it and show it fails
for the expected reason, implement the minimum, refactor green, run the regression checks, then
go on. Logic with many cases goes in a service or helper with unit tests, one case per row of
the requirement's table. Keep the mocks' BEM classes. Presentation goes in `components`; pages
that orchestrate stay in `ride`; contracts and tokens in `api`. Everything a screen acquires it
releases, and nothing new enters the initial bundle (read `npm run bundle:size`). When carried-
over code is replaced, delete it with its specs in the same change; a spec is deleted only with
the behaviour it proves, and listed in the lessons log.

After each slice that changes what a screen shows, take a screenshot at 1440 px and at 390 px
and look at it beside the mock (L154).

## Phase 3: Close the slice

- The film in `docs/videos/31-2-pause-lose-the-bike-leave-or-finish/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/31-1-class-ride/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 31.2 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 31.2 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 31.2 is 3 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

Class Done and the record (journey 32); the video that cannot play and the FTMS bike that
refuses control (31.3); the course and music in Ibiza as specified (journey 37: L2-174 AC8,
L2-176 AC6); announcements beyond L2-091 AC3 (36.3).

## Done means

- The behaviour of the slice's row and its L2s works end to end against the simulated bike and
  the fake Bluetooth, at every width, by touch and by keyboard, and the specs prove it.
- From `frontend/`, `E2E_PORT=4377 node ../tools/verify/verify.mjs` exits 0.
- Requirement, design, mock, tests and code agree.
- The work is committed on the current branch, with the commit message ending in the line
  `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Do not push and do not open a PR:
  the session that started you does that.
- End with a short summary: what was built, decisions made, the final check results, and
  anything deferred or left failing.
