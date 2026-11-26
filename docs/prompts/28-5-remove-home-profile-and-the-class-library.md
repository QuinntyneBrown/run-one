# Feature: Slice 28.5 — Remove Home, Profile, Settings, the class library and heart rate

## Goal

Telo Ride 1 has four screens and no menus: Connect Bike, The Class, Class Ride and Class Done
(`AGENTS.md`; L2-167 AC4, L2-080 AC4). Remove every other screen and the navigation between
them from the code carried over from Telo Ride:

- **Home**, **Profile**, **Settings** (sound, display, World quality, saved worlds, the device
  check) and **Diagnostics** (the packet log and its dialog), with the app header's navigation
  and the main shell's side and bottom navigation.
- **The class library** (`/classes`): its shelves, tabs and cards. No screen lists classes or
  offers a way to choose one.
- **Heart rate**: the strap, its source and its statistics.

Until slice 30.2 draws The Class, `/` opens the one class on the carried-over Class Start
screen. The one class is `intervals-to-the-beat` (L2-080); slice 30.1 defines it. Until then
the stand-in is the catalogue's `hiit-cardio-30` (30 Minute HIIT Cardio), the only class with a
published video: `/` shows Class Start for it, with no redirect to an address that names a
class, and a returning rider's start still leads to the class ride at its present address
(`/ride` comes with slice 31.1). A rider with no remembered bike still starts on Connect Bike,
and Connect Bike leads to `/`. Results' "Done" and "Ride it again" lead to `/`.

After this change the only addresses are `/` (the class), `/connect`, the class ride, Results
and page not found; `/classes`, `/classes/:id`, `/profile`, `/settings` and every address under
them show page not found, whose link reads "Back to the class" and leads to `/` (L2-145). No
header shows a navigation item.

Where it lives today: `frontend/projects/ride/src/app/` `home/`, `profile/`, `settings/`,
`diagnostics/`, `class-library/`, `main-shell/`, `dialogs/`, parts of `class-start/`, `bike/`,
`results/`, `not-found/` and `ride.routes.ts`; their presentation in
`frontend/projects/components/src/`; their contracts and implementations in `api` and `domain`
(ride settings, display preferences, sound, saved worlds, the device check, the packet log,
connection history, heart rate); their specs and page objects in `frontend/e2e/`.

Keep, because the four screens need them: Connect Bike and the bike connection, the class
ride with its video and in the World (the World's renderer, loading and quality at their
defaults: with Settings gone nothing changes them, so remove the settings' stores and read the
defaults in their place), full screen, the announcer, the app cache and app updates, Results.
The app's theme follows the device (L2-143); with Display settings gone, remove the stored
choice and keep the device's.

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

- `docs/adr/`: add the next ADR (0040), "Four screens and no menus", saying what left, what `/`
  shows until The Class is drawn, the stand-in class until slice 30.1, and what becomes of the
  settings' values (their defaults, fixed). Add it to `docs/adr/README.md`.
- `docs/detailed-journeys.md`: row 28.5 says what was removed.

## Phase 2: Incremental removal (`implementing-incrementally`, test-first)

Suggested slices; each ends with lint, build, unit tests and the behaviour specs green:

1. **`/` is the class.** Specs first: with a remembered bike `/` shows Class Start for the
   stand-in class with no navigation in its header; with none the rider lands on Connect Bike
   and, once paired, on `/`; Results' Done leads to `/`; `/classes`, `/classes/hiit-cardio-30`,
   `/profile`, `/settings` and `/profile/custom` are page not found with "Back to the class".
   Then change the routes.
2. **Home, Profile, Settings and Diagnostics go**, with the main shell and the header's
   navigation.
3. **The class library goes.**
4. **Heart rate goes.**
5. **The libraries.** Delete each export in `api`, `domain`, `components` and `world` that
   nothing uses any more, with its file and spec (L147). Check the initial bundle did not grow.
6. **The backend** changes only if something it still does was only for a removed screen;
   `GET /api/classes` stays until slice 30.1.
7. **CI.** `.github/workflows/ci.yml` keeps one `@critical` path per remaining feature.

After each slice that changes what a kept screen shows (Class Start at `/`, Connect Bike, the
class ride, Results, page not found), take a screenshot at 1440 px and at 390 px and look at it
(L154).

## Phase 3: Close the slice

- The film in `docs/videos/28-5-remove-home-profile-and-the-class-library/`, made as
  `docs/videos/README.md` says and shaped like `docs/videos/28-4-remove-sign-in-and-progression/`
  (copy its `slides.html`, `narration.json` and `film.js` and rewrite the middle scenes; the
  close quotes Telo Ride 1's purpose through `closing()`); no captions burned in; real numbers
  from this machine in the proof scene; look at one frame per scene, the close included, before
  the encode (`--frame`), then encode with `--crf 23`; add its row to `docs/videos/README.md`.
- The entry for 28.5 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table (fill in *Applied in* and *Result* for every lesson you used); 28.5 at 100%
  with the totals in `docs/detailed-journeys.md` and `docs/journeys.md` (journey 28's percentage
  is its finished days over 15; 28.5 is 2 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

Marketing (28.6), wordmark (28.7), the backend's projects and hosting (28.8), Connect Bike as
designed (29.1), the one class and its plan (30.1), The Class as designed (30.2 to 30.6), `/ride`
(31.1), the record and Class Done at `/done` (32.1, 32.2), the other seven courses (30.1).

## Done means

- The app has no menu and no navigation: `/` is the class, and a rider goes Connect Bike, the
  class, the class ride, Results and back to `/`, with its video and in the World, on the
  simulated bike.
- From `frontend/`, `E2E_PORT=4310 node ../tools/verify/verify.mjs` exits 0.
- Docs, ADRs and the journeys tables agree with the code.
- The work is committed on the current branch, with the commit message ending in the line
  `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Do not push and do not open a PR:
  the session that started you does that.
- End with a short summary: what was removed, decisions made, specs deleted without a
  replacement, the final check results, and anything deferred or left failing.
