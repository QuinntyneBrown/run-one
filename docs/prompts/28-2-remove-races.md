# Feature: Slice 28.2 — Remove races, keep Ibiza Sunset Strip

## Goal

Telo Ride 1 has no races. Remove the race feature from the code carried over from Telo Ride on
branch `carry-over-wattzup-code`: the race, race lobby, race setup, Map Select, the map catalogue,
ghost, bots, standings and Results for a race, with their tests, docs and ADRs. After this change
no route, link or request leads to a race or a map list, and CI is green.

Specs win over the slice's row in `docs/detailed-journeys.md` (decided by the owner on
2026-11-22): **keep** the Ibiza Sunset Strip course (`frontend/public/courses/`, its Blender
build in `tools/blender` and `blender/`), the course renderer in `frontend/projects/world`, and
whatever a class ride in the World uses (L2-173 to L2-177 in `docs/specs/L2.md`). Correct the
row for 28.2 in the same change.

Unchanged: Connect Bike, the class library, Class Start, the solo and group class ride, custom
workout, sign-in, progression, Home, Profile, Settings, feedback and the backend's other
endpoints. Journey 28's other slices remove those.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: doc alignment, removal in slices, green
  tests and a PR. Go through every phase and every slice in one continuous run. Do not pause
  between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result,
  a plan, or "the next steps would be..." is not done.
- Where the repo's instructions say "stop and ask", treat this prompt as the confirmation in
  advance for everything in scope here. Choose the simplest option that fits the existing
  architecture, record it (an ADR or the design's open-questions section), and keep going.
- If a shared library, component or design asset lacks something, that is not a reason to stop.
  Update it first, as the repo's rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a
  test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an
  action outside this repo that can't be undone. If that happens, finish everything else first,
  then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially: removing a feature is a change of its own, with its
  requirement, docs and tests cut down in the same change and an ADR where it reverses one;
  dependency direction and ESLint boundaries; lazy loading and memory first; no architecture
  tests; behaviour specs only (no visual, responsive, accessibility or heap sweeps); Chromium
  only; CI green and under 5 minutes.
- Read `docs/lessons-learned.md` first. Use `E2E_PORT=4310` for every spec and verify run (L2),
  and run `npm run format` and `npx eslint --fix` before the first verify (L3).
- A removal adds no behaviour, so each slice's acceptance test is an existing spec changed
  first, or one new spec for what the rider now sees (for example `/race/…` opens page not
  found). Delete a spec only together with the feature it proves.
- Work through the phases below **in order**. Copy the house style of each folder.

## Phase 1: Bring the docs in line

- `docs/detailed-journeys.md`: rewrite row 28.2 as "Remove races: the race, lobby, setup, Map
  Select, the map catalogue, ghost and bots, with their docs, tests and ADRs. Ibiza Sunset Strip,
  its Blender build and the course renderer in `world` stay."
- `docs/adr/`: add the next ADR (0036), "Telo Ride 1 has no races and one course", superseding
  what ADR 0029 (map catalogue shipped with the backend) and ADR 0035 (every map a course)
  decided for the other seven maps, and narrowing 0030 and 0034 to Ibiza. Update
  `docs/adr/README.md`.
- `docs/class-worlds.md`: keep only Ibiza Sunset Strip.

## Phase 2: Incremental removal (`implementing-incrementally`, test-first)

Suggested slices; each ends with lint, build, unit tests and the behaviour specs green:

1. **No way in.** Remove the race routes from `frontend/projects/ride/src/app/ride.routes.ts`
   (`race/:mapId/ride`, `race/:mapId/lobby`, race setup, Map Select, `results` for a race) and
   Home's race door. Spec: a race address shows page not found; Home offers no race.
2. **The race screens.** Delete `race/`, `race-lobby/`, `race-setup/`, `map-select/`, `maps/` in
   the app, their presentation in `frontend/projects/components`, their page objects and the
   `race-*`, `map-*`, `home-race-door`, `results*` (race parts), `device-check` (race world part)
   and `ride-clock-hidden-tab` (race test) specs in `frontend/e2e/`.
3. **The race rules.** Delete from `frontend/projects/domain/src/engine` what only a race used
   (`bot-pace-model`, `bot-pack`, `ghost-replay`, `final-standings`, `standings`, `finish-line`,
   `local-lobby`, `race-field`, `race-start-planner`, `route-profile` and the like), and from
   `frontend/projects/api/src` the `race`, `maps` and race `results` contracts and tokens, with
   their bindings. Check each for a class-ride user before deleting.
4. **The other seven courses.** Remove every course but Ibiza from `frontend/public/courses/`,
   `tools/blender` (scenes, themes) and `blender/` films, and from `world` only what no course or
   class world uses. Keep `tools/course-bench` working for Ibiza.
5. **Backend.** Remove `Maps`, `Races`, `Bots`, race `Results` from `backend/src` (Api,
   Application, Domain, Infrastructure) with their tests, the race methods of `RideHub`, and add
   an EF migration that drops their tables. Keep classes, accounts, progress, rides, group
   classes, feedback and workouts.
6. **CI.** In `.github/workflows/ci.yml` keep one `@critical` path per remaining feature; make
   sure a class ride in the World still has one.

## Phase 3: Close the slice

- Add the entry for 28.2 to `docs/lessons-learned.md`; set 28.2 to 100% and update the totals in
  `docs/detailed-journeys.md` and `docs/journeys.md`.

## Deferred

Group classes and live races' hub (28.3), sign-in and progression (28.4), Home, Profile and the
class library (28.5), marketing (28.6), wordmark (28.7), hosting (28.8).

## Done means

- No route, link, request or stored key leads to a race, a map list, a ghost or a bot; a class
  ride with the video and in the World still runs end to end on the simulated bike.
- `node tools/verify/verify.mjs` passes from `frontend/` with `E2E_PORT=4310`, and
  `dotnet test` passes in `backend/`.
- Docs, ADRs and the journeys tables agree with the code.
- The work is on a branch with a PR to `main`, rebased on `origin/main`, and CI is green.
- Only then end the run, with a short summary of what was removed, the decisions made, and
  anything deferred.
