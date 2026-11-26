# Feature: Slice 31.1 — Class Ride

## Goal

Class Ride is the third of Telo Ride 1's four screens, at `/ride`. Build it **as designed**: the
mock `docs/mocks/pages/class-ride/default.html`, the detailed design
`docs/detailed-designs/class-ride/ride-the-class/`, and L2-087 and L2-089 in `docs/specs/L2.md`:

- **The header** (L2-087 AC1 to AC3): the wordmark, "Intervals to the Beat · Solo", the clock
  (`role="timer"`, "5:30 / 20:00", named "5:30 of 20:00"), **Pause**, Leave (named "Leave
  class") and Full screen; on a phone the class name is hidden below md, "/ 20:00" is hidden,
  and the wordmark is hidden below 384 px; no shortcut finishes the ride early.
- **`/ride`** (AC4): opened without a connected bike, The Class opens instead. The ride's
  address today is `classes/intervals-to-the-beat/ride`; it becomes `/ride`, and the old
  address is page not found. Keep slice 30.6's rule true at the new address (a blocked browser
  gets The Class and nothing is asked of Bluetooth).
- **No scrolling** in a landscape viewport 768 px wide or more (AC5).
- **The bike panel** (L2-089): the segment card (its kind, the time left as a timer named
  "Recover: 0:30 left", a progress bar and the plan's resistance profile); Power ("229 W" with
  "On target" within 10 % of the target, otherwise the signed difference in watts, the text
  carrying it and never colour alone); Cadence ("91 rpm" with "Aim 90"); the resistance stepper
  ("13", "of 32", 48 px "Lower resistance" and "Raise resistance"); one row of four from md.
- **In Ibiza** (AC6) the course takes the video's box and everything else is as it is with the
  class video. Today "Ibiza Sunset Strip" opens the carried-over ride through World loading
  with the video inset; journey 37 builds riding in Ibiza. In this slice keep that ride working
  at `/ride` behind the same header and bike panel, and change nothing of the course's drawing.

Today the screen is the carried-over class ride (`frontend/projects/ride/src/app/class-ride/`,
its page object `e2e/pages/class-ride.ts`, its components in `frontend/projects/components/`).
Check every criterion against it before building; redraw what differs from the mock and delete
what the design does not draw. The mock still pictures the prototype's earlier class (30:00):
bring it to Intervals to the Beat first, with real figures from the plan. L2 lists **power off
target** as a mock gap for this slice: draw that state first. L2's open questions 2 and 3 touch
this screen (a rule still a proposal; a Time that read 30:00): read them and close what this
slice settles.

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

1. **`/ride`** (L2-087 AC4): the address, the guard for no connected bike and for a blocked
   browser, the old address gone; The Class's start button and every spec's way in follow.
2. **The header** (L2-087 AC1 to AC3), at every width.
3. **The segment card** (L2-089 AC1), then **Power** (AC2, AC6; the on-target rule as a pure
   helper with unit tests at the 10 % boundary, both sides and no target), **Cadence** (AC3),
   the **stepper** (AC4) and the **row of four** (AC5).
4. **No scrolling** from 768 px wide in landscape (L2-087 AC5), with the class video and in
   Ibiza.

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

- The film in `docs/videos/31-1-class-ride/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/30-6-the-class-in-a-blocked-browser/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 31.1 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 31.1 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 31.1 is 3 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

Pause, a lost bike, Leave and finishing (31.2: keep what the carried-over ride does today
working); the video that cannot play and the FTMS bike that refuses control (31.3); riding in
Ibiza as specified and the music (journey 37); Class Done (journey 32).

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
