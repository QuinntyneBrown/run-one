# 0017. A browser edition with no backend

- **Status:** Superseded by [0019](0019-no-backend.md) (the browser edition is now the only Wattzup); previously amended by [0018](0018-static-content-security-policy.md)
- **Date:** 2026-11-19
- **Amends:** [0004](0004-sse-and-single-process-in-memory-state.md), [0013](0013-angular-workspace-with-libraries.md), [0014](0014-class-catalogue-as-a-file.md), [0015](0015-sessions-kept-in-a-file.md)

## Context

Wattzup runs as a .NET backend next to the bike that talks to it over Bluetooth and serves the
Angular app (ADR 0004). To ride, the rider installs and starts that backend on a computer within
Bluetooth range, keeps it running, and opens the app from the same machine or another device.

Chromium browsers (Chrome and Edge on Windows, macOS, Linux, ChromeOS and Android) can reach a
Bluetooth Low Energy device directly through Web Bluetooth. Everything the backend does for the
bike — connect, decode, command, run the workout, keep the history — can then run inside the page.
L1-016 asks for that: a browser edition served as static files, with no Wattzup process to install.

The constraints differ from the backend's:

- A page reaches a device only after the rider picks it in the browser's own device chooser, which
  opens only in answer to a tap or click. It cannot scan in the background as L2-001 does.
- Safari, Firefox and every browser on iOS have no Web Bluetooth.
- A hidden tab's timers are throttled, to once a minute after 5 minutes hidden.
- A page has no file system and no server log; storage is per origin and can be cleared.
- The protocol and business rules live in `Wattzup.Protocol` and `Wattzup.Core`, in C#.

## Decision

**Wattzup also ships as a browser edition: the same Angular app, built with a second composition
root that binds every `@wattzup/api` contract to an in-browser implementation in a new
`@wattzup/browser` library.** The backend edition is unchanged and remains the reference.

- `@wattzup/browser` holds the browser's Bluetooth link, TypeScript mirrors of the protocol and
  workout rules under the same names as their .NET types, IndexedDB storage, and the in-browser
  contract implementations (`docs/detailed-designs/browser-edition/`).
- A `browser` build configuration of the `wattzup` project swaps `app.config.ts` for
  `app.config.browser.ts`, the only file that imports `@wattzup/browser`. It is not a second
  application; the backend edition's bundle never contains the library.
- Live state reaches `LiveStateService` through a new `LIVE_STATE_SOURCE` contract: the event
  stream in the backend edition, the in-browser state store in the browser edition. An `EDITION`
  token lets the few screens that differ branch on the edition, never on a build flag.
- A rule that lives in both editions is changed in both in the same change, and each is proven by
  the same table of cases; the .NET tests are the reference.
- Sessions are kept in IndexedDB in the shape of the backend's session record, with export and
  import of the same file format (amends 0015). The class catalogue is `classes.json` beside
  `index.html` (amends 0014). There is no event stream, API key or server process (amends 0004).
- The browser edition needs Chrome or Edge over HTTPS; elsewhere it says so and keeps the class
  library and past rides readable.

## Consequences

- The rider can ride with nothing installed, from any Chromium browser near the bike, including an
  Android tablet on the handlebars.
- The protocol and engine rules exist twice. Parity tests and the same-change rule keep them
  aligned; a drift is a bug in the browser mirror.
- History lives in one browser on one device unless the rider exports it. The edition asks for
  persistent storage and offers export and import.
- The workout clock reads a monotonic clock, not counted ticks, so a throttled tab does not stretch
  a ride; the screen is kept awake during a ride.
- Picking the bike needs one tap per browser, and per visit where the browser cannot remember it.
- AGENTS.md describes both editions; the folder tree gains `frontend/projects/browser/`,
  `app.config.browser.ts` and `frontend/e2e/browser/`.
