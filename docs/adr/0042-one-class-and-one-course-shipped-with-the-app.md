# 0042. One class and one course, shipped with the app

- **Status:** Accepted
- **Date:** 2026-11-23
- **Carries out:** [0037](0037-no-backend-the-class-ships-with-the-app.md) (the class ships with the app), [0036](0036-no-races-in-telo-ride-1.md) (the other seven courses go with the class library)
- **Supersedes:** [0028](0028-class-catalogue-shipped-with-the-backend.md), [0014](0014-class-catalogue-as-a-file.md)
- **Narrows:** [0034](0034-maps-built-in-blender.md), [0035](0035-every-map-a-course.md) (one course, Ibiza Sunset Strip), [0040](0040-four-screens-and-no-menus.md) (what `/` says when the class cannot be loaded)

## Context

Telo Ride 1 has one class, Intervals to the Beat, and one course, Ibiza Sunset Strip (`AGENTS.md`;
L2-080, L2-173 AC9). ADR 0037 decided the class ships with the app and ADR 0036 left the other
seven courses to the slice that leaves one class. Until this change the app still opened on the
stand-in `hiit-cardio-30`, read from the backend's `GET /api/classes` through `HttpClassesApi` and
kept in `localStorage` (ADR 0028, ADR 0040), and it still carried eight courses, six panoramas,
sixteen map covers and the Blender scenes, course files, themes and films of all eight.

## Decision

- **The class is data in `domain`.** `INTERVALS_TO_THE_BEAT` (`domain/src/engine/`) is a typed
  constant, a `ClassDefinition`: id `intervals-to-the-beat`, "Intervals to the Beat" by
  "GCN Training", focus "Intervals", 1200 s, the summary of L2-080 AC1, the video `il_OFz6o42I`
  with a sync offset of 3.0 s, the world `ibiza`, and the 33 segments of L2-080 AC2.
- **Its plan is the course's plan.** The segments are those of `tools/blender/courses/ibiza.json`,
  segment for segment and second for second; that file and L2-080 AC2 agree, and neither was
  changed. A unit test holds the constant to L2's table, one case per row, and the acceptance
  test rides the app through the segments read from the course's file, so a later change to one
  of the three fails a test.
- **A contract and a token in `api`.** `THE_CLASS` is a `TheClassSource` with one method, `get()`,
  which answers the class at once or refuses with a `ClassError` whose `code` is `class_invalid`.
  `shippedClass()` in `domain` implements it; `ride` binds it on the two lazy routes that read
  it, Class Start and the class ride, so the class's data stays out of the initial bundle.
- **The rules a plan must meet** are `ClassRule.broken` (L2-080 AC3): every level 1 to 32, every
  segment with a cadence aim, exactly 17 work segments, and segments of at least a second that add
  up to the class's length. The class is checked each time it is read.
- **A class that breaks a rule is not offered.** `/` says "The class can’t be loaded. Reload
  Telo Ride 1 to try again." with **Reload**, which reloads the page; there is no video, plan or
  start button (mock `the-class/cannot-load`). The class ride's address leads to `/`. The
  carried-over "Check your connection and try again." with Try again is gone: no connection is
  involved, and asking the same data again gives the same answer.
- **No other class has an address.** The class ride's route is `classes/intervals-to-the-beat/ride`
  until slice 31.1 moves it to `/ride`; `/classes/<any other id>/ride` is page not found.
  (Slice 31.1 moved it: [ADR 0046](0046-class-ride-at-ride-behind-a-connected-bike.md). Every `classes/…` address is now page not found.)
- **Nothing calls an API.** `HttpClassesApi`, `CachedClassesApi`, `CatalogueCache`, `CLASSES_API`,
  `ClassesApiError`, `ClassDto`, `VideoDto`, `ClassCatalogueDto` and `ShelfDto` are removed, and
  with them `provideHttpClient`: nothing else used `HttpClient`. A catalogue an earlier version
  kept in `localStorage` under `telo-ride.class-catalogue` is left where it is and never read.
- **One course.** The glb and course JSON of Prairie Paceline, Old Town Criterium, Cliffside
  Coast, Neon Docklands, Dolomites, Vice City and Col du Granit leave `public/courses/`, with
  their entries in `world`'s `COURSE_WORLDS` and Vice City's alias; their panoramas
  (`public/worlds/`) and map covers (`public/maps/`) go, and Ibiza's two covers stay for The
  Class's still (L2-173 AC3). In `tools/blender/` their course files, scenes and themes go, with
  the code in `build_course.py` and `themes.py` only they used; `blender/`, which held their seven
  films and none of Ibiza, is gone. Ibiza Sunset Strip, its course file, its scene and its build
  are unchanged: the course was not rebuilt.
- **The class ride behaves as it did for a class with a world**, with Ibiza Sunset Strip as that
  world, until slice 30.2 gives the rider the choice (L2-173): World loading builds the course and
  the ride draws it with the class video inset.
- **The backend's catalogue goes.** `GET /api/classes` and `GET /api/classes/{id}`, their queries,
  `IClassCatalogue`, `classes.json` and their tests are removed. What is left of `backend/`
  (health, serving the app's build, telemetry, `migrate`) goes with slice 28.8.

## Consequences

- The class shows without a network after a first visit because it is one of the app's own files
  (L2-080 AC5); nothing is cached for it.
- The initial bundle is smaller, by `HttpClient`.
- The repository is about 190 MB lighter: 52 MB of courses and 1.2 MB of panoramas and covers in
  the app, and 135 MB of Blender scenes and films.
- **What is left with nothing to do.** No world in the app has a panorama, so World loading's
  download step reads "Built into the app", the `WORLD_DOWNLOADER` has nothing to fetch, and
  "ready as a panorama" names a picture that is not there. They are kept as carried over, with the
  one unit test that still applies, because L2-175 replaces World loading whole ("There is no
  loading screen"); the slice that builds it removes them. The `world` library's other scenes
  (`main`'s worlds, drawn in code) and each world's music are not courses and are not removed
  here; L2-176 and riding in Ibiza decide them.
- The 3-hour heap check has no 3-hour class to ride; it rides the 20:00 class until slice 34.3
  decides how L2-138 AC1 is measured.
- `AGENTS.md` is a project instruction file and is not edited by this change. These lines of it
  are now out of date:
  - *Carried over from Telo Ride*: "… the World library and its Blender courses (`blender/`,
    `tools/blender`), the class library …". `blender/` is gone and `tools/blender` builds one
    course.
  - *Where things are*: "Telo Ride 1 needs only the class catalogue from it [the backend]". It
    needs nothing from it; the backend serves no catalogue.
  - *Frontend*: "`api` (contracts, types, injection tokens, and the HTTP and SignalR clients for
    the backend)". `api` holds no client.
