# Feature: Slice 37.1 — The course in the video's box

## Goal

A ride in Ibiza opens Class Ride at once (the slice's row in `docs/detailed-journeys.md`;
L2-089 AC6, L2-173 AC9, L2-174 AC1 and AC6, L2-175 AC1 and AC3 in `docs/specs/L2.md`):

- There is **no loading screen and no video player**: Telo Ride 1 keeps four screens. Pressing
  the start button with "Ibiza Sunset Strip" chosen opens `/ride`, the clock starts at 0:00 and
  the first segment's target resistance is sent at once.
- The 3D renderer and the course's files (`courses/ibiza.glb`, its centre line, its rider
  `riders/rider.glb`) are fetched from the app's own origin at that moment, never before
  (nothing of them on The Class, nothing in the initial bundle), and the video's box reads
  "Loading Ibiza Sunset Strip" over the course's still, as L2-175 AC1 gives it.
- When the course is ready it is drawn in the video's box, the canvas named "Ibiza Sunset
  Strip" (`role="img"`), with the rider on its road seen from behind and **alone**: no other
  rider, ghost, bot, position, gap or leaderboard. Its first frame has the rider where the
  clock puts them, not at the start line (L2-175 AC3).
- Everything else on Class Ride is as it is with the class video (L2-089 AC6): the same header,
  bike panel, pause, lost bike, leave and finish (slices 31.1 to 31.3 built them; keep their
  Ibiza specs passing).
- Ibiza Sunset Strip is the only course the app offers (L2-173 AC9).

Today "Ibiza Sunset Strip" opens the carried-over ride: World loading (a loading screen with
its own card, plan chart, "Back to class" and a panorama path), then the course with the class
video inset, and the carried-over renderer can still make other riders
(`frontend/projects/ride/src/app/class-ride/`, `class-world*`, the `world` library's
`course-renderer.ts`, `rider-batch.ts`, `race-riders.ts`, `pacers.ts`; `e2e/class-world*.spec.ts`,
`world-loading*.spec.ts`). This slice removes World loading, the world downloader, the inset
video in Ibiza, the panorama path, the carried-over `ClassPlan` chart if nothing else draws it,
and every code path that draws another rider; ADR 0042 and ADR 0044 said this slice would. The
`world` library also still holds Telo Ride's other worlds (`world-*.ts`, about a hundred
files), their music lists and the old map renderer: remove everything that Ibiza Sunset Strip's
course renderer does not use, with its unit tests, and anything in
`frontend/projects/ride/public/` only they used (`maps/`, `machines/`, and the `music/` tracks
if no requirement keeps them: L2-176 names one track, *Beautiful Boom Bap*, which slice 37.5
adds; say what the build's size was and is). Record the removal in an ADR.

Open questions this slice settles: 20 (how the two ways are ridden), 21 (the still shows other
riders from when the course was raced: the still becomes one of the solo ride, taken from the
course as it is now drawn, with the new rider alone), and 26 (a pale shape at the top right of
the course: with the inset video gone, find whether it is still drawn; if it is, find what
draws it and fix it). The mocks have no Class Ride state in Ibiza beyond `paused-ibiza` and
`disconnected-ibiza`, which stand the still in the box: draw `ibiza` (the course drawn) and
`ibiza-loading` first.

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

1. **The ride opens at once** (L2-175 AC1): spec first that pressing start with Ibiza chosen
   shows Class Ride with the clock running, the first level written to the bike, and "Loading
   Ibiza Sunset Strip" over the still, while the course's files are held by the fixture; and
   that The Class requested none of them.
2. **The course in the box** (L2-174 AC1, L2-089 AC6): the canvas, its name, no video player
   and no request to YouTube in a ride in Ibiza.
3. **Where the clock puts the rider** on the first frame (L2-175 AC3): a course released late
   starts at the clock's place. Use what the renderer already exposes to a spec, or a small
   read-only probe the specs can read; the placement rule itself is 37.2's.
4. **Alone on the road** (L2-174 AC6, L2-173 AC9): the code paths for other riders go; a unit
   test or spec that the scene holds one rider.
5. **World loading goes**, with the downloader, the panorama path and the other worlds; then
   the new still and the mocks.

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

- The film in `docs/videos/37-1-the-course-in-the-videos-box/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/31-3-when-the-video-or-the-bike-falls-short/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 37.1 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 37.1 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 37.1 is 4 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

The rider placed by the clock through the ride, the hidden tab and the camera (37.2); the
course's geometry and its malformed files (37.3); files that cannot be loaded, the lost
context, caching and offline (37.4); music (37.5, 37.6); budgets (37.7); disposal and the heap
(37.8); the record (37.9).

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
