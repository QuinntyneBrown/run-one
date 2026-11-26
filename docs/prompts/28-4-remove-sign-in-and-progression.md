# Feature: Slice 28.4 — Remove sign-in and progression

## Goal

Telo Ride 1 asks for no account, email, name or password and sets no cookie of its own (L2-132
AC1); a finished ride sends no request (L2-132 AC3). Remove sign-in and everything that needs a
signed-in rider, in the frontend and, per ADR 0037, in `backend/`:

- **Sign-in and accounts:** the sign-in and code screens, the auth guard, the session, display
  name (prompt and dialog), delete account, "stay signed in".
- **Progression:** XP, rider levels, streaks, stars, unlocks and class tiers; the header's
  streak, level badge and XP bar; Profile's headline; Results' XP panel; the locked states of
  the class library and Class Start (every class is open).
- **Recorded rides:** the ride outbox, its retries and "waiting offline" states; a finished ride
  is not submitted anywhere.
- **What cannot work without an account, and Telo Ride 1 leaves out anyway:** feedback (the
  dialog, its store, its API) and the custom workout (Custom Setup, the custom ride, its saving
  and restoring).

After this change the app opens straight on its screens with no sign-in, makes no request to
`/api/riders`, `/api/auth`, `/api/progress`, `/api/rides`, `/api/workouts` or `/api/feedback`,
and sets no cookie. The backend keeps only what still serves the app: the class catalogue
(`GET /api/classes`, until slice 30.1), health, and serving the app's build (until 28.8).

Where it lives today:

- Frontend app: `frontend/projects/ride/src/app/sign-in/`, `session/`, `progress/`, `rides/`
  (the outbox parts), `feedback/`, `custom-workout/`, `custom-ride/`, parts of `main-shell/`,
  `home/`, `profile/`, `results/`, `class-library/`, `class-start/`, `settings/`, `dialogs/`,
  and the bindings in `ride.routes.ts`.
- Libraries: `frontend/projects/api/src/auth`, `riders`, `progress`, `rides`, `results`, `maps`,
  `race`, `feedback`, `workout`; their implementations in `domain` (`storage/`, `engine/`) and
  their presentation in `components`.
- Specs: `frontend/e2e/` `sign-in`, `stay-signed-in`, `account`, `display-name`, `rider-level`,
  `streak`, `class-tiers`, `class-start-locked`, `record-a-ride`, `ride-outbox`,
  `results-earned`, `profile-headline`, `feedback`, every `custom-*`, and the progress, rider and
  outbox fixtures every other spec leans on (`e2e/fixtures/test.ts`, `progress.ts`).
- Backend: `Accounts`, `Authentication`, `Progress`, `Rides`, `Workouts`, `Feedback`, `Maps` in
  all four projects, the cookie and same-origin proof, the email sender, the `feedback` command,
  their tables and their tests.

Unchanged: Connect Bike, Home's greeting (without a name) and Classes door, the class library,
Class Start, the solo class ride with its video or in the World, Results (time, output, on
target, Done, Ride it again), Profile's bike and Settings rows, Settings, Diagnostics, install
and update. Slice 28.5 removes Home, Profile and the class library.

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

- `docs/adr/`: add the next ADR (0039), "Telo Ride 1 has no account: nothing is signed in,
  recorded or earned", superseding ADR 0031 and ADR 0033 and what ADR 0025 still describes of
  accounts and progress; add it to `docs/adr/README.md`. Say that the rider's record (ride
  count, best output, last output) is built on the device by slice 32.1, and that Results shows
  no XP until Class Done replaces it (32.2).
- `docs/detailed-journeys.md`: row 28.4 says what was removed, including feedback and the custom
  workout, and row 28.5 no longer lists what this slice took.

## Phase 2: Incremental removal (`implementing-incrementally`, test-first)

Suggested slices; each ends with lint, build, unit tests and the behaviour specs green:

1. **No sign-in.** A spec first: a new browser opens `/` and reaches the app (Connect Bike for a
   rider with no bike) with no sign-in screen, `/sign-in` is page not found, and no request goes
   to `/api/riders/me` (the shared fixture fails a spec on an unanswered request, so remove the
   fixture's default answers for the removed endpoints as you go). Remove the guard, the screens,
   the session, display name and delete account.
2. **No progression.** The header without streak, level and XP; Profile without its headline;
   the class library and Class Start with every class open; Results without the XP panel.
3. **No recorded rides.** A finished class sends nothing; remove the outbox and its states.
4. **No feedback, no custom workout.** Their screens, dialogs, routes, stores and contracts;
   `/profile/custom` is page not found.
5. **The libraries.** Delete each export in `api`, `domain` and `components` that nothing uses
   any more, with its file and spec (L147), including the race and map leftovers ADR 0036 and
   ADR 0038 deferred to this slice.
6. **Backend.** Remove accounts, authentication, progress, rides, workouts, feedback and maps
   with their tests, registrations, settings and the `feedback` command; add the migration that
   drops their tables; `GET /api/classes` answers without a session and without tiers. Update
   `backend/README.md` and `docs/deployment.md`.
7. **CI.** `.github/workflows/ci.yml` keeps one `@critical` path per remaining feature and
   finishes under 5 minutes.

## Phase 3: Close the slice

- The film in `docs/videos/28-4-remove-sign-in-and-progression/`, made as
  `docs/videos/README.md` says and shaped like `docs/videos/28-3-remove-group-classes-and-live-races/`
  (copy its `slides.html`, `narration.json` and `film.js` and rewrite the middle scenes; the
  close quotes Telo Ride 1's purpose through `closing()`); no captions burned in; real numbers
  from this machine in the proof scene; look at one frame per scene before the encode
  (`--frame`), then encode with `--crf 23`; add its row to `docs/videos/README.md`.
- The entry for 28.4 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table (fill in *Applied in* and *Result* for every lesson you used); 28.4 at 100%
  with the totals in `docs/detailed-journeys.md` and `docs/journeys.md` (journey 28's percentage
  is its finished days over 15; 28.4 is 3 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

Home, Profile, the class library and heart rate (28.5), marketing (28.6), wordmark (28.7), the
backend's projects and hosting (28.8), the rider's record on the device (32.1), Class Done (32.2).

## Done means

- The app asks for no account and sets no cookie; no request leaves for a rider, progress, a
  ride, a workout or feedback; a solo class rides end to end with its video and in the World on
  the simulated bike and ends on Results.
- From `frontend/`, `E2E_PORT=4310 node ../tools/verify/verify.mjs` exits 0.
- Docs, ADRs and the journeys tables agree with the code.
- The work is committed on the current branch, with the commit message ending in the line
  `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Do not push and do not open a PR:
  the session that started you does that.
- End with a short summary: what was removed, decisions made, specs deleted without a
  replacement, the final check results, and anything deferred or left failing.
