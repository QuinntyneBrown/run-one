# Feature: Slice 30.1 — The one class

## Goal

Telo Ride 1 has one class, **Intervals to the Beat** (GCN Training, id `intervals-to-the-beat`,
20:00), and no other (L2-080 AC1 to AC4 in `docs/specs/L2.md`). Define it, with its plan, as
data shipped with the app (ADR 0037): a typed constant in `domain`, validated by the rules a
class's plan must meet, behind a contract and token in `api`. The slice's row in
`docs/detailed-journeys.md` still names `gcn-30-hiit`; the specs stand (L149), and the row is
corrected. The plan is the one Ibiza Sunset Strip was built from: read it from the course's
file in `tools/blender/courses/` and from L2-080, and make the app's plan and the course's
agree to the second.

Today `/` shows the carried-over Class Start for the stand-in `hiit-cardio-30`, read from the
backend's `GET /api/classes` through `HttpClassesApi` and a cache on the device (ADR 0040).
After this slice:

- `/` shows Intervals to the Beat, with its title, length, summary, video (`il_OFz6o42I`, sync
  offset 0:03.0) and plan, and the class ride rides its plan end to end on the simulated bike.
- The app makes no request to `/api/classes` or to any API. The classes client, its cache and
  the catalogue DTOs leave `api` and `domain`; `HttpClient` leaves the app if nothing else uses
  it.
- A class that cannot be loaded (its data fails validation) says so: L2 lists this state as a
  **mock gap**, so draw it first. The carried-over "unavailable" state of Class Start (ADR 0040)
  is replaced by it or removed, as L2-080 decides.
- No other class exists: remove the other classes from the app's data, fixtures and specs, and,
  as ADR 0036 deferred to this slice, the other seven courses (Prairie Paceline, Old Town
  Criterium, Cliffside Coast, Neon Docklands, Dolomites, Vice City, Col du Granit): their glb
  and course JSON in `frontend/projects/ride/public/courses/`, their entries in the `world`
  library, their Blender scenes, course files and themes in `tools/blender/`, their films in
  `blender/`, and their panoramas and covers. Ibiza Sunset Strip, its Blender build and the
  course renderer stay. Whether the class ride draws Ibiza or plays the video is the rider's
  choice in slice 30.2 (L2-173); until then the class ride behaves as it does today for a class
  with a world, with Ibiza Sunset Strip as that world.
- In `backend/`, the class catalogue (its endpoint, query, file and tests) is removed; what is
  left (health, serving the app's build) goes with slice 28.8, which now follows this slice.

L2's open question 11 (the class's words and the cadence aims of the warm-up and cool-down)
blocks this slice: settle it from the plan and the course file, the simplest way, and record it.

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

1. **The class and its plan** (L2-080 AC1, AC2): the constant and its validation, unit-tested
   from the requirement's table, one case per row; the plan's total is 20:00.
2. **`/` shows it** (L2-080 AC1, AC4): a spec first that `/` shows "Intervals to the Beat",
   "GCN Training", 20:00, with no request to `/api/classes`; then bind the app's class to the
   constant and remove the HTTP client, its cache and the fixtures' catalogue.
3. **The ride rides it** (L2-080 AC2, AC3): the class ride steps through the plan's segments
   and sends each target resistance; the existing class-ride specs move from the stand-in's
   plan to this one with their assertions kept.
4. **A class that cannot be loaded** (the mock gap), mock first.
5. **No other class, no other course:** the removals above, with ADR 0042 recording them and
   the backend's catalogue going.

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

- The film in `docs/videos/30-1-the-one-class/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/29-2-say-why-the-bike-cannot-be-reached/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 30.1 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 30.1 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 30.1 is 2 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

The Class as designed, its video parked, the choice of how to ride and the start button's states
(30.2); what the bike will do (30.3); form factors (30.4); where the app opens (30.5); a blocked
browser (30.6); `/ride` (31.1); music (L2-176, with riding in Ibiza); static hosting and the end
of `backend/` (28.8).

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
