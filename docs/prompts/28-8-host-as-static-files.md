# Feature: Slice 28.8 — Host as static files

## Goal

Telo Ride 1 is static files: the app's production build, served over HTTPS, with plain http
redirected and HSTS set (L2-149 AC1 and L2-009 AC2 in `docs/specs/L2.md`; ADR 0037). Since
slice 30.1 the app makes no API request, so what is left of `backend/` (health, serving the
app's build, EF Core, its tests) serves nothing the rider uses. This slice removes it and puts
the static host in its place.

After this slice:

- `backend/` is gone, whole: projects, tests, solution, migrations, README.
- `tools/verify/verify.mjs` has no backend steps; `.github/workflows/ci.yml` has no .NET setup,
  no `dotnet format`, no API build, no backend acceptance tests, and its sparse checkouts no
  longer name `backend`. The lint, build and `@critical` jobs stay, green and under 5 minutes.
- The deploy job publishes the app's build to a static host. ADR 0037 says the Azure Static Web
  Apps host of ADR 0022 stands unless this slice finds otherwise: read ADRs 0022, 0025 and 0037
  and decide; record it in ADR 0043, which supersedes ADR 0025 (the thin backend) and whatever
  else it reverses. The host's configuration lives in the repository (for Azure Static Web Apps,
  `staticwebapp.config.json` in the app's build: the fallback to `index.html` for the app's
  routes, HSTS and the other security headers L2 asks for, cache headers for hashed files and
  for the service worker). The deploy job stays skipped while its variable is unset, as it is
  today; never deploy, and never create a cloud resource.
- `docs/deployment.md` is rewritten for static hosting: what a person sets up once, the
  settings, and what the redirect and HSTS are. The frontend's dev proxy and anything else that
  pointed at the API go.
- **`AGENTS.md` is brought in line, in this slice only, and only where an ADR says it is out of
  date.** ADRs 0036 to 0042 each list its stale lines under their consequences; this slice adds
  the backend's. Rewrite those lines and sections to say what is true now (no backend, no
  SignalR, no HTTP clients, no marketing application, one class and one course, the `ride`
  application on `api`, `domain`, `components`, `video` and `world`), cut the "Backend" and
  "Backend tests" sections, and keep every rule that still applies word for word. Do not change
  its Purpose, Direction or Design sections, and add no rule of your own. List every changed
  line in ADR 0043 so the owner can review it.

What cannot be proved here: the http redirect and HSTS are the host's behaviour, and no spec may
leave localhost. Prove what can be proved locally (the configuration file is in the build and
says what L2 asks; the app's deep links work from a static server, which the e2e server already
is) and say plainly in the deployment doc and the lessons log what a person checks on the real
host.

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

1. **The host's configuration** (L2-149 AC1, L2-009 AC2): a spec or unit test first for what
   can be tested locally (the build carries the configuration; a deep link to
   `/classes/intervals-to-the-beat/ride` and to an unknown address is answered by the app),
   then the file and the deploy job.
2. **The backend goes:** `backend/`, verify's steps, CI's steps and checkouts, the dev proxy.
3. **Docs:** ADR 0043, `docs/deployment.md`, `README.md`, the detailed designs under
   `docs/detailed-designs/platform/` that describe the backend or hosting, and `AGENTS.md` as
   above.

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

- The film in `docs/videos/28-8-host-as-static-files/`, made as `docs/videos/README.md` says and shaped like
  `docs/videos/30-1-the-one-class/` (copy its `slides.html`, `narration.json` and `film.js` and rewrite the
  middle scenes; the close quotes Telo Ride 1's purpose through `closing()`): screenshots of
  the running app at 390, 768, 1024 and 1440 px with close-ups; no captions burned in; real
  numbers from this machine in the proof scene; look at one frame per scene, the close
  included, before the encode (`--frame`), then encode with `--crf 23`; add its row to
  `docs/videos/README.md`.
- The entry for 28.8 at the top of the log in `docs/lessons-learned.md` and its rows in the
  standing table; 28.8 at 100% with the totals in `docs/detailed-journeys.md` and
  `docs/journeys.md`, kept in agreement (a journey's percentage is its finished days over its
  days; 28.8 is 3 days).
- Add this prompt's row to `docs/prompts/README.md`.

## Deferred

The app as an installable PWA and its offline behaviour beyond what exists (journey 36);
anything the later slices of `docs/detailed-journeys.md` name.

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
