# 0047. A ride in Ibiza is Class Ride with the course in the video's box; World loading and Telo Ride's worlds are removed

- **Status:** Accepted, amended by [0049](0049-a-ride-is-shaped-like-a-race-for-one.md) (Ibiza Flyover comes before a ride in Ibiza, and the clock starts on "Go!")
- **Date:** 2026-11-23
- **Carries out:** [0042](0042-one-class-and-one-course-shipped-with-the-app.md) and [0044](0044-the-class-offers-two-ways-to-ride.md) ("journey 37 replaces World loading and the inset video")
- **Narrows:** [0030](0030-world-library-carried-from-main.md) (the `world` library holds one course's renderer and nothing else)

## Context

Since slice 30.2 "Ibiza Sunset Strip" opened the ride carried over from Telo Ride (ADR 0044): World
loading, a screen of its own with a load card, a plan chart and "Back to class", which
downloaded and built the course before the rider could press Start riding; then the course with
the class video inset in its corner, and the course's deep house track when the video could not
play. L2-174 and L2-175 ask for something else. Telo Ride 1 has four screens, so there is no
loading screen; the ride starts when the rider presses the start button; the course takes the
video's box and no video player is loaded; and the rider is alone on the road.

The `world` library also still held all of Telo Ride's World Ride: 191 files and 116,049 lines,
of which Ibiza Sunset Strip's renderer uses 37 and their unit tests. `public/music/` held the 192 tracks of the
worlds' playlists, 165 MB, and the production build was 214,928 KB in 331 files.

## Decision

- **No screen before the ride.** `ClassRidePage` is the ride itself, whichever way it is ridden;
  `ClassRideSession` is merged into it. `ClassRideStore` reads how the rider chose to ride and
  starts the clock, the ticker and the plan at once, so the first segment's target resistance is
  sent while the course loads (L2-175 AC1). World loading goes with everything only it used: its
  store and view, the world downloader (`WORLD_DOWNLOADER`, `FetchWorldDownloader`, the
  `telo-worlds` cache name), the panorama path, the load card and steps, the plan chart
  (`ClassPlan`), `BackLink`, `Banner`, `Pill`, `Progress`, and `PlanSummary.outline` and
  `structure`.
- **The course in the video's box, and no video.** In Ibiza the page renders `wz-class-course`
  (block `class-course`, in `components`) in the place of `wz-class-video`. It shows the course's
  still under "Loading Ibiza Sunset Strip" (`role="status"`) until the course's first frame is
  drawn, then the course. `wz-class-video` is not rendered, so no player is created, no request
  goes to YouTube, and the video's stall watch is not asked. `ClassVideo` loses its `inset` form.
- **The renderer loads when the ride opens, not before.** The directive `CourseSceneHost`, on the
  node projected into the box, imports `@telo/world` when it is created and creates the library's
  `CourseScene` there. The route binds `COURSE_RENDERER` to a second dynamic import inside the
  library, so Three.js is in neither the initial bundle nor Class Ride's own chunk, and a ride
  with the class video never fetches it. The Class fetches none of the course's files. A dynamic
  import with `setInput` is used rather than `@defer`, whose runtime would grow the initial bundle.
- **A contract of one course.** `api` holds `CourseRenderer`, `CourseFrame` and `COURSE_RENDERER`
  in the place of the `world/` contracts (`World`, `WorldId`, `WorldRenderer`, `WorldDownloader`,
  `WorldPanoramas`, `WorldQuality`, `RealPlace`, `LoadStepView`). A frame carries the ride's time
  and the crank's angle and nothing else. `ClassDefinition` loses its `world` field: there is one
  course and the class does not name it (L2-173 AC9).
- **The rider alone.** `ThreeCourseRenderer` makes one rider. The field of other riders, the
  ghost, bots and pacers, their shadows and the per-rider stream are removed (`race-riders`,
  `pacers`, the field in `course-renderer.ts`). How the course itself is drawn is not changed.
- **The first frame is where the clock is.** `SceneDriver` starts from the ride's second at the
  moment the course can be drawn, so a course that comes late shows the rider up the road and
  never on the grid (L2-175 AC3). The placement rule through the ride stays slice 37.2's.
- **Telo Ride's worlds go.** Everything in the `world` library that Ibiza Sunset Strip's renderer
  does not reach is removed with its unit tests: the world scenes and their builders, the map
  renderer, the worlds' music lists and player, the quality settings of World Ride. The library is 52
  files and 6,637 lines, from 191 and 116,049. `3d-tiles-renderer` leaves `package.json`, and the Draco decoder
  leaves the build's assets: nothing kept reads either.
- **The music goes until L2-176 is built.** All 192 tracks in `public/music/` are removed. None
  is a requirement's: L2-176 names one track, *Beautiful Boom Bap*, which is kept at
  `docs/videos/assets/music/` and which slice 37.5 adds to the app. Until then a ride in Ibiza is
  silent. `/music/*` stays in the static host's list of asset folders for that slice.
- **The still is of the solo ride.** `public/maps/` goes; the course's one picture is
  `courses/ibiza-sunset-strip.jpg`, a frame of the course as the app draws it, with the rider
  alone (open question 21). The service worker keeps it with the app's other pictures.
  `public/machines/` stays: Connect Bike shows `machines/echelon-ex5s.jpg`.

## Consequences

- The production build is 4,800 KB in 43 files, from 214,928 KB in 331. The initial bundle is
  79.19 kB gzipped, from 79.29 kB.
- Three specs go with World loading (`class-world-loading`, `class-world-build`,
  `class-world-start`), with the page object and the music fixture only they used. What they
  proved of the course itself (its files of the app's own origin, the rider's file awaited before
  anything is drawn, the canvas, leaving while it loads) is proved by `class-ride-ibiza.spec.ts`
  on Class Ride. The unit tests are 601, from the 1,464 the lessons log records for slice 31.3; nearly all that went
  were the worlds'.
- A rider on a slow connection sees the still and "Loading Ibiza Sunset Strip" for as long as the
  renderer and the 2 MB course take, with the class already running. What they see when the
  course cannot be loaded at all is slice 37.4's; until then the still and its words stay.
- The Content Security Policy still allows `https://tile.googleapis.com`, `blob:` and
  `'wasm-unsafe-eval'`, which only the removed map tiles and decoder needed. Slice 35.1 narrows
  the policy (L2-131) and takes them out.
- `tools/course-bench` read the race's fixtures, which went with races; it does not run and is
  not repaired here. The heap check `e2e/heap/enter-and-leave.heap.ts` now waits for the course's
  canvas instead of World loading's button; it was kept compiling and not run.
- ADR 0044's "wired to the two rides the app has" is over: both ways are one ride.
