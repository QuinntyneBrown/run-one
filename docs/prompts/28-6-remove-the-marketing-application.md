# Feature: Slice 28.6 — Remove the marketing application

## Goal

Telo Ride 1's workspace is one application, `ride`, on the libraries it needs (L2-146 AC1, AC2).
Remove the `marketing` application (ADR 0027), the one-page site with the pitch film, carried
over from Telo Ride: `frontend/projects/marketing/`, its project in `frontend/angular.json`, its
build and budget in `tools/verify/verify.mjs` and `.github/workflows/ci.yml`, its scripts in
`frontend/package.json`, its place in the ESLint boundaries and in `AGENTS.md`'s dependency
direction, the components in `frontend/projects/components/` that only it used (the site
navigation, footer, hero, film, features, bands and the like), and its docs.

The `ride` app, its libraries (`api`, `domain`, `components`, `video`, `world`) and every
behaviour of the app are unchanged. The `world` library stays: riding in Ibiza needs it
(ADR 0036), whatever the slice's row says.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: doc alignment, removal in slices, green
  tests, the film and a local commit. Go through every phase and every slice in one continuous
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
- A removal adds no behaviour, so each slice's acceptance test is an existing spec changed
  first, or one new spec for what the rider now sees. Delete a spec only together with the
  behaviour it proves, and list in the lessons log any spec deleted without a replacement.
- The backend drops tables only through an EF Core migration added in this change.
- Copy the house style of each folder.

## Phase 1: Bring the docs in line

- `docs/adr/`: add the next ADR (0041), "One application: the marketing site is removed",
  superseding ADR 0027; set ADR 0027's status line and its row in `docs/adr/README.md`.
- `docs/detailed-journeys.md`: row 28.6 names the libraries that stay, `world` included.
- `AGENTS.md` is a project instruction file and you do not edit it: list in the ADR the lines
  that are now out of date (the `marketing` application in "Frontend" and in the dependency
  direction, and in "Carried over from Telo Ride").

## Phase 2: Remove it (`implementing-incrementally`)

A workspace change with no behaviour of the app to prove, so it gets no new spec and no
architecture test (`AGENTS.md`): the proof is that lint, the build, the unit tests and the
behaviour specs stay green and that the tooling no longer builds a second application.

1. Remove the project, its build targets, scripts, verify step and CI step.
2. Delete each export in `components` (and `api`) that nothing uses any more, with its file and
   spec (L147); check the initial bundle did not grow.
3. Remove what only it used from `frontend/public` or the app's assets, the design system pages
   and mocks only if they are the marketing site's own, and its entries in `README.md`.

## Phase 3: Close the slice

- The film in `docs/videos/28-6-remove-the-marketing-application/`, made as
  `docs/videos/README.md` says and shaped like
  `docs/videos/28-5-remove-home-profile-and-the-class-library/` (copy its `slides.html`,
  `narration.json` and `film.js` and rewrite the middle scenes; the close quotes Telo Ride 1's
  purpose through `closing()`); no captions burned in; real numbers from this machine in the
  proof scene (verify's step list before and after, the workspace's projects); look at one frame
  per scene, the close included, before the encode (`--frame`), then encode with `--crf 23`; add
  its row to `docs/videos/README.md`. The pitch film `docs/videos/00-meet-telo-ride/` stays as
  history.
- The entry for 28.6 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table (fill in *Applied in* and *Result* for every lesson you used); 28.6 at 100%
  with the totals in `docs/detailed-journeys.md` and `docs/journeys.md` (journey 28's percentage
  is its finished days over 15; 28.6 is 1 day).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

Wordmark (28.7), the backend's projects and hosting (28.8).

## Done means

- The workspace has one application; nothing builds, lints, tests or deploys a marketing site.
- From `frontend/`, `E2E_PORT=4310 node ../tools/verify/verify.mjs` exits 0.
- Docs, ADRs and the journeys tables agree with the code.
- The work is committed on the current branch, with the commit message ending in the line
  `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Do not push and do not open a PR:
  the session that started you does that.
- End with a short summary: what was removed, decisions made, specs deleted without a
  replacement, the final check results, and anything deferred or left failing.
