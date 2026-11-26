# Architecture decision records

| ADR | Title | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-finite-plans-replace-step-cycles.md) | Finite plans replace endless step cycles | Accepted |
| [0003](0003-estimated-power-and-no-heart-rate.md) | Estimated power, and no heart-rate sensor | Accepted |
| [0004](0004-sse-and-single-process-in-memory-state.md) | Server-Sent Events and single-process in-memory state | Superseded by 0019 |
| [0005](0005-bundled-self-hosted-fonts.md) | Bundled, self-hosted fonts | Accepted |
| [0006](0006-webgl-trace-with-canvas-fallback.md) | WebGL power trace with a Canvas 2D fallback | Accepted |
| [0007](0007-corebluetooth-first.md) | CoreBluetooth is the first real transport | Superseded by 0019 |
| [0008](0008-corebluetooth-through-the-objective-c-runtime.md) | CoreBluetooth through the Objective-C runtime, in a plain app bundle | Superseded by 0019 |
| [0009](0009-treadmill-as-a-second-machine.md) | The treadmill as a second machine | Superseded by 0016 |
| [0010](0010-treadmill-run-design.md) | The treadmill follows the Run design: the Stride's limits, estimates, and a machine page | Superseded by 0016 |
| [0011](0011-treadmill-behind-a-flag.md) | Treadmill support behind a flag | Superseded by 0016 |
| [0012](0012-youtube-ride-along.md) | Ride along to a YouTube video | Accepted, amended by 0014 |
| [0013](0013-angular-workspace-with-libraries.md) | An Angular workspace with `components`, `api` and `wattzup` projects | Accepted, amended by 0016, 0017, 0019 and 0024 |
| [0014](0014-class-catalogue-as-a-file.md) | A class catalogue in a file, with YouTube thumbnails as covers | Accepted, amended by 0017, 0019 and 0028 |
| [0015](0015-sessions-kept-in-a-file.md) | Sessions kept in a file, computed in Core | Superseded by 0019 |
| [0016](0016-bike-only.md) | Wattzup supports the bike only | Accepted |
| [0017](0017-browser-edition.md) | A browser edition with no backend | Superseded by 0019 |
| [0018](0018-static-content-security-policy.md) | A static Content-Security-Policy for the browser edition | Accepted, amended by 0019 |
| [0019](0019-no-backend.md) | No backend: Wattzup runs in the browser only | Superseded by 0025 |
| [0020](0020-three-js-for-world-ride.md) | Three.js draws the World Ride scene, in its own lazy chunk | Accepted, amended by 0021 and 0030 |
| [0021](0021-webgpu-renderer-with-webgl2-fallback.md) | World Ride draws with Three.js's WebGPU renderer, falling back to WebGL2 | Accepted, amended by 0023 and 0030 |
| [0022](0022-hosted-on-azure-static-web-apps.md) | Hosted on Azure Static Web Apps, deployed from main | Superseded by 0026; its host taken up again by 0043 |
| [0023](0023-bend-the-road-in-the-vertex-stage.md) | World Ride bends the road in the vertex stage | Accepted |
| [0024](0024-telo-ride-workspace.md) | The Telo Ride workspace: `api`, `domain`, `components` and `ride` | Accepted |
| [0025](0025-thin-dotnet-backend.md) | A thin .NET backend for what one browser cannot do alone | Superseded by 0037 and 0043 |
| [0026](0026-api-serves-the-app.md) | One App Service: the Telo Ride API serves the app and its backend as one origin | Superseded by 0037 and 0043 |
| [0027](0027-marketing-site.md) | The marketing site: a `marketing` application with the pitch film | Superseded by 0041 |
| [0028](0028-class-catalogue-shipped-with-the-backend.md) | The class catalogue: a JSON file shipped with the backend, public, cached on the device | Superseded by 0037 and 0042 |
| [0029](0029-map-catalogue-shipped-with-the-backend.md) | The map catalogue: a JSON file shipped with the backend, public, cached on the device | Superseded by 0037 |
| [0030](0030-world-library-carried-from-main.md) | World Ride's rendering is carried from `main` into a lazy `world` library | Accepted |
| [0031](0031-sign-in-code-email-over-smtp.md) | Sign-in codes are emailed over SMTP with MailKit | Superseded by 0037 |
| [0032](0032-register-the-service-worker-from-the-first-screen.md) | The service worker is registered from the first screen's lazy chunk | Accepted |
| [0033](0033-same-origin-proof-instead-of-anti-forgery-tokens.md) | A same-origin proof, not anti-forgery tokens, guards every change | Superseded by 0037 |
| [0034](0034-maps-built-in-blender.md) | Maps are built in Blender from the class they are modelled after, and ridden by the clock | Proposed |
| [0035](0035-every-map-a-course.md) | Every map in the catalogue is a course, built to its listed distance and climbing | Proposed |
| [0036](0036-no-races-in-telo-ride-1.md) | Telo Ride 1 has no races; the World is kept for riding the class | Accepted |
| [0037](0037-no-backend-the-class-ships-with-the-app.md) | Telo Ride 1 has no backend: the class ships with the app | Accepted |
| [0038](0038-always-solo-no-ride-hub.md) | Telo Ride 1 is always solo: no ride hub | Accepted |
| [0039](0039-no-account-nothing-signed-in-recorded-or-earned.md) | Telo Ride 1 has no account: nothing is signed in, recorded or earned | Accepted |
| [0040](0040-four-screens-and-no-menus.md) | Telo Ride 1 has four screens and no menus | Accepted, amended by 0048 and 0049 |
| [0041](0041-one-application-the-marketing-site-is-removed.md) | One application: the marketing site is removed | Accepted |
| [0042](0042-one-class-and-one-course-shipped-with-the-app.md) | One class and one course, shipped with the app | Accepted |
| [0043](0043-static-files-on-azure-static-web-apps.md) | Static files on Azure Static Web Apps: the backend is removed | Accepted |
| [0044](0044-the-class-offers-two-ways-to-ride.md) | The Class offers two ways to ride, wired to the two rides the app has | Accepted |
| [0045](0045-the-courses-rider-built-in-blender.md) | The course's rider is one mesh built in Blender, carried over from Telo Ride | Accepted |
| [0046](0046-class-ride-at-ride-behind-a-connected-bike.md) | Class Ride is at `/ride`, and only a connected bike opens it | Accepted, narrowed by 0049 |
| [0047](0047-a-ride-in-ibiza-is-class-ride-with-the-course-in-the-box.md) | A ride in Ibiza is Class Ride with the course in the video's box; World loading and Telo Ride's worlds are removed | Accepted, amended by 0049 and 0050 |
| [0048](0048-diagnostic-recording-behind-configuration.md) | Diagnostic recording behind configuration | Accepted |
| [0049](0049-a-ride-is-shaped-like-a-race-for-one.md) | A ride is shaped like a race for one: five screens, with Ibiza Flyover before a ride in Ibiza | Accepted, amended by 0050 |
| [0050](0050-intensity-and-the-sound-of-a-ride-in-ibiza.md) | Intensity for every ride, and four sounds for a ride in Ibiza, one of them YouTube with its picture hidden | Accepted |
