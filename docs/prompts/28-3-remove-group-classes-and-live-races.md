# Feature: Slice 28.3 — Remove group classes and the ride hub

## Goal

Telo Ride 1 is always solo (`AGENTS.md`: "Always solo, so the rider can pause, leave or finish").
Remove group classes and the ride hub: the hub client and everything that uses it, in the
frontend and, per ADR 0037, in `backend/`. Live races already left with slice 28.2 (ADR 0036);
this slice removes what is left of them in the hub's contracts and in the backend.

After this change the app opens no hub connection and makes no request about a group session; a
class is started and ridden alone, exactly as today. `@microsoft/signalr` leaves
`frontend/package.json`.

Where it lives today:

- Frontend: `frontend/projects/api/src/live/`, `frontend/projects/ride/src/app/live/`, the group
  parts of `class-library/`, `class-start/` and `class-ride/` in `ride` and in `components`
  (group chip, group session view, group board), `multiplayer-availability` and `offline`
  choices in `domain`, the `session` query parameter of `/classes/:id/ride`.
- Specs: `frontend/e2e/class-library-group`, `class-start-group`, `class-world-group`,
  `group-class-board`, `group-class-join`, `group-class-start`, `ride-hub`, the group and hub
  parts of `lost-service` and `offline-choices`, and `e2e/fixtures/hub.ts` with the `hub` fixture
  in `e2e/fixtures/test.ts`.
- Backend: `backend/src/Telo.Ride.Api/Hubs/`, `Classes/ClassSessionsController.cs`,
  `Telo.Ride.Application/Live/`, the group-session and race files of `Application/Classes/` and
  `Application/Races/`, `Telo.Ride.Domain/Races/`, `Bots/`, `Results/`, the group-session types
  of `Domain/Classes/`, `Telo.Ride.Infrastructure/Live/`, `Maps` (controller, catalogue file,
  ADR 0029), their registrations, and their tests in `backend/tests/`.

Unchanged: the solo class (library, Class Start, the ride with its video or in the World,
Results), custom workout, sign-in, progression, Home, Profile, Settings, feedback. Later slices
of journey 28 remove those.

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

- `docs/adr/`: add the next ADR (0038), "Telo Ride 1 is always solo: no ride hub", superseding
  the hub's part of ADR 0025 and what ADR 0004 and ADR 0029 still describe; add it to
  `docs/adr/README.md`. Say what happens to an address with `?session=…`.
- `docs/detailed-journeys.md`: row 28.3 says what was removed.

## Phase 2: Incremental removal (`implementing-incrementally`, test-first)

Suggested slices; each ends with lint, build, unit tests and the behaviour specs green:

1. **No way in.** A spec first: the class library and Class Start offer no group session, and
   `/classes/:id/ride?session=x` rides solo and opens no hub connection (the shared fixture
   already fails a spec on an unanswered request). Then remove the group chip, the group session
   view and its join.
2. **The group ride.** Remove the group board and the hub's part of the class ride and of the
   class ride in the World, with their specs and page-object members.
3. **The hub client.** Remove `api/src/live/`, `ride/src/app/live/`, their bindings in
   `ride.routes.ts` and the class-ride route, `multiplayer-availability` and what only it used,
   the `hub` test fixture, and `@microsoft/signalr` from `package.json` (`npm install` to update
   the lock file). Check the initial bundle did not grow.
4. **Backend.** Remove the hub, live sessions, group sessions, races, bots, race results and
   maps, with their tests and registrations; add the migration; keep classes, accounts, progress,
   rides, feedback and workouts green. Update `backend/README.md` and `docs/deployment.md`.
5. **CI.** `.github/workflows/ci.yml` still has one `@critical` path per remaining feature and
   finishes under 5 minutes.

## Phase 3: Close the slice

- The film in `docs/videos/28-3-remove-group-classes-and-live-races/`, made as
  `docs/videos/README.md` says and shaped like `docs/videos/28-2-remove-races/` (copy its
  `slides.html`, `narration.json` and `film.js` and rewrite the middle scenes; the close quotes
  Telo Ride 1's purpose through `closing()`); no captions burned in; real numbers from this
  machine in the proof scene; look at one frame per scene before the encode (`--frame`), then
  encode with `--crf 23`; add its row to `docs/videos/README.md`.
- The entry for 28.3 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 28.3 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md` (journey 28's percentage is its finished days over 15).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

Sign-in, accounts, progress and recorded rides (28.4), Home, Profile and the class library
(28.5), marketing (28.6), wordmark (28.7), the backend's projects and hosting (28.8).

## Done means

- The app opens no hub connection and offers no group session; a solo class rides end to end
  with its video and in the World on the simulated bike.
- From `frontend/`, `E2E_PORT=4310 node ../tools/verify/verify.mjs` exits 0.
- Docs, ADRs and the journeys tables agree with the code.
- The work is committed on the current branch (`slice-28-3-remove-group-classes`), with the
  commit message ending in the line `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.
  Do not push and do not open a PR: the session that started you does that.
- End with a short summary: what was removed, decisions made, specs deleted without a
  replacement, the final check results, and anything deferred or left failing.
