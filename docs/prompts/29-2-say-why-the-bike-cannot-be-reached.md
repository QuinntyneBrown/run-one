# Feature: Slice 29.2 — Say why the bike cannot be reached

## Goal

When Connect Bike cannot reach the bike it says why, in an alert with the way forward: Bluetooth
is off, the browser has no Web Bluetooth, the page is on plain http, or the browser's chooser
will not open (L2-008 AC1, L2-009 AC4, L2-012 AC4 and L2-018 in `docs/specs/L2.md`). The mocks
are `docs/mocks/pages/connect-bike/bluetooth-off.html` and `unsupported-browser.html`; L2 lists
the HTTPS alert and the chooser alert as **mock gaps**, so those two states are drawn first.
The detailed designs are `docs/detailed-designs/bike/check-bike-and-browser-support/` and
`connect-a-bike/` (which names a `wz-connect-blocker`).

Today the carried-over Connect Bike (`frontend/projects/ride/src/app/connect/`, redrawn by slice
29.1) already shows carried-over messages in some of these cases
(`frontend/e2e/browser-support.spec.ts`, `pair-a-bike.spec.ts`); the fake Bluetooth's
`remove()`, `servePlainHttp()` and `restore()` give a spec each state (L23). This slice
replaces them with the alerts as designed, each `role="alert"`, with its copy from L2 and the
mocks, and "Try again" where L2 gives it. The design system's `device-list.html` still shows a
signal line that slice 29.1 removed from the mocks: bring it in line here.

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

1. **Bluetooth off** (L2-018): the alert of `bluetooth-off.html`, and Try again bringing the
   pair button back.
2. **An unsupported browser** (L2-008 AC1): the alert of `unsupported-browser.html`.
3. **Plain http** (L2-009 AC4): the HTTPS alert, drawn in a new mock first.
4. **A chooser that will not open** (L2-012 AC4): its alert, drawn in a new mock first.

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

- The film in `docs/videos/29-2-say-why-the-bike-cannot-be-reached/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/29-1-connect-bike/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 29.2 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 29.2 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 29.2 is 2 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

The Class in a blocked browser (30.6); the screen-reader announcements beyond `role="alert"`
(36.3).

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
