# 0043. Static files on Azure Static Web Apps: the backend is removed

- **Status:** Accepted
- **Date:** 2026-11-23
- **Carries out:** [0037](0037-no-backend-the-class-ships-with-the-app.md) (the projects, their tests, the CI steps and the hosting)
- **Supersedes:** [0025](0025-thin-dotnet-backend.md), [0026](0026-api-serves-the-app.md)
- **Takes up again:** [0022](0022-hosted-on-azure-static-web-apps.md) (the host), with the changes below
- **Completes:** [0040](0040-four-screens-and-no-menus.md) (`@angular/cdk`, which no dialog uses)

## Context

Since slice 30.1 the app makes no API request (ADR 0042). What was left of `backend/` was health,
serving the app's build from `wwwroot`, an EF Core context with no table, telemetry, the `migrate`
command and 32 tests of those. None of it serves the rider. ADR 0037 gave this slice the removal
and the hosting, and said Azure Static Web Apps (ADR 0022) stands again unless a reason is found
against it.

The requirements: the deployed frontend is static files served over HTTPS with the headers of
L2-131, and every address that matches no file serves the app so its routes work (L2-149 AC1); a
request over `http` is redirected to `https` and responses carry `Strict-Transport-Security`
(L2-009 AC2).

ADR 0026 left Static Web Apps for three reasons: SignalR needed WebSockets, the hub and health
paths could not be proxied, and the session cookie needed one origin with the API. Telo Ride 1 has
no hub (ADR 0038), no cookie (ADR 0039) and no API (ADR 0042). None of the three is left.

Looked for and not found, a reason against:

- **The redirect and the certificate** are the platform's own: Static Web Apps serves HTTPS only
  and redirects plain `http`, on its own host name and on a custom domain with a certificate it
  issues and renews. Nothing in the repository can add them, and nothing needs to.
- **The headers, the fallback and the cache rules** are one file, `staticwebapp.config.json`,
  read from the build.
- **The size.** The Free plan holds 250 MB an app (Azure's quotas, to be read again when the host
  is made). The production build is 171.6 MB in 330 files,
  164.9 MB of it the 192 music tracks of Telo Ride's worlds, which ADR 0042 left for the slices
  that build riding in Ibiza (L2-176 plays one track). It fits; it stops fitting only if the build
  grows by half again. When the other tracks go the build is under 10 MB.
- **The cost.** The Free plan; no service to keep running, no database, no secret.

## Decision

- **The host is Azure Static Web Apps, Free plan.** The `deploy` job uploads
  `frontend/dist/ride/browser/` as it is built. No other host is configured.
- **`backend/` is removed, whole:** the four projects (`Telo.Ride.Domain`, `.Application`,
  `.Infrastructure`, `.Api`), the 15 migrations and the model snapshot, `Telo.Ride.Api.Tests` with
  its 32 tests, the solution, `global.json`, the package and build props, `.editorconfig` and the
  README. The `.gitignore` lines for .NET output go with it. The Azure SQL database and the App
  Service of ADR 0025 and ADR 0026, where a person provisioned them, are no longer deployed to;
  deleting them is that person's step (`docs/deployment.md`).
- **The host's configuration is `frontend/projects/ride/public/staticwebapp.config.json`**, which
  the build copies beside `index.html`. It is the one place the headers are written;
  `backend/src/Telo.Ride.Api/Hosting/security-headers.json` is gone.
  - `navigationFallback` rewrites an address that matches no file to `/index.html`, so the class
    ride's address and an unknown address are answered by the app (L2-149 AC1).
  - Its `exclude` leaves out the asset folders (`/courses/*`, `/draco/*`, `/fonts/*`, `/icons/*`,
    `/machines/*`, `/maps/*`, `/music/*`, and `/riders/*` since ADR 0045) and any address ending in a file extension the build
    uses. A file that is not there is 404, never the app's shell: the service worker would keep a
    200 answer of HTML as the script or font it asked for. No route of the app ends in an
    extension or sits under those folders (L2's open question 19).
  - `globalHeaders` sends, on every answer, the Content Security Policy as ADR 0026 sent it
    (unchanged here; slice 35.1 narrows it to L2-131), `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`,
    `Strict-Transport-Security: max-age=31536000` (L2-009 AC2) and `Cache-Control: no-cache`.
  - `routes` gives the root's `.js` and `.css` files, which the build names by the hash of their
    bytes, `Cache-Control: public, max-age=31536000, immutable`. The routes before it keep
    `no-cache` on the three worker scripts and on `/draco/*`, whose names carry no hash. Every
    other file (`index.html`, `ngsw.json`, the manifest, fonts, the course, the music) is asked
    for again each time and answered 304 when unchanged; the service worker keeps the app's files
    on the device (ADR 0032), so a returning rider pays that once a deploy.
  - **The service worker has a policy of its own** (`/ngsw-worker.js`, `/safety-worker.js`,
    `/worker-basic.min.js`): `connect-src 'self' https://www.youtube.com https://i.ytimg.com
    https://tile.googleapis.com`. A request the page makes goes through the worker once it
    controls the page, under the worker's policy, not the page's; with the page's
    `connect-src` the YouTube player and the class cover fail to load on a second visit. ADR 0022
    found this on the real host. ADR 0026's one header set for every response did not carry it.
  - `mimeTypes` names the manifest, the course (`.glb`), the music (`.ogg`) and `.wasm`.
- **The spec server follows the same file.** `frontend/scripts/serve-dist.mjs` reads
  `staticwebapp.config.json` from the folder it serves and applies `globalHeaders`, `routes`
  (first match), `mimeTypes` and `navigationFallback` with `exclude`. Every behaviour spec runs
  the app under the headers a rider gets, and `e2e/static-host.spec.ts` holds the file to L2. It
  is a stand-in: it reads a pattern as `*` for any characters and `{a,b}` for one of the names,
  and it redirects nothing.
- **The deploy job** (`.github/workflows/ci.yml`) runs on a push to `main` after `lint`, `build`
  and `acceptance` pass, and only when the repository variable `TELO_RIDE_STATIC_WEB_APP` is set.
  It builds the app, appends the commit to `ngsw-worker.js` (a browser installs a worker again
  only when its bytes change, so a change to the worker's headers reaches a worker already
  installed; the worker is not in `ngsw.json`'s hash table, so the stamp breaks nothing), signs
  in with GitHub's OIDC token, reads the deployment token at run time and uploads the build with
  `Azure/static-web-apps-deploy`, building nothing there. The repository stores no secret. The
  variable is new (`TELO_RIDE_WEBAPP` named an App Service), so a repository that still has the
  old one set deploys nothing until a person sets the new one. `TELO_RIDE_DATABASE` is no longer
  read.
- **Verify and CI check the app only.** `tools/verify/verify.mjs` loses "backend format" and
  "backend build and tests". `ci.yml` loses the .NET set-up and the NuGet cache in all four jobs,
  `dotnet format` in `lint`, the API's build in `build`, the backend's tests in `acceptance`, the
  publish and `migrate` steps in `deploy`, and `backend` in every sparse checkout. `lint` and
  `build` check out `frontend`; `acceptance` checks out `frontend` and `tools/blender/courses`,
  whose course file the specs read.
- **Nothing else points at an API.** The service worker's data group for `/api/progress`
  (`ngsw-config.json`) is removed. The frontend had no dev proxy left to remove. The spec
  fixture `ApiFixture` stays as a guard: the app makes no request under `/api/`, and one that it
  made would fail the spec.
- **`@angular/cdk` is removed** from `frontend/package.json`. ADR 0040 kept it for the first
  dialog and gave this slice its removal if none had opened; none has, and nothing imports it.
  The first change that opens a dialog adds it again (`AGENTS.md`, *No inline forms*).

## What is proved, and what a person checks

Proved on this machine by `e2e/static-host.spec.ts`, on the production build:

- the class ride's address and an unknown address are answered 200 with the app, which shows
  World loading and Page not found;
- every answer carries the L2-131 headers and a year of HSTS;
- the hashed files are immutable for a year, and the shell, `ngsw.json`, the worker and the
  manifest are `no-cache`;
- the worker carries its own policy, and with the worker in control of the page the class ride still makes its
  player (`e2e/app-cache.spec.ts`, with YouTube answered by the fixture on the browser context, since a worker's
  requests pass a route on the page);
- a script, a font and a course that are not there are 404;
- the build carries the file, with the fallback and the headers.

Not provable here, because no spec may leave localhost and the redirect is the host's own. A
person checks these on the real host after the first deploy (`docs/deployment.md` has the
commands):

- `http://` answers a redirect to `https://`;
- `https://` answers carry the headers above, on `/`, on a deep link and on a hashed file;
- a missing file is 404 and a deep link is 200;
- on a second visit, with the service worker in control, the class cover and the video load.

## Consequences

- One thing to deploy and nothing to keep running. Verify runs two steps fewer and CI installs no
  .NET SDK.
- 32 backend tests are deleted with the behaviour they proved (health, the API's errors and
  telemetry, the migrations, serving the build, the redirect and HSTS in ASP.NET Core). Serving
  the build, the fallback and the headers are proved again by the seven specs of
  `static-host.spec.ts`; the redirect is the host's and is checked by a person.
- A local production build is served with `node scripts/serve-dist.mjs` from `frontend/`, not by
  the API.
- HSTS is sent without `includeSubDomains` or `preload`: a custom domain's other subdomains are
  not this app's to decide.
- ADR 0019 said this first for Wattzup: the app runs in the browser only. ADR 0025 is superseded
  and nothing replaces it.
- The detailed designs that plan the CDK's `LiveAnnouncer` (slice 36.3) are already answered by
  `LiveRegionAnnouncer` in `domain`; they are corrected when that slice is built.

## `AGENTS.md`, brought in line

ADRs 0036 to 0042 listed the lines of `AGENTS.md` that their changes left out of date and did not
edit it. This change edits it, only on those lines and on the backend's. *Purpose*, *Direction*
and *Design* are unchanged. No rule is added. Every change:

| Section | Was | Is | Why |
|---------|-----|----|-----|
| *Carried over from Telo Ride*, first paragraph | "Its code, docs and tests still hold Telo Ride's other features: races, the World library and its Blender courses (`blender/`, `tools/blender`), the class library, sign-in, progression, group classes and live races, feedback, the custom workout and the `marketing` application. The ADRs still describe Telo Ride; …" | The features are removed from the code and tests, named with the other seven courses and the backend (ADRs 0036 to 0043); what the code still holds beyond the four screens is World loading and the `world` library's other worlds with their music (ADR 0042); "The ADRs before 0036 still describe Telo Ride; …" | ADRs 0039, 0040, 0041, 0042 |
| *Where things are*, first bullet | "holds most of the implementation" | "holds the implementation" | No backend holds the rest |
| *Where things are*, second bullet | "**The backend is carried over, and going.** … Add nothing to it. `backend/README.md` has its commands." | "**There is no backend.** Telo Ride 1 is static files (ADR 0037, ADR 0043): the one class ships with the app and the rider's record stays on the device. Nothing in the app calls an API. The host's configuration is `frontend/projects/ride/public/staticwebapp.config.json`, which the build carries; `docs/deployment.md` has the host's set-up." | ADR 0042, this ADR |
| *Prefer best practice* | "(Angular, .NET, Playwright, WCAG)" | "(Angular, Playwright, WCAG)" | No .NET code |
| *Frontend*, first paragraph | "`api` (contracts, types, injection tokens, and the HTTP and SignalR clients for the backend)" | "`api` (contracts, types and injection tokens)" | ADRs 0038, 0042 |
| *Frontend*, second paragraph | "A further application still needs its own ADR; the `marketing` application (ADR 0027), the one-page site with the pitch film, is the first." | "A further application still needs its own ADR; there is none (ADR 0041)." | ADR 0041 |
| *Frontend*, **Dependency direction** | "…; `api` → nothing; `marketing` → `components`, `api`. No library imports an app." | "…; `api` → nothing. No library imports an app." | ADR 0041 |
| *Frontend*, the contract and token rule | "Each service has a contract and an injection token in `api`; components depend on the token. The SignalR client is one of those services; no component opens its own connection." | The first sentence, word for word; the second is cut | ADRs 0038, 0039 |
| *Backend* and *Backend tests* | Two sections: the projects' dependency direction and ten rules | Cut | ADRs 0038, 0039, this ADR |
| *CI (GitHub Actions)* | (the rule was the last of *Backend*) | "A setting a deployed system needs is documented in the same change.", moved here word for word | It still applies: the deploy job's variables |
| *E2E (Playwright)*, first bullet | "**No real bike, Bluetooth, backend or database.** … API and hub requests are answered by fixtures. An unexpected Bluetooth call, an unanswered request, a request off localhost or a page error fails the spec." | "**No real bike or Bluetooth, and no network beyond localhost.** … the app calls no API, and the YouTube player and the class covers are answered by a fixture. An unexpected Bluetooth call, a request to an API, a request off localhost or a page error fails the spec." | ADR 0038, this ADR |
| *Lazy loading and memory*, **Release everything you acquire** | "… media elements, SignalR handlers, and every Three.js …" | "… media elements, and every Three.js …" | ADR 0038 |
| *Lazy loading and memory*, **Bound what grows** | "(power and cadence traces, command logs, leaderboards)" | "(power and cadence traces)" | ADR 0040 (the command log), ADRs 0036 and 0038 (leaderboards) |
| *Lazy loading and memory*, **Prove it** | "(World Ride, video, live races)" | "(World Ride, video)" | ADR 0038 |
| *Incremental implementation and ATDD*, first paragraph | "(the app, its libraries and the backend)"; "… docs, test-only changes and a marketing site are exempt and get no tests." | "(the app and its libraries)"; "… docs and test-only changes are exempt and get no tests." | This ADR, ADR 0041 |
| *Incremental implementation and ATDD*, second paragraph | "(backend: through the API; frontend: Playwright with page objects)" | "(Playwright with page objects)" | This ADR |

Named by an earlier ADR and kept as they are:

- "`npm start` serves the app; `?simulate` connects to a simulated bike" (ADR 0040 calls it
  right).
- "A contract refuses with an error whose `code` a screen branches on; the rider sees a generic
  message." (ADR 0039). It names no sign-in refusal and is still how `ClassError` and
  `BikeConnectionError` work.
- "**No inline forms.** Button-triggered editing opens a CDK Dialog or navigates to a screen.
  Never hand-roll modals." (ADR 0040). The app has no dialog and no longer depends on the CDK, but
  the rule still binds the first change that edits something, and `AGENTS.md` already says the
  first change that needs a thing a rule names adds it.
