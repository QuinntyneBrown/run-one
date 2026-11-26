## Purpose

> Telo Ride 1, from the Telo family, is the focused edition of Telo Ride: one class, nothing
> else. It pairs with a smart bike at home over Bluetooth, plays the class video, or draws the
> Ibiza Sunset Strip course to music if the rider chooses it, and sets the bike's resistance for
> every interval while the rider pedals. Connect the bike, take the class,
> see your number, and come back to beat it.

**Direction.** Telo Ride 1 is Telo Ride with everything but one class taken away. It has five
screens and no menus:

1. **Connect Bike**: pair the bike once; it is remembered. A new rider starts here.
2. **The Class**: the home screen and the only class, **Intervals to the Beat** (GCN Training,
   `intervals-to-the-beat`, 20:00): its video, title, length, a chart of what the bike will do,
   the choice to ride with the class video or in Ibiza (**Ibiza Sunset Strip**, the only course,
   built in Blender from the class's plan), and one start button ("Connect your bike" when no
   bike is connected). A returning rider also sees their ride count, best output and last output.
3. **Ibiza Flyover**: before a ride in Ibiza only, the course seen from above, start to finish,
   while it loads; the camera lands on the grid. The rider can skip it or cancel. It never holds
   the ride: it gives way if the course cannot be drawn, and is not shown with reduced motion.
4. **Class Ride**: a countdown ("3, 2, 1, Go!"), then the video in sync, or the course drawn as
   the rider rides, while the class's plan sets target resistance; the rider just pedals. An
   intensity control from 0 to 10, like a volume control, makes every interval from then on
   harder or easier (5 is the class as it is). In Ibiza the rider chooses the sound: one track,
   *Beautiful Boom Bap* (Music_Unlimited, Pixabay), the marketing film's music, self-hosted; no
   music; a YouTube video in the course's top-right corner (a default video or the class video,
   in time with the ride); or that video's audio alone (ADR 0050). Always solo, so the rider can
   pause, leave or finish.
   At 20:00 a finish banner shows the output, the target resistance eases off, and the video or
   the course carries on for a few seconds (the roll-out) before Class Done opens on its own.
5. **Class Done**: the ride's output in kJ (in gold for a new best), time, average watts, how much
   of the ride was on target, and the class's efforts. When the ride ended at an intensity other
   than the rider's default, it asks whether that should be the default, kept on the device.
   **Done** returns to The Class.

A ride borrows a race's shape and nothing else: the flyover, the countdown and the finish banner
are for one rider alone, with no other riders, positions, laps or places (ADR 0049).

Telo Ride 1 has no class library, races, maps or worlds beyond Ibiza Sunset Strip, music beyond
that one track and the YouTube video the rider chooses in Ibiza, group classes or live races, XP, rider
levels, stars or unlocks, sign-in, or custom workout. One thing sits behind configuration and is
no part of the rider's app: the diagnostic recording (L2-178, ADR 0048), on only when the app is
opened with `?diagnose`, for finding why a bike will not connect, report pedalling or take a
target resistance. Before adding or changing anything, ask how
it serves connecting the bike and taking the one class; if it does not, do not build it, and if a
request works against it, say so.

The mission, Telo Ride 1's single L0 requirement, is not written yet. When it is, it goes in
`docs/specs/L0.md` and this section quotes it word for word; everything then points back to it.
Do not invent a mission in its place.

## Design

The mocks in `docs/mocks/` are the design and the source of truth: every screen in every state,
with `docs/mocks/manifest.json` listing them. `docs/specs/`, the ADRs, `docs/detailed-designs/`
and the code follow the mocks. When a mock changes, the requirement, the ADR it touches and the
detailed design are brought in line with it in that order, before any code.

The mocks copy the **Telo Ride 1** prototype in Magic Patterns (the *Echelon Bike Telemetry
Dashboard* OS): the frames Connect Bike, The Class, Ibiza Flyover, Class Ride and Class Done, and
the canvas *The Class · Form Factors*. Its own design threads hold the decisions behind it.
`docs/mocks/README.md` says where the mocks depart from the prototype, and why.

- **Wordmark:** **TELO RIDE 1**, the Telo Ride lockup with "RIDE 1" in signal orange, on every
  screen. It is "1", never "One" or "I".
- **11" tablet in landscape (1194 × 834) and desktop (1024 px wide and up):** The Class fits on
  one screen with no scrolling; the video takes the height left and stays 16:9, and the class
  details and start button sit in a fixed column on the right. Class Ride does not scroll on any
  landscape screen 768 px wide or more.
- **Phone and tablet in portrait:** one column that scrolls, with the start button pinned to the
  bottom and clear of the home bar.
- **The shape of a ride:** Ibiza Flyover is the course edge to edge between a bar and a band, so
  no word lies on the course. On Class Ride the countdown, the finish banner and the roll-out lie
  inside the video's or the course's box, above the bike panel and its stepper.

Before a screen is built or changed, its states are drawn in `docs/mocks/`. The mocks' numbers
(6 rides, a 342 kJ best, a 351 kJ finish) are the cast, not rules.

The prototype disagrees with the mocks in places, and there the mocks stand. It was drawn for an
earlier class, 30 Minute HIIT Cardio, and later for one called 20 Minute HIIT on a 3.2 km loop,
and it has no music; the mocks draw Intervals to the Beat, the course as built and the Music
button. The prototype's newest Class Ride (the video or the course edge to edge under the
readouts, no stepper, efforts called "drops") is not in the mocks and is not adopted: only the
flyover, the countdown, the finish banner, easing off and the roll-out are (ADR 0049;
`docs/specs/L2.md`, open questions 39 and 40).

## Carried over from Telo Ride

This repository began as a copy of Telo Ride. Telo Ride's other features are removed from its
code and tests: races, the class library and the other seven courses, sign-in, progression, group
classes and live races, feedback, the custom workout, the `marketing` application and the backend
(ADRs 0036 to 0043), and World loading, the `world` library's other worlds and their music
(ADR 0047). The code holds all five screens, with the flyover, the countdown, the finish
banner and the roll-out built (ADR 0049, journey 39). The ADRs
before 0036 still describe Telo Ride; `docs/specs/`,
`docs/journeys.md`, `docs/detailed-journeys.md`, `docs/mocks/` and `docs/detailed-designs/` are
rewritten for Telo Ride 1.

- Keep and build on what the five screens need: the Bluetooth link, the protocol, the engine, the
  simulated bike, the video library, the solo class ride and its result, and, for riding in
  Ibiza, the Ibiza Sunset Strip course, its Blender build and the course renderer in `world`.
- Do not extend a feature Telo Ride 1 leaves out. Removing one is a change of its own, with its
  requirement, docs and tests cut down in the same change, and an ADR where it reverses one.
- When a doc is rewritten for Telo Ride 1, it says so and drops what Telo Ride 1 leaves out.

## Where things are

- **The frontend is the product.** `frontend/` is an Angular workspace and holds the
  implementation: Web Bluetooth connectivity, the protocol, the workout engine, sessions and
  every screen. It runs in Chrome or Edge; a ride finishes on the device without a network.
- **There is no backend.** Telo Ride 1 is static files (ADR 0037, ADR 0043): the one class ships
  with the app and the rider's record stays on the device. Nothing in the app calls an API. The
  host's configuration is `frontend/projects/ride/public/staticwebapp.config.json`, which the
  build carries; `docs/deployment.md` has the host's set-up.
- Before building a feature, read its requirement (`docs/specs/`, `docs/journeys.md`), its
  detailed design (`docs/detailed-designs/`) and its mocks (`docs/mocks/`, the source of truth
  for the UI; `docs/design-system/` is extracted from them). Where those still describe only
  Telo Ride, bring the feature's requirement, design and mock in line with Telo Ride 1 first.
- Read the relevant ADRs in `docs/adr/` before changing the areas they cover.
- Where a rule below names something that does not exist yet (a project, a command, a fixture,
  a helper, a folder), the first change that needs it adds it.
- Run npm commands from `frontend/`. `npm start` serves the app; `?simulate` connects to a
  simulated bike. `node tools/verify/verify.mjs` runs every CI check and the unit tests
  locally; run it before pushing.

Use the words the specs use in code, docs and UI; no synonyms. The bike's reported level is
"resistance", the requested one "target resistance"; the Bluetooth link state is `ble`. The
screens are Connect Bike, The Class, Ibiza Flyover, Class Ride and Class Done; the ride's setting from 0 to 10 is
its "intensity", and what plays in Ibiza its "sound"; a ride's result
is its "output" in kJ, and the class's hard intervals are its "efforts". The course seen from
above is the "flyover", the three seconds before the clock starts the "countdown", the banner
at 20:00 the "finish banner", and the seconds after it the "roll-out".

## Prefer best practice

Choose the platform's established best practice (Angular, Playwright, WCAG) over the
expedient way. A departure needs an ADR giving its reason. If a rule here or in an ADR conflicts
with best practice, say so and propose the correction; do not work around it silently.

## Frontend

A multi-project workspace under `frontend/projects/`. The baseline is three libraries, `api`
(contracts, types and injection tokens), `domain`
(the bike and its rules: `protocol/`, `bluetooth/`, `engine/`, `storage/`) and `components`
(presentation), and one application, `ride`. A `video` library (the YouTube player, imported
dynamically) and a `world` library (the Ibiza Sunset Strip course's renderer, imported dynamically, ADRs
0030 and 0047) have joined them.

That baseline is where the organisation starts, not a limit on it. When a concern earns its own
library (a `browser` project for browser-only implementations, as `world` is for the course's
rendering, and so on), add it. A smaller, focused library that can be lazy-loaded on its own is
better than one that keeps growing. A further application still needs its own ADR; there
is none (ADR 0041).

- **Dependency direction.** `ride` → `components`, `api`, `domain`, `video`, `world`; `domain` →
  `api`; `components` → `api` for types only; `video` → `api`; `world` → `api`; `api` → nothing.
  No library imports an app. `ride`'s
  `app.config.ts` is the composition root and binds every token, except those the first screen
  brings, which the lazy parent route in `ride.routes.ts` binds so their code stays out of the
  initial bundle. ESLint enforces it. A new library takes its place in this direction, and the
  same change adds it to this rule and to the ESLint boundaries; it never depends on `ride`,
  and `api` still depends on nothing. The diagnostic recording's code has entry points of its
  own, `@telo/domain/diagnostics` and `@telo/components/diagnostics`, which only `ride` imports,
  and only from the chunk it loads with `?diagnose`; the libraries' main entry points export
  none of it, so no chunk a rider loads holds it (ADR 0048).
- Protocol rules (framing, checksums, command bytes) live in `domain`'s `protocol/` only;
  business rules (workout stepping, target vs. actual resistance, sessions) in `engine/`.
  Nothing outside `bluetooth/` touches `navigator.bluetooth`. Every feature runs end to end
  against the simulated bike.
- Prettier and angular-eslint own formatting and lint; CI fails on either.
- Current Angular: standalone components, signals for state, `OnPush` everywhere, zoneless.
- **Lazy loading and memory management come first.** They outrank convenience and any other
  frontend rule they conflict with; see *Lazy loading and memory* below.
- Selectors are `wz-*`; class, file and folder names omit the prefix.
- **Presentation lives in `components`.** A presentation component takes inputs, emits outputs
  and injects no app service, token or router. Pages and dialogs that orchestrate stay in the
  app.
- **File per type.** A component is `name.ts` + `name.html` + `name.scss` with
  `templateUrl`/`styleUrl`, never inline `template`/`styles`. No inline `style` in templates.
- **One encapsulated BEM stylesheet per component.** Default encapsulation, never
  `ViewEncapsulation.None`. The component is the block, named as in the design system;
  `block__element`, `block--modifier`; a state assistive technology must know is an attribute
  (`aria-current`, `aria-invalid`, `aria-pressed`, `disabled`) and is styled through it. Never
  style another component's block. Keep the mocks' BEM classes: e2e locators depend on them.
- Global styles are foundations only (tokens, `@font-face`, reset, utilities). Read tokens by
  role, never hex. Fonts are bundled and self-hosted, never loaded from a CDN.
- **Declare each `ng-content` slot once.** A component rendering `<a>` or `<button>` by
  condition puts its slots in one `<ng-template>` rendered with `ngTemplateOutlet` in both
  branches. A consumer `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011): one `@if`
  per node.
- Logic with many cases (a store, a tracker, a pure helper) lives in a service or helper with
  its unit tests, never in a component.
- Each service has a contract and an injection token in `api`; components depend on the token.
- **No inline forms.** Button-triggered editing opens a CDK Dialog or navigates to a screen.
  Never hand-roll modals. The diagnostic recording's dialog is the one exception: it is the
  platform's `<dialog>` element, because the CDK would grow every rider's initial bundle for a
  dialog no rider can open (ADR 0048).
- A contract refuses with an error whose `code` a screen branches on; the rider sees a generic
  message. Device names and error strings are data, rendered as text, never as HTML.
- Every interaction works by touch on a phone and by keyboard on a desktop; touch targets are
  at least 44 × 44 px; colour is never the only carrier of a state.

## E2E (Playwright)

- **No real bike or Bluetooth, and no network beyond localhost.** A fixture installs a fake
  `navigator.bluetooth` that records every write and pushes notifications on demand; the app
  calls no API, and the YouTube player and the class covers are answered by a fixture. An
  unexpected Bluetooth call, a request to an API, a request off localhost or a page error fails
  the spec. Hardware smoke tests are run by a
  person, never by an agent or CI.
- Page Object Model: one page object per screen or dialog owns the selectors. Never put a
  selector in a test. Specs import `test`/`expect` from the shared fixture.
- Only behaviour specs run by default. Visual, responsive and accessibility sweeps are written
  and kept current but run only when a person asks; no agent runs them or updates baselines
  unprompted. Update baselines only for intentional design changes, after changing the mock.
- Chromium only; never configure or run another browser.
- In unit tests, time-driven rules (keepalive, retries, workout ticks) advance a fake clock;
  never sleep.

## CI (GitHub Actions)

- The pipeline is always green and finishes in under 5 minutes in total. A flaky or slow check is
  fixed or removed, never retried.
- It runs only the few highest-value tests per feature: lint, build and one critical acceptance
  path each. Unit tests run locally, never in CI.
- A setting a deployed system needs is documented in the same change.

## Lazy loading and memory (the top frontend priority)

The rider runs Telo Ride 1 for an hour or more on a tablet or low-power laptop beside the bike, and
it has to stay as smooth at the end of the ride as at the start. A change that grows the initial
bundle or leaks memory is not done, whatever else it achieves.

- **Load only what is needed now.** Every route uses `loadComponent`/`loadChildren`; heavy or
  below-the-fold UI uses `@defer`; large libraries (Three.js, the course's renderer, video, charts) and
  whole feature libraries are imported dynamically, never from the initial chunk. Keep the
  initial bundle small and the `angular.json` budgets tight; raising a budget needs a reason in
  the change.
- **Release everything you acquire.** Whatever a component, service or scene creates, it tears
  down when its owner is destroyed: subscriptions (`takeUntilDestroyed`/`DestroyRef`), timers,
  intervals and `requestAnimationFrame` loops, event and Bluetooth notification listeners,
  observers, `AbortController`s, object URLs, media elements, and every
  Three.js geometry, material, texture, render target and renderer (`dispose()`).
- **Bound what grows.** Live data held during a ride (power and cadence traces, the diagnostic
  recording) uses a fixed-size
  or windowed buffer, or is persisted and dropped from memory.
  Nothing accumulates without a limit for the length of a ride.
- **Scope state to its use.** Provide services at the route or component that needs them, not
  in `root`, unless the whole app shares them. A screen's state goes when the rider leaves it.
- **Prove it.** Leaving a screen returns its memory: a feature that allocates heavily (the
  course, video) is checked for a stable heap across repeated enter and leave, and
  like the visual and accessibility sweeps, these heap checks run only when a person asks.

## Low-power rendering

The frontend, the course's rendering (Three.js, WebGPU, TSL) and their detail are scaled back to run
smoothly on low-power devices, while still using every technique the reference projects teach
for a beautiful, realistic, high-quality picture. Choose the cheap form of a technique (baked,
lower resolution, fewer samples, LOD) before dropping it.

## Incremental implementation and ATDD (mandatory for product code)

Every change to user-impacting product code (the app and its libraries) needs a
requirement, a detailed design and a mock before implementation, and is built incrementally.
Mocks, designs, the design system, docs and test-only changes are exempt and get no tests.

Before writing product code, invoke and follow the `implementing-incrementally` skill, with ATDD:
plan small slices and finish one at a time. For each, write Given-When-Then criteria, write the
acceptance test (Playwright with page objects), run it to
prove it fails for the expected reason, then implement only that slice, refactor green and run
the regression checks before the next. No bulk implementation, no tests added afterwards, no
weakening tests to pass. Keep requirement, design, mock, tests and code aligned throughout.

Never write architecture tests: no structure, layout, naming, banned-API or spec-traceability
tests. A test suite proves behaviour.

## Lessons learned and progress

Before a slice of `docs/detailed-journeys.md`, read `docs/lessons-learned.md` and apply the lessons
that fit. When the slice finishes, before it merges, add its entry there (what slowed it, new
lessons, and how each earlier lesson it applied worked) and update **% complete** in
`docs/detailed-journeys.md` and `docs/journeys.md`.
