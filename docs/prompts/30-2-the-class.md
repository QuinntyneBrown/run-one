# Feature: Slice 30.2 — The Class

## Goal

The Class is the home screen at `/`. Build it **as designed**: the mocks in
`docs/mocks/pages/the-class/` (`default`, `no-bike`) and the detailed design
`docs/detailed-designs/the-class/show-the-class/`, to L2-019 (the bike status in the header) and
L2-084 AC1, AC4, AC6, AC7 and AC9 in `docs/specs/L2.md`: the header with the wordmark, the bike
status and Full screen; the video player parked at the sync offset (0:03); "GCN Training ·
Intervals", the title as the `h1`, the summary; "20:00" with "start to finish"; the start
button's states ("Start class" with a bike, "Connect your bike" with its line and its way to
Connect Bike without one); starting the ride; and the class cover standing in when the video
cannot load (a **mock gap**: draw that state first).

Today `/` is the carried-over Class Start (`frontend/projects/ride/src/app/class-start/`, its
page object `e2e/pages/class-start.ts`), showing Intervals to the Beat since slice 30.1. This
slice replaces it with The Class: rename the screen, its folder, component, page object and
specs to the specs' word ("The Class"), and delete what the design does not draw.

**How to ride (L2-173) is part of The Class and no slice of `docs/detailed-journeys.md` covers
L2-173 to L2-177** (riding in Ibiza, the still, World loading's replacement, the music). The
specs stand (L149), so in this slice:

- Build the choice on The Class: L2-173 AC1, AC2, AC4 and AC7 (the radio group "Ride with",
  "Class video" chosen by default, the choice kept on the device, 44 px options, arrow keys,
  `aria-checked` and a mark), and AC3 and AC6 if the still and the cannot-draw state are small
  once the control exists. The control and the cannot-draw state are **mock gaps**: draw them
  first, in every The Class mock.
- For AC5, the carried-over class ride can already run with the video alone or in the World
  with the video inset: wire the choice to those two as they are, so "Class video" rides with
  the video only and "Ibiza Sunset Strip" rides in the course. Riding in Ibiza as L2-174 to
  L2-177 specify is not this slice.
- Add the missing slices to `docs/detailed-journeys.md` and `docs/journeys.md`: read L2-173 to
  L2-177 and L1-028, and add a journey "Ride in Ibiza" (the next journey number) with thin
  slices covering every criterion this slice does not build, each with its L2s, an estimate in
  days in the table's style, and 0%; put it in the build order after journey 31; update the
  totals (slices, days, percentages) in both files and say in the lessons log that the plan
  grew and by how much. Keep each existing row's estimate.

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
- Read `docs/lessons-learned.md` first. Apply L2 (`E2E_PORT=4310` for every spec and verify run;
  never kill what holds 4300), L3 (format and `eslint --fix` before the first verify), L17 (judge
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

1. **The screen's frame and the bike status** (L2-019, L2-084 AC1): the header link in both
   states, following the bike within a second; the title block and the length.
2. **The video parked** (L2-084 AC1) and **the cover when it cannot load** (AC9, mock first).
3. **The start button** (AC4, AC6, AC7): "Start class" starts the ride at 0:00; "Connect your
   bike" with its line opens Connect Bike.
4. **How to ride** (L2-173 AC1, AC2, AC4, AC7, then AC5 wired to the two existing rides, then
   AC3 and AC6 if small), mock first.
5. **The journeys tables:** the new journey and its slices.

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

- The film in `docs/videos/30-2-the-class/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/28-8-host-as-static-files/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 30.2 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 30.2 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 30.2 is 3 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

"What the bike will do" (30.3: keep whatever chart the carried-over screen shows until then,
or leave its place empty if the design's differs); the layout by form factor beyond what the
mocks' CSS gives (30.4); where the app opens (30.5); the blocked-browser alerts and Copy link
(30.6); "Ride it again" and the returning rider's three figures (L2-084 AC5 and AC8, journey
32); `/ride` (31.1); riding in Ibiza as specified and the music (the new journey).

## Done means

- The behaviour of the slice's row and its L2s works end to end against the simulated bike and
  the fake Bluetooth, at every width, by touch and by keyboard, and the specs prove it.
- From `frontend/`, `E2E_PORT=4310 node ../tools/verify/verify.mjs` exits 0.
- Requirement, design, mock, tests and code agree.
- The work is committed on the current branch, with the commit message ending in the line
  `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Do not push and do not open a PR:
  the session that started you does that.
- End with a short summary: what was built, decisions made, the final check results, and
  anything deferred or left failing.
