<p align="center">
  <img src="docs/design-system/assets/logo.svg" alt="Telo Ride 1" width="353" height="80">
</p>

# Telo Ride 1

[![CI](https://github.com/QuinntyneBrown/ride-one/actions/workflows/ci.yml/badge.svg)](https://github.com/QuinntyneBrown/ride-one/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Angular 22](https://img.shields.io/badge/Angular-22-DD0031.svg)
![.NET 10](https://img.shields.io/badge/.NET-10-512BD4.svg)

Telo Ride 1, from the Telo family, is the focused edition of Telo Ride: **one class, nothing
else.** It pairs with a smart bike at home over Bluetooth, plays the class video, or draws the
Ibiza Sunset Strip course to music if you choose it, and sets the bike's resistance for every
interval while you pedal. Connect the bike, take the class, see your
number, and come back to beat it.

The frontend is the product: an Angular app that talks to the bike over Web Bluetooth in Chrome or
Edge, and finishes a ride on the device without a network.

## Contents

- [The ride](#the-ride)
- [What Telo Ride 1 leaves out](#what-telo-ride-1-leaves-out)
- [Design](#design)
- [Project status](#project-status)
- [Supported bikes and browsers](#supported-bikes-and-browsers)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Host it](#host-it)
- [Build and test](#build-and-test)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security](#security)
- [Support](#support)
- [License](#license)

## The ride

Four screens, in order:

1. **Connect Bike.** A new rider pairs the bike through the browser's chooser. Telo Ride 1
   remembers it and opens on The Class next time. Bluetooth turned off and an unsupported browser
   each say what is wrong and how to fix it.
2. **The Class.** The home screen, and the only class: **Intervals to the Beat** (GCN Training,
   20:00). It shows the class video, its title and length, a chart of what the bike will do, and
   the choice to ride with the class video or in Ibiza, on the Ibiza Sunset Strip course. One
   button starts it, or says "Connect your bike" when no bike is connected. The header shows the
   connected bike and lets the rider change it. A returning rider also sees how many times they
   have ridden it, and their best and last output.
3. **Class Ride.** The video plays in sync, or the course is drawn as the rider rides, while the
   class's plan sets the target resistance; the rider just pedals. In Ibiza, *Beautiful Boom Bap*
   plays in the background. Power, cadence and the interval countdown sit under the video. It is always
   solo, so the rider can pause, leave or finish.
4. **Class Done.** The ride's output in kJ, in gold when it beats the rider's best, with time,
   average watts and how much of the ride was on target, then the class's efforts as bars. **Done**
   goes back to The Class.

## What Telo Ride 1 leaves out

Everything Telo Ride has beyond the one class: the class library, races, every map and world but
Ibiza Sunset Strip, group classes and live races, XP, rider levels, stars and unlocks, sign-in, and the custom
workout. There are no menus. One thing is not part of the rider's app at all: a diagnostic
recording for a bike that misbehaves, on only when the app is opened with `?diagnose`.

## Design

The design is the **Telo Ride 1** prototype in Magic Patterns: the frames Connect Bike, The Class,
Class Ride and Class Done, and the canvas *The Class · Form Factors*. The screens carry the
**TELO RIDE 1** wordmark, with "RIDE 1" in signal orange.

- **11" tablet in landscape (1194 × 834) and desktop:** The Class fits on one screen with no
  scrolling, the video on the left and the class and its start button in a fixed column on the
  right. Class Ride does not scroll on any landscape screen 768 px wide or more.
- **Phone and tablet in portrait:** one column that scrolls, with the start button pinned to the
  bottom.

Before a screen is built, its states are transcribed from the prototype into
[`docs/mocks/`](docs/mocks/), the source of truth for the code.

## Project status

This repository began as a copy of [Telo Ride](https://github.com/QuinntyneBrown/wattzup) and is
being cut down to Telo Ride 1. What the one class needs is already built there and carried over:

- **The scaffold.** The Angular workspace and libraries, the test harness (fake Bluetooth and API
  fixtures), CI and hosting.
- **Connect a bike.** A simulated bike behind `?simulate`, the browser-support check, pairing,
  remembering the bike, keepalive, reconnecting after a drop and the `ble` status.
- **Live telemetry and resistance control.** Echelon and FTMS notifications decoded into power,
  cadence, speed and resistance; the plan sets target resistance.
- **A solo class.** The video in sync, the plan driving resistance, the clock, pause, leave and
  finish.

Still to do: the change of class to Intervals to the Beat, riding in Ibiza and its music
(`docs/specs/`), The Class and Class Done as Telo Ride 1 designs them, the TELO RIDE 1 wordmark,
keeping the rider's ride count and best and last output, and taking out what Telo Ride 1 leaves
out. The code for those features (the other courses) and the docs that describe them
(the detailed designs and the ADRs) are still Telo Ride's until each is rewritten or removed.
[`docs/journeys.md`](docs/journeys.md) lists what is carried over and what is left to build.

## Supported bikes and browsers

- **Bikes:** full support for the Echelon EX-5s, EX-3, EX-8s and Connect Sport. Other bikes that
  speak the Bluetooth Fitness Machine Service (FTMS) are in beta.
- **Browsers:** Chrome or Edge, over HTTPS (or `http://localhost`), on Windows, macOS, Linux,
  ChromeOS or Android. Safari, Firefox and every browser on iOS have no Web Bluetooth. Connect Bike
  says why the bike cannot be reached there, and how to fix it.

## How it works

```
Smart bike ──BLE──▶ domain/bluetooth ──▶ domain/protocol ──▶ domain/engine ──▶ ride (screens)
                    (Web Bluetooth)      (frames, checksums)  (plan, session)        │
                                                                                     ▼
                                                     video (YouTube player, in sync with the plan)
```

| Project | Responsibility |
|---|---|
| `frontend/projects/api` (`@telo/api`) | Contracts, types and injection tokens |
| `frontend/projects/domain` (`@telo/domain`) | The bike and its rules: `protocol/`, `bluetooth/`, `engine/`, `storage/` |
| `frontend/projects/components` (`@telo/components`) | Presentation components, named as in the design system |
| `frontend/projects/video` (`@telo/video`) | The YouTube player, imported dynamically |
| `frontend/projects/ride` | The app: pages, dialogs and the composition root |

Dependencies run one way, and ESLint enforces it. Every route is lazy-loaded, and only
`domain/bluetooth/` touches `navigator.bluetooth`. The full rules are in [`AGENTS.md`](AGENTS.md)
and [ADR 0024](docs/adr/0024-telo-ride-workspace.md).

## Prerequisites

- [Node.js](https://nodejs.org) 24 or later, with npm
- Chrome or Edge
- To ride real hardware: a supported bike, and a computer, tablet or phone with Bluetooth Low
  Energy turned on

## Getting started

```shell
git clone https://github.com/QuinntyneBrown/ride-one.git
cd ride-one/frontend
npm ci
npm start                                 # http://localhost:4200
```

Open `http://localhost:4200/?simulate` to ride the simulated bike, an Echelon EX-5s that pairs
without the chooser, pedals and reports back every target resistance. A production build ignores
`?simulate`.

With a real bike, open `http://localhost:4200`, press **Connect bike** and pick the bike in the
browser's list. Telo Ride 1 remembers it next time.

### When a bike misbehaves

If a bike will not connect, report pedalling or take a target resistance, open the app with
`?diagnose` on the end of its address (`http://localhost:4200/?diagnose`, or the deployed app's
address; `?simulate&diagnose` records the simulated bike). A **Recording** button appears on every
screen. It records every byte the bike sends and the app writes, what the app decoded from each,
and what the screen showed. Press it to note what the bike's own display reads, to capture the
screen, and to **Save files**: a text recording and a PNG for each capture. Nothing is sent
anywhere, and without `?diagnose` none of it is loaded.
[Diagnostic recording](docs/protocol/diagnostic-recording.md) says how to read the file.

## Host it

Telo Ride 1 is static files, with no backend
([ADR 0043](docs/adr/0043-static-files-on-azure-static-web-apps.md)). Azure Static Web Apps serves
the app's build over HTTPS and redirects plain `http`; the build carries the host's configuration,
`staticwebapp.config.json`: the fallback to `index.html` for the app's routes, the security
headers with a year of HSTS, and the cache rules. Every push to `main` that passes CI is deployed
by the `deploy` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The job is skipped
until the repository variables name the host.

[`docs/deployment.md`](docs/deployment.md) lists the one-time host set-up, the pipeline's
settings, the release steps and what to check on the real host. To serve a production build
locally as that configuration says:

```shell
cd frontend && npm run build              # static files in dist/ride/browser
node scripts/serve-dist.mjs 4300          # http://localhost:4300
```

## Build and test

| Task | Command | Scope |
|---|---|---|
| Format and lint | `cd frontend && npm run format:check && npm run lint` | Prettier, angular-eslint and its dependency boundaries |
| Unit tests | `cd frontend && npm test` | The unit tests of every frontend project, on a fake clock |
| Build | `cd frontend && npm run build` | The production build in `dist/ride/browser`, within the `angular.json` bundle budgets |
| Behaviour specs | `cd frontend && npx playwright install chromium && npm run e2e` | Playwright on Chromium, with page objects, against a fake `navigator.bluetooth`, with no request off localhost |
| Everything | `node tools/verify/verify.mjs` | All of the above, side by side; run it before you push |

No automated test uses a real bike or Bluetooth, or a network beyond localhost. [CI](.github/workflows/ci.yml)
runs lint, the production build and one critical acceptance path per feature in under 5 minutes.
Unit tests run only locally.

## Repository structure

```
ride-one/
├── frontend/                        The Angular workspace and its Playwright specs
│   ├── projects/api/                  @telo/api: contracts, types, tokens
│   ├── projects/domain/               @telo/domain: protocol, Bluetooth, engine, storage
│   ├── projects/components/           @telo/components: presentation components
│   ├── projects/video/                @telo/video: the YouTube player
│   ├── projects/ride/                 The app
│   └── e2e/                           Behaviour specs, fixtures and page objects
├── docs/
│   ├── journeys.md                  The journeys, by value added, with % complete
│   ├── detailed-journeys.md         Each journey split into slices
│   ├── lessons-learned.md           What each slice taught
│   ├── specs/                       Requirements: L1 (high level), L2 (acceptance criteria)
│   ├── detailed-designs/            One design per feature, grouped by subsystem
│   ├── mocks/                       HTML mocks, the source of truth for the UI
│   ├── design-system/               Tokens and components extracted from the mocks
│   ├── adr/                         Architecture decision records
│   ├── protocol/                    Echelon Bluetooth message and frame reference
│   ├── prompts/                     One ready-to-run prompt per slice
│   ├── videos/                      A narrated film of each slice
│   └── deployment.md                Static hosting: set-up, settings, release and checks
├── tools/                           verify, and the video tools: recording, narration and music, the film
└── .github/                         CI workflow, issue and pull request templates
```

The `world` library (`frontend/projects/world`) and the Blender courses (`blender/`,
`tools/blender`) are carried over from Telo Ride's races; riding in Ibiza builds on them, and the
other courses leave in a later change.

## Documentation

| Document | Description |
|---|---|
| [AGENTS.md](AGENTS.md) | Telo Ride 1's purpose and scope, the architecture rules and the required workflow |
| [Mocks](docs/mocks/) | Every page, dialog and state, the source of truth for the UI |
| [Design system](docs/design-system/) | Tokens and components extracted from the mocks |
| [Echelon protocol](docs/protocol/echelon-ble-messages.md) | The Bluetooth messages and their [frames](docs/protocol/echelon-ble-frames.md) |
| [Diagnostic recording](docs/protocol/diagnostic-recording.md) | How to record what a bike and the app said to each other with `?diagnose`, and how to read the file |
| [Architecture decisions](docs/adr/README.md) | Why the architecture is the way it is |
| [Requirements](docs/specs/L1.md) | Telo Ride 1's requirements (L1, with acceptance criteria in [L2](docs/specs/L2.md)) |
| [User journeys](docs/journeys.md) | Telo Ride 1's journeys and progress; slices in [detailed journeys](docs/detailed-journeys.md) |
| [Detailed designs](docs/detailed-designs/README.md) | Telo Ride 1's designs, one per feature, with C4, class and sequence diagrams |
| [Deployment](docs/deployment.md) | Static hosting: the one-time set-up, the pipeline's settings, release and what to check on the host |

## Contributing

Contributions are welcome. Before you open a pull request, read
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow and [`AGENTS.md`](AGENTS.md) for the
architecture rules. In summary:

- If it does not serve the one class, it does not belong in Telo Ride 1.
- Every change to product code needs a requirement, a detailed design and a mock before any code
  is written.
- Work in small slices, and write the failing acceptance test first.
- Keep the requirements, designs, mocks, tests and code consistent with each other.
- Lazy loading and memory come first: a change that grows the initial bundle or leaks memory is
  not done.

## Code of conduct

This project has adopted the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are
expected to uphold this code.

## Security

Do not report security vulnerabilities through public GitHub issues. See [`SECURITY.md`](SECURITY.md)
for how to report one privately.

## Support

See [`SUPPORT.md`](SUPPORT.md) for how to ask a question, report a bug or request a feature.

## License

Copyright (c) 2026 Quinntyne Brown. Licensed under the [MIT License](LICENSE).

Telo Ride 1 is an independent project and is not affiliated with or endorsed by Echelon Fitness or
GCN.
