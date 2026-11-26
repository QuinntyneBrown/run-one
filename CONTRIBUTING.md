# Contributing to Wattzup

Thank you for your interest in Wattzup. This guide explains how to propose a change and what a
pull request needs before it can be merged.

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md).

## Contents

- [Ways to contribute](#ways-to-contribute)
- [Before you start](#before-you-start)
- [How a change is made](#how-a-change-is-made)
- [Development setup](#development-setup)
- [Coding conventions](#coding-conventions)
- [Testing](#testing)
- [Commits and pull requests](#commits-and-pull-requests)
- [Licensing of contributions](#licensing-of-contributions)

## Ways to contribute

- **Report a bug.** Open an issue with the steps, what you expected and what happened. Include
  the bike model, your operating system and, for anything about the bike, a diagnostic
  recording: open the app with `?diagnose`, reproduce the problem, note what the bike's own
  display reads, and attach the saved `telo-ride-1-recording-….log` (and a screen capture if you
  made one). [Diagnostic recording](docs/protocol/diagnostic-recording.md) has the steps and
  says what the file holds; read it before you share it.
- **Suggest a feature.** Open an issue saying who it is for and how it helps a rider.
- **Improve the documentation.** Requirements, designs and mocks are all in `docs/` and welcome
  corrections.
- **Implement a feature.** The features are listed in
  [`docs/detailed-designs/README.md`](docs/detailed-designs/README.md); each traces to its
  requirements in `docs/specs/L2.md`.
- **Test on your hardware.** Running the hardware smoke test (scan, connect, receive cadence, set
  resistance) on another bike model or platform and reporting the result is a real help.

Security vulnerabilities are never reported in a public issue; see [`SECURITY.md`](SECURITY.md).

## Before you start

1. Read [`AGENTS.md`](AGENTS.md). It is the single source of the repository's rules, and it applies
   to people and coding agents alike.
2. Read the architecture decision records in `docs/adr/` for the area you will change.
3. For anything larger than a small fix, open an issue first so the approach can be agreed before
   you write code.

Every change serves what Wattzup is for: turning an Echelon bike into a live training display,
with real-time cadence, speed and resistance and interval workouts that set the resistance for
the rider. A change that cannot be traced back to that does not belong here.

Use the words the requirements use (`docs/specs/`) in code, docs and UI; do not invent synonyms.

## How a change is made

Wattzup is built requirement first and test first.

1. **Requirement.** Every change to production behaviour has a requirement with acceptance
   criteria in `docs/specs/`.
2. **Detailed design.** The feature has a design in `docs/detailed-designs/`.
3. **Mock.** Every screen and state the change touches has a mock in `docs/mocks/`. The mocks are
   the source of truth for the UI.
4. **Slices.** The work is planned as small, reviewable slices.
5. **Acceptance test first.** For each slice, write the Given-When-Then criteria and the
   acceptance test, and run it to prove it fails for the expected reason before writing production
   code.
6. **Implement, then refactor** with the tests green, and run the regression checks before the
   next slice.

Documentation-only, mock-only, design-system-only and test-only changes do not need steps 1 to 3
unless they are part of a production behaviour change. Do not write tests for mocks or the design
system, and never add architecture tests (tests that assert the shape of the code rather than its
behaviour).

## Development setup

Follow [Getting started](README.md#getting-started) in the README. In short, you need Node.js 24
with npm and Chrome or Edge, and no bike:

```shell
cd frontend && npm ci && npm start    # then open http://localhost:4200/?simulate
```

The prototype the rewrite replaces is in `../wattzup-prototype/` beside this repository; read it
there as the reference for behaviour.

## Coding conventions

- Prettier owns formatting and angular-eslint owns lint; CI fails on either.
- Standalone components, signals and OnPush change detection.
- One type per file, and no single-file components: `name.ts` + `name.html` + `name.scss`.
- Selectors use `wz-*`; class, file and folder names omit the prefix.
- Presentation components go in the `components` library, named as in the design system, and
  take inputs and emit outputs; the contracts and their types go in the `api` library; their
  in-browser implementations (protocol, Web Bluetooth, engine, storage) in the `browser` library;
  everything else is the `wattzup` app (`frontend/projects/`, ADR 0013).
- Only `@wattzup/browser`'s `lib/bluetooth/` touches `navigator.bluetooth`.
- Keep the state and session shapes (snake_case names, nulls written) stable, so exported
  histories keep importing.
- A contract refuses with a `ContractError` whose `code` a screen branches on.
- Read design tokens by role, never hex values.
- Button-triggered editing opens a CDK Dialog or navigates to a screen; no inline forms.
- Every interaction works with touch and with the keyboard, colour is never the only carrier of a
  state, and motion respects `prefers-reduced-motion`.

## Testing

- **No automated test uses a real bike or Bluetooth.** Unit tests advance a fake clock instead of
  sleeping; behaviour specs run against a fake `navigator.bluetooth` that records every write.
- Use the Page Object Model: selectors live in page objects, never in a spec.
- Run frontend tests in Chromium only.
- Do not run the visual, responsive or accessibility sweeps or update baselines unless the
  repository owner asks; do keep them current.
- Hardware smoke tests are run by hand with a real bike.

The commands for each suite are in the README under
[Build and test](README.md#build-and-test). A change is done when format, lint, unit tests, the
production build and the behaviour specs pass (`node tools/verify/verify.mjs`).

## Commits and pull requests

- Branch from `main`; never commit to `main` directly.
- Keep each pull request to one concern, and each commit to one slice.
- Write commit subjects in the imperative mood, as a sentence that says what the change does
  (for example, "Decode cadence from workout data packets").
- Fill in the pull request template: what changed, why, the requirement it satisfies and how it
  was tested.
- Keep the requirement, detailed design, mock, tests and code in agreement within the same pull
  request.
- CI must be green before review.

## Licensing of contributions

Wattzup is licensed under the [MIT License](LICENSE). By submitting a contribution you agree that
it is licensed under the same terms, and you confirm that you have the right to submit it.
