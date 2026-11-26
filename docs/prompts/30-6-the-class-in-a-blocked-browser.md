# Feature: Slice 30.6 — The Class in a blocked browser

## Goal

When the browser cannot reach a bike, The Class says why and does not start a ride (L2-008 AC2
to AC4, L2-009 AC1 and AC3, and L2-010 in `docs/specs/L2.md`; the mocks
`docs/mocks/pages/the-class/needs-chromium.html` and `needs-https.html`; the detailed design
`docs/detailed-designs/bike/check-bike-and-browser-support/`):

- **No Web Bluetooth on a secure page:** an alert (`role="alert"`) under the header reads "Open
  Telo Ride 1 in Chrome or Edge." with its line and **Copy link**, which copies the page's
  address and shows its copied state.
- **Plain http other than localhost:** the alert reads "Open the secure version of this page."
  with its line and its link to the https address, as L2-009 AC1 gives it.
- **In both:** the header reads "No bike · Connect"; the start button reads "Connect your
  bike", is disabled, and is followed by "The class needs the bike to set resistance."; the
  video, "What the bike will do" and the choice of how to ride work normally; opening the
  ride's address opens The Class instead and nothing is asked of Bluetooth.
- **A supported browser on a secure page** shows neither alert, on any screen.

Today The Class (`frontend/projects/components/src/the-class/`,
`frontend/projects/ride/src/app/the-class/`) has no alert; Connect Bike has its own (slice
29.2: `wz-connect-blocker`, `connectAlert()`), and the support state already exists in the app
(`frontend/e2e/browser-support.spec.ts`; the fake Bluetooth's `remove()` and
`servePlainHttp()`). Since slice 30.5 a new rider in a blocked browser opens on Connect Bike, so
these states of The Class are a returning rider's (a remembered bike), or reached by "Back to
the class". The ride's address is still `classes/intervals-to-the-beat/ride` until slice 31.1
makes it `/ride`: L2-010 AC2 applies to the address as it is today, and 31.1 keeps it true.
Slice 30.4 drew a tighter details column for short windows so that these alerts fit one screen
from 1024 px wide: prove it now with the form-factor specs in these two states.

Housekeeping in the same commit: `.gitignore` already has an uncommitted line for
`.claude/worktrees/`; keep it.

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

1. **The Chrome-or-Edge alert** (L2-008 AC2, AC4), then **Copy link** (AC3) with the clipboard
   answered by the fixture.
2. **The HTTPS alert** (L2-009 AC1, AC3).
3. **The disabled start button and header** (L2-010 AC1, AC3).
4. **The ride's address opens The Class** in a blocked browser (L2-010 AC2).
5. **Both states fit** at 1024 × 768, 1194 × 834, 1440 × 900, 390 × 844 and 834 × 1194.

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

- The film in `docs/videos/30-6-the-class-in-a-blocked-browser/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/30-5-open-where-the-rider-belongs/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 30.6 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 30.6 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 30.6 is 2 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

`/ride` itself (31.1); the record's figures in these states (journey 32).

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
