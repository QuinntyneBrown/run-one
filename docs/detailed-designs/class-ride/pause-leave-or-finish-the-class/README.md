# Pause, leave or finish the class

## Overview

Telo Ride 1 has one class, Intervals to the Beat, which the rider takes on the Class Ride screen
while the app sets the bike's resistance and plays the class video. The ride is always solo, so
no one else depends on its clock. The rider can therefore stop it for a moment, walk away from
it, or ride it to the end.

This feature covers the three ways a ride stops:

- **Pause** holds the clock, the plan and the video where they are; **Resume** carries on from
  the same place.
- Leave returns to The Class at once. The ride is not finished and the record does not change.
- The finish comes when the ride clock reaches the plan's length, 20:00. The ride is finished,
  the record is updated and Class Done opens.

In all three, whatever the ride acquired is released when Class Ride closes.

Local terms:

- **ride clock**: elapsed running time of the ride, taken from a monotonic clock and held while the ride is paused
- **hold**: state in which the ride clock, the plan and the video stand still
- **finished ride**: ride whose clock reached the plan's length
- **record**: rider's ride count, best output and last output, kept on the device
- **ride result**: output, running time, on-target share and effort averages of one finished ride, handed to Class Done

Neighbouring features own the adjacent concerns:

- The screen, the video and the bike panel belong to
  [ride the class](../ride-the-class/README.md).
- A hold caused by a lost bike (`L2-092`) belongs to
  [wait for a lost bike](../wait-for-a-lost-bike/README.md). This feature and that one share the
  same hold.
- Updating the record (`L2-168`) belongs to
  [keep the record](../../class-done/keep-the-record/README.md); showing the result (`L2-078`)
  belongs to [show Class Done](../../class-done/show-class-done/README.md).
- The manual resistance controls that stay enabled during a pause (`L2-028` AC4) belong to
  [control resistance](../../bike/control-resistance/README.md).
- The confirmation the browser asks for when the tab is closed mid-ride (`L2-133` AC4) belongs to
  [keep the ride clock true](../../performance/keep-the-ride-clock-true/README.md); the heap
  after repeated leaving (`L2-138` AC3) belongs to
  [stay smooth on long rides](../../performance/stay-smooth-on-long-rides/README.md).

## Description

The slice lives in the Ride app: `ClassRidePage` (the ride itself, at `/ride`) and
`ClassRideStore` in the `ride` application, the clock and ticker in `domain`'s
`engine/`, and the pause overlay in `components`. Pausing, leaving and the finish exist in the
code for Telo Ride's class ride; Telo Ride 1 changes where Leave and the finish go and what the
finish writes.

**Built by slice 31.2:** Pause and Resume with their announcement, the overlay over the course
in Ibiza, Leave, the finish at 20:00, and `forgetTarget()`. **Still to build, in journey 32:**
the record (`RIDE_RECORD`), `FINISHED_RIDE`, the `/done` route and Class Done. Until then
`finish()` opens the carried-over Results at `/results` with a `ClassResult` in the
navigation's state, and "the record does not change" on Leave is proved as "nothing the app
keeps on the device changes".

### Pause and Resume

- **Pause button** (`class-ride-session.html`). A `wz-button` in the header's `end` slot. It
  reads "Pause" while the ride runs and "Resume" while it is held, and calls
  `ClassRideStore.pause()` or `resume()`. Its word and whether it is disabled come from
  `rideHold()` (see [wait for a lost bike](../wait-for-a-lost-bike/README.md)). It keeps an
  `aria-label` with the same word, because the visible label (`class-ride__pause-label`) is
  hidden on a phone. The same element is kept as the word changes, so a rider who pressed it by
  keyboard keeps the focus on it.
- **`ClassRideStore.pause()` and `resume()`** (exist). `pause()` sets the private signal
  `pausedByRider` and, unless the bike is already lost, calls `hold()`: `RideClock.pause()` and
  `VideoPlayer.pause()`. `resume()` clears the signal and, unless the bike is lost, calls
  `carryOn()`: `RideClock.resume()`, then `seekTo(sync offset + elapsed)` and `play()` on the
  player.
- **`RideClock.pause()` and `resume()`** (exist). The clock records when it was paused and adds
  the paused interval to `pausedTotalMs` on resume, so `elapsedMs()` does not move while held.
- **`RideTicker`** (exists). It publishes a second only when the clock reaches a new whole
  second. A held clock reaches none, so `WorkoutEngine` steps no segment and sends no plan
  level, and the ride's running totals do not grow.
- **`ClassVideo`** (exists, `wz-class-video`). Its `paused` input draws the `class-video__paused`
  overlay reading "Paused". The overlay is `aria-hidden`; the store announces the change.
- **`ClassCourse`** (`wz-class-course`, built by slice 37.1 in the place of `ClassWorld`). In
  Ibiza the course takes the video's box. Its `paused` input draws the same overlay over the
  whole box (`class-course__paused`, mock `class-ride/paused-ibiza`), while the course holds
  still under it because the scene's `running` input is false (`L2-091` AC1).
- **Announcement** (built by slice 31.2). `ClassRideStore.pause()` and `resume()` each call
  `ANNOUNCER.announce` once, with `pauseAnnouncement()`: "Ride paused" and "Ride resumed"
  (`L2.md` open question 28). `ANNOUNCER` is the app's one polite live region
  (`LiveRegionAnnouncer`, which the ride's segments already use), not the CDK's
  `LiveAnnouncer`: `@angular/cdk` left with ADR 0040. The visually hidden `role="status"`
  paragraph that read "Ride paused" is gone, so the pause is said once and the resume is said
  at all. A hold for a lost bike is announced by its alert, not here.
- **`ClassResist`** (exists). Its `disabled` input follows `ClassRideStore.canControl`, which
  depends on the bike's link state only. A pause does not disable it.

### Leave

- **Leave link** (`class-ride-session.html`). An `<a wz-button>` with
  `aria-label="Leave class"` and `routerLink="/"`. It opens no dialog.
- Leaving destroys `ClassRidePage` and with it every provider the page declares. Nothing in the
  leave path calls `RIDE_RECORD.add`, so the count, best and last stay as they were
  (`L2-168` AC2).
- Leave stays in reach while the bike is lost: the header is drawn above the lost-bike alert
  (`class-ride__header`, `L2-092` AC2).
- When the bike is lost as the rider leaves, the connection's retries carry on: Leave opens
  The Class, which shows the bike's status and retries a dropped bike itself (`L2-017` AC1 on
  The Class). The store does not call `BikeConnection.disconnect()`; it only forgets the
  target (`L2.md` open question 28).

### Finish

- **`ClassRideStore.finish()`** (exists; changes). The store's `ticks` subscription calls it
  when the second reaches the class's `lengthSeconds`. It pauses the clock at the plan's length,
  stops the ticker, pauses the player and releases the wake lock. Today it then submits the ride
  to `RIDE_OUTBOX` for the backend and navigates to `/results` with a `ClassResult` in the
  navigation's state. In Telo Ride 1 it reads the three accumulators, rounds the output to a
  whole kJ and calls `RIDE_RECORD.add` with it. It builds the `ClassResult` with the
  `RecordOutcome` that `add` returns, sets it on `FINISHED_RIDE`, calls
  `BikeConnection.forgetTarget()` and navigates to `/done`. The submission, `RideRecorder` and
  `SubmitRideRequest` leave.
- **`RideTotals`**, **`EffortTotals`** and **`OnTargetCounter`** (`domain`'s `engine/`; the
  first exists, the other two are new). The ride's three accumulators, each holding running
  totals only (`L2-138` AC2). `RideTotals` gives `runningSeconds` and `outputKj` and belongs to
  [read bike telemetry](../../bike/read-bike-telemetry/README.md). `EffortTotals.watts()` gives
  the eight effort averages and belongs to
  [show Class Done](../../class-done/show-class-done/README.md). `OnTargetCounter.percent()`
  gives the on-target share and belongs to
  [score on target](../../class-done/score-on-target/README.md).
- **`ClassResult`** (exists in `api`; changes). The value Class Done receives: `classId`,
  `title`, `runningSeconds`, `outputKj` (not rounded), `onTargetPercent`, `effortWatts`,
  `previousBestKj` and `saved`. The shape is defined in
  [show Class Done](../../class-done/show-class-done/README.md).
- **`RIDE_RECORD`** (new). The `RideRecord` contract and its token, with `RideRecordStore` over
  the `localStorage` key `telo-ride.record`, are defined in
  [keep the record](../../class-done/keep-the-record/README.md). `finish()` calls `add` once
  and is its only caller.
- **`FINISHED_RIDE`** (new). The `FinishedRide` contract and its token, with the in-memory
  `FinishedRideHolder` bound on the parent route, are defined in
  [show Class Done](../../class-done/show-class-done/README.md). The result does not travel in
  the navigation's state, so a reload of `/done` finds none.
- **`/done` route** (new). `classDoneGuard` lets it open only while `FINISHED_RIDE` holds a
  result. The route path is an assumption the mocks share (open question 7).

### Release

- **Page-scoped providers** (exist). `ClassRideStore`, `RideClock`, `RideTicker`,
  `WorkoutEngine`, `ResistanceController`, `BikeTelemetry` and `VideoClockSync` are provided on
  `ClassRidePage`. Destroying the page destroys them.
- **`DestroyRef` teardown** (exists). `RideTicker` clears its timeout and removes its
  `visibilitychange` listener; `WorkoutEngine` and the store unsubscribe from `ticks` and from
  the `TICKER` beat through `takeUntilDestroyed`; `BikeTelemetry` unsubscribes from the
  connection's `frames` and clears its cadence timer; the store destroys the player and releases
  the wake lock; the page's `beforeunload` host listener goes with the page.
- **`BikeConnection.forgetTarget()`** (built by slice 31.2, on the existing contract in `api`). The
  connection is provided on the parent route and outlives the ride. `WebBluetoothBikeConnection`
  keeps the last target resistance and sends it again after a reconnect (`L2-017` AC4). Without a
  change, a reconnect after the rider left would send the ended ride's level. The store calls
  `forgetTarget()` in `finish()` and in its teardown, so no further resistance command is sent
  for that ride (`L2-093` AC3). `WorkoutEngine` is destroyed with the page, so its `resend()`
  sends nothing after the ride either. `SimulatedBikeConnection` implements `forgetTarget()` as
  well.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each refines the level-1 (L1)
requirement cited beside it.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-091` | `L1-015` | When the rider presses **Pause** in a running class ride, the video and the clock shall stop, an overlay on the video shall read "Paused", and Pause shall become **Resume**. The resistance controls shall stay enabled. When **Resume** is pressed, the clock, the plan and the video shall pick up where they left off. When the ride is paused or resumed, the change shall be announced once to a screen reader. In Ibiza the course shall hold still under the same overlay. |
| `L2-093` | `L1-015` | When the rider presses Leave, The Class shall open without a confirmation, the ride shall not be finished, and the record shall not change. When the clock reaches 20:00, the ride shall be finished, the record shall be updated (`L2-168`) and Class Done shall open (`L2-078`). When Class Ride closes because the rider leaves or finishes, no further resistance command shall be sent for that ride, and its timers, listeners and video shall be released. |

## Diagrams

### System context

The rider pauses, leaves or finishes the class in Telo Ride 1. The bike stops receiving plan
levels and the YouTube video stops with the ride.

![C4 system context for pausing, leaving or finishing the class](diagrams/c4-context.png)

### Containers

The Ride app holds the ride and writes the record to the browser's storage only at the finish.
The bike and the YouTube player are told to stop from the app.

![C4 container view for pausing, leaving or finishing the class](diagrams/c4-container.png)

### Components

`ClassRidePage` carries the Pause button and the Leave link. `ClassRideStore` holds and carries
on the clock and the player. At the finish it adds the ride through `RIDE_RECORD` and sets the
`ClassResult` on `FINISHED_RIDE` for Class Done.

![C4 component view for pausing, leaving or finishing the class](diagrams/c4-component.png)

### Class structure

`ClassRideStore` owns the two reasons for a hold, `pausedByRider` and `pausedByBike`, and the
`hold`, `carryOn` and `finish` steps. `RideClock` keeps the paused total; `BikeConnection` gains
`forgetTarget()`. `finish` reads the three accumulators and fills a `ClassResult`.

![Class diagram for pausing, leaving or finishing the class](diagrams/class-structure.png)

### Behaviour: pause and resume

Pause holds the clock and the video and shows the overlay; no tick arrives while held, so the
plan does not move. Resume seeks the video to the clock and plays it.

![Sequence diagram for pausing and resuming](diagrams/sequence-pause-and-resume.png)

### Behaviour: leave the class

Leave navigates to The Class with no confirmation. Destroying the page releases the timers, the
listeners and the player, and the connection forgets the target resistance. A lost bike's
retries carry on, on The Class.

![Sequence diagram for leaving the class](diagrams/sequence-leave-the-class.png)

### Behaviour: finish the class

The tick that reaches 20:00 finishes the ride: the store stops the clock, adds the ride to the
record, sets the `ClassResult` on `FINISHED_RIDE` and opens Class Done.

![Sequence diagram for finishing the class](diagrams/sequence-finish-the-class.png)
