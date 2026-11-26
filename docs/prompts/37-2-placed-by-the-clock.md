# Feature: Slice 37.2 — Placed by the clock

## Goal

Through a ride in Ibiza the clock places the rider, never their power or cadence (L2-174 AC2,
AC4, AC5, AC9 and AC10 in `docs/specs/L2.md`; the slice's row in
`docs/detailed-journeys.md`):

- **At each second** the rider is on the stretch of road of the plan's segment at that second
  of the ride clock, each segment's stretch ridden evenly over the segment (AC2).
- **Held** while the ride is paused or the bike is lost; Resume carries on from the same place
  (AC5).
- **A hidden tab** draws no frame; when it shows again the rider is where the clock puts them
  (AC9, L2-133 AC2).
- **The camera** sits 4.9 m behind and 2.25 m above the rider, and closes in to 3.5 m behind and
  1.8 m above within 45 m of the grid and within 70 m of the finish line (AC10).
- **Everything else** on Class Ride behaves as with the class video, and the output, the
  efforts and the on-target share are computed the same (AC4).

Today the course is drawn in the video's box with the rider alone (slice 37.1;
`frontend/projects/ride/src/app/class-ride/`, the `world` library's `course-renderer.ts`,
`scene-driver.ts`, `timed-segments.ts`, `frame-scheduler.ts` and their unit tests;
`e2e/class-ride-ibiza*.spec.ts`), and 37.1 proved only the first frame's place. Much of the
rule is probably carried over from Telo Ride's timed course: measure each criterion first. The
placement (seconds of the clock to metres along the centre line, from the plan's segments and
the course's stretches) and the camera's offset (from metres to the grid and to the finish)
are pure functions in `world` or `domain` with unit tests, one case per row, boundaries
included; the specs read the rider's place through the read-only probe 37.1 used, and never
depend on pixels.

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

1. **Placement** (AC2): unit tests for the rule at a segment's start, middle and end, at 0:00
   and 20:00; then a spec that the probe's metres follow the fake clock across two segments
   and do not follow power or cadence.
2. **Held** (AC5): paused, and the bike lost, then on again from the same metre.
3. **The hidden tab** (AC9): no frame drawn while hidden (count frames through the probe), and
   the right place on return.
4. **The camera** (AC10): unit tests at 45 m and 70 m, both sides; a spec at the grid.
5. **The same figures either way** (AC4): one spec that a ride in Ibiza and a ride with the
   video, fed the same telemetry, hand over the same output and on-target share.

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

- The film in `docs/videos/37-2-placed-by-the-clock/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/37-1-the-course-in-the-videos-box/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 37.2 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 37.2 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 37.2 is 3 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

The course's lengths and gradients, the grid and the arch (37.3); files that cannot be loaded
and the lost context (37.4); music (37.5, 37.6); budgets (37.7); disposal (37.8); the record
(37.9).

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
