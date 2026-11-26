# 0044. The Class offers two ways to ride, wired to the two rides the app has

- **Status:** Accepted
- **Date:** 2026-11-23
- **Carries out:** [0042](0042-one-class-and-one-course-shipped-with-the-app.md) ("until slice 30.2 gives the rider the choice")
- **Narrows:** [0040](0040-four-screens-and-no-menus.md) (the header's bike status is a link, and the class offers a choice of picture)

## Context

The Class is the home screen (L2-084), and it offers the one class two ways: with the class video
or in Ibiza Sunset Strip (L2-173). Until this change `/` showed the carried-over Class Start, whose
one button opened World loading and then the ride in the course with the video inset, for every
rider (ADR 0042). ADR 0040 took the navigation out of every header and wrote "No link in any header
leads anywhere" and "Class Start offers no choice of picture", both until slice 30.2. No slice of
the plan built riding in Ibiza as L2-174 to L2-177 specify it.

## Decision

- **The Class replaces Class Start.** `ride/src/app/the-class/` holds the page, its store, its
  route and the pure `theClassView`; `components` holds the `the-class` block (`TheClass`), its
  header link (`TheClassBike`) and the radio group (`RideWith`); the view's type is in `api`.
  "Video link and sync" (`ClassSync`), `ClassStartVideo`, `AppHeaderBike` and the "20 min" in the
  meta line are removed: the design does not draw them. `ClassStartHeader` is now `ScreenHeader`.
- **The bike status is a link to Connect Bike** (L2-019), on every width. It is the one link in
  The Class's header; no other header gains one.
- **The choice is a contract and a token in `api`.** `HOW_TO_RIDE` keeps `'video'` or `'ibiza'`;
  `HowToRideStore` in `domain` keeps it as one value in `localStorage` (`telo-ride.ride-with`),
  beside the remembered bike, because the record it is to be kept with (L2-173 AC2) does not exist
  until slice 32.1. `COURSE_GRAPHICS` answers whether the browser can draw the course (WebGPU, or
  else a WebGL 2 context, asked once and let go). `rideWith(kept, drawable)` in `domain` is the one
  rule both screens use: what was kept, "Class video" for a rider who never chose, and "Class
  video" whatever was kept where the course cannot be drawn (AC1, AC6).
- **The Class loads only what the choice shows.** With "Class video" the player is parked; with
  "Ibiza Sunset Strip" the parked player is destroyed and the course's still, a picture the app
  already ships, stands in its box. Neither the renderer nor the course's model is loaded there.
- **The class ride follows the choice at its present address.** `ClassRidePage` reads the same
  rule. "Class video" renders the class ride at once with the video alone, and never creates
  `WorldLoadStore`, so nothing of the course is imported or downloaded. "Ibiza Sunset Strip"
  creates it and is the carried-over ride: World loading, then the course with the video inset.
  The address carries no `?mode=solo`: every ride is solo (ADR 0038).
- **World loading no longer starts as a panorama for a browser that cannot draw.** Such a browser
  rides with the class video (L2-173 AC6), so `WorldLoadStore` no longer asks the browser what it
  can draw. Its panorama stays for a renderer that fails to start, a download that stops and a
  slow build.
- **Riding in Ibiza as specified is its own journey.** Journey 37 of `docs/journeys.md` replaces
  World loading and the inset video with L2-174 to L2-177.

## Consequences

- A rider who has never chosen now rides with the video alone, where every ride before this was in
  the course. Specs that rode the course say so first, by keeping "Ibiza Sunset Strip" as chosen.
- The start button's words follow the bike only: "Start class", or "Connect your bike" with its
  line. "Ride it again" waits for the record (slice 32.6); the disabled button was built by slice 30.6.
- The still shows other riders, from when the course was raced (L2 open question 21).
- Until journey 37, "Ibiza Sunset Strip" still shows a loading screen and the class video, and
  plays the course's deep house track only when the video cannot play (L2 open question 20).
