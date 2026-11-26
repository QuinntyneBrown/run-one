# Feature: Slice 28.7 — Wordmark

## Goal

Every screen carries the wordmark **TELO RIDE 1**: the Telo Ride lockup with "RIDE 1" in signal
orange, and the product is "Telo Ride 1" in every title and message (L2-172 in
`docs/specs/L2.md`; `AGENTS.md`, "Design": it is "1", never "One" or "I"). Today the header's
lockup reads TELO Ride and the titles and messages say "Telo Ride".

Where it lives today: the `lockup` component in `frontend/projects/components/src/lockup/`, the
class header that hosts it, the route titles in `frontend/projects/ride/src/app/ride.routes.ts`
and its children, `frontend/projects/ride/src/index.html`, the web app manifest and its icons'
names, and the messages on Connect Bike, the class, the class ride, Results, page not found and
the app-update and install notices. The mocks in `docs/mocks/` already draw the wordmark; the
design system's lockup page is `docs/design-system/components/lockup.html`.

Everything else about the screens is unchanged.

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

- Read L2-172 and the L2s that quote a message with the product's name (L2-008 and its open
  question 5 among them). Where a message's copy is decided by a mock, the mock changes first:
  bring `docs/mocks/` in line for every message this slice changes, and the design system's
  lockup page and tokens if the lockup's markup or classes change
  (`extracting-design-systems` only if a page must be regenerated).
- Bring the detailed design that covers the wordmark in `docs/detailed-designs/ui/` in line, or
  add its section, in that folder's house style (`writing-software-design-documents`).
- Close L2's open question 5 if this slice settles it.

## Phase 2: Incremental implementation (`implementing-incrementally`, test-first)

Suggested slices:

1. **The lockup.** Given any screen, when its header shows, then the lockup reads "TELO RIDE 1"
   with "RIDE 1" in the signal colour and the accessible name L2-172 gives. Write the Playwright
   spec through the header's page object for Connect Bike, the class at `/`, the class ride,
   Results and page not found; see it fail on "Ride"; then change the component.
2. **Titles.** Given each screen, when it shows, then the document title ends "· Telo Ride 1"
   (or is "Telo Ride 1"), as L2-172 gives.
3. **Messages and the manifest.** Every message that names the product says "Telo Ride 1"; the
   manifest's name and short name follow L2-172.

For each slice: write the Given-When-Then criteria and the acceptance test, run it and show it
fails for the expected reason, implement the minimum, refactor green, run the regression checks,
commit. Keep the mocks' BEM classes. No architecture tests; never run or update the visual,
responsive, accessibility or heap sweeps.

## Phase 3: Close the slice

- `docs/videos/assets/film-kit.js`: the films' lockup reads TELO RIDE 1 from this slice on.
- The film in `docs/videos/28-7-wordmark/`, made as `docs/videos/README.md` says and shaped
  like `docs/videos/28-6-remove-the-marketing-application/` (copy its `slides.html`,
  `narration.json` and `film.js` and rewrite the middle scenes; the close quotes Telo Ride 1's
  purpose through `closing()`); screenshots of the running app at 390, 768, 1024 and 1440 px
  with a close-up of the lockup; no captions burned in; real numbers from this machine in the
  proof scene; look at one frame per scene, the close included, before the encode (`--frame`),
  then encode with `--crf 23`; add its row to `docs/videos/README.md`.
- The entry for 28.7 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 28.7 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md` (journey 28's percentage is its finished days over 15; 28.7 is 1 day).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

The backend's projects and hosting (28.8); the screens as designed (29.1 onward).

## Done means

- Every screen's header reads TELO RIDE 1, every title and message says "Telo Ride 1", and the
  specs prove it.
- From `frontend/`, `E2E_PORT=4310 node ../tools/verify/verify.mjs` exits 0.
- Requirement, design, mock, tests and code agree.
- The work is committed on the current branch, with the commit message ending in the line
  `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Do not push and do not open a PR:
  the session that started you does that.
- End with a short summary: what was built, decisions made, the final check results, and
  anything deferred or left failing.
