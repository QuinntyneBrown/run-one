# Open the app

## Overview

Telo Ride 1 is one class on the rider's own smart bike, in four screens: Connect Bike (`/connect`),
The Class (`/`), Class Ride (`/ride`) and Class Done (`/done`). This feature decides which screen
shows when the app opens at `/`, and keeps the app free of any menu, tab bar or navigation.

A rider who has never paired a bike and never finished a ride has nothing to see on The Class but a
button that leads to Connect Bike, so the app opens there. Every other rider opens on The Class,
the home screen, whether or not the bike is connected at that moment.

- **new rider**: rider with no remembered bike and no finished ride on this device
- **returning rider**: rider with a remembered bike or at least one finished ride on this device
- **remembered bike**: name and browser identifier of the bike last paired in this browser, kept in
  browser storage
- **record**: rider's ride count, best output and last output, kept in browser storage
- **finished ride**: ride ridden to the end of the class on this device, which the record counts
- **blocked browser**: browser that cannot reach a bike, because it has no Web Bluetooth or the page
  is not secure

Neighbouring features own the adjacent concerns:

- [Show the class](../show-the-class/README.md) draws The Class once this feature has chosen it.
- [Connect a bike](../../bike/connect-a-bike/README.md) draws Connect Bike and pairs the bike.
- [Check bike and browser support](../../bike/check-bike-and-browser-support/README.md) owns the
  alerts a blocked browser shows on Connect Bike (L2-008 AC1, L2-009 AC4).
- [Keep the bike connected](../../bike/keep-the-bike-connected/README.md) owns the remembered bike
  and its reconnection without the chooser (L2-015).
- [Keep the record](../../class-done/keep-the-record/README.md) owns the record this feature reads.
- [Show page not found](../../ui/show-page-not-found/README.md) owns the address that matches no
  screen; its "Back to the class" link opens `/` and so passes through this feature (L2-145 AC2).

The four addresses are assumptions the specs and the mocks share (L2 open question 7).

## Description

The slice lives in the `ride` application's routing. It reads two contracts from the `api` library
and adds no screen of its own. Slice 30.5 built it. The addresses of Class Ride and Class Done and
their guards, in the table below, are still Telo Ride's until slices 31.1 and 32.2.

- **`routes`** (`ride/src/app/app.routes.ts`, exists): the root route table. It lazy-loads
  `rideRoutes`, so the screens and their shared providers stay out of the initial bundle. It does
  not change.
- **`rideRoutes`** (`ride/src/app/ride.routes.ts`, exists, reshaped): one parent route whose
  providers every screen shares, with one child per screen. Today it holds Telo Ride's routes
  (`sign-in`, `classes/:id`, `classes/:id/ride`, `race/:mapId`, `results`, and the `MainShell`
  children Home, `race`, `classes` and `profile`), the `authGuard` and `provideSession()`. For
  Telo Ride 1 its children are exactly five:

  | Path | Screen | Loads |
  |---|---|---|
  | `connect` | Connect Bike | `ConnectBikePage` (exists, `connect/connect-bike-page`) |
  | `` (full match) | The Class | `theClassRoutes` (new, `the-class/the-class.routes`), behind `rememberedBikeGuard` |
  | `ride` | Class Ride | `classRideRoutes` (exists; at `ride` since slice 31.1), behind `connectedBikeGuard` |
  | `done` | Class Done | `classDoneRoutes` (new, replaces `results/results.routes`), behind `classDoneGuard` |
  | `**` | Page not found | `NotFoundPage` (exists, `not-found/not-found-page`) |

  The parent route keeps `provideBikeConnection()` and gains the binding of `FINISHED_RIDES`; the
  bindings of `RIDE_RECORD` and `FINISHED_RIDE` come with the record (slice 32.1). It drops
  `authGuard`, `provideSession()` and every other route.
  `connectedBikeGuard` belongs to [Ride the class](../../class-ride/ride-the-class/README.md)
  and `classDoneGuard` to [Show Class Done](../../class-done/show-class-done/README.md).
- **`rememberedBikeGuard`** (`ride/src/app/bike/remembered-bike.guard.ts`): the `CanActivateFn` on
  the empty path. Telo Ride's guard sent a rider with no remembered bike to Connect Bike only when
  `BLUETOOTH_SUPPORT` read `'ready'`, and left a blocked browser on the class. It now reads
  `REMEMBERED_BIKE.get()` and `FINISHED_RIDES.any()` and asks `openingScreen()` for the screen. For
  a new rider it returns the `UrlTree` for `/connect`, in a blocked browser too (L2-167 AC1, AC3).
  Otherwise it returns `true` (AC2). It does not read `BLUETOOTH_SUPPORT`. It calls
  `BIKE_CONNECTION.reconnectRemembered(bike)` without awaiting it when a bike is remembered
  (L2-015 AC1). Both contracts answer synchronously from `localStorage`, and the guard returns a
  value, not a promise, so the router draws one screen and never the other first. The guard and
  the code it reads load with `rideRoutes`, outside the initial bundle.
- **`openingScreen(rider)`** (`domain/src/engine/opening-screen.ts`): the rule as a pure function
  with a unit test, one case per row.

  | Remembered bike | Finished ride | Opens |
  |---|---|---|
  | no | no | Connect Bike |
  | yes | no | The Class |
  | no | yes | The Class |
  | yes | yes | The Class |
- **`FINISHED_RIDES`** and **`FinishedRides`** (`api/src/rides/finished-rides.ts`): the contract of
  "has the rider finished a ride", one method, `any()`. Since slice 32.1 the token is bound, with
  `useExisting`, to the record: `RideRecordStore` (`domain/src/storage/ride-record-store.ts`),
  whose `any()` is `read().rides > 0`. `NoFinishedRides` is gone; the guard did not change.
- **`REMEMBERED_BIKE`** and **`RememberedBike`** (`api/src/bike/remembered-bike.ts`, exist): the
  contract of the remembered bike. `RememberedBikeStore` (`domain/src/storage/`, exists) implements
  it over the `localStorage` key `telo-ride.bike`. `get()` returns a `RememberedBikeRecord`, the
  bike's `id` and `name`, or `null`. A record it cannot parse counts as no bike.
- **`RIDE_RECORD`** and **`RideRecord`** (`api/src/rides/ride-record.ts`, new with slice 32.1):
  the contract of the record, introduced by
  [Keep the record](../../class-done/keep-the-record/README.md). `RideRecordStore` implements it,
  and `FINISHED_RIDES` with it. `current()` is `null` for a rider with no finished ride, and for a
  stored record that is missing or malformed (L2-129 AC3).
- **`AppShell`** (`ride/src/app/app-shell.ts`, exists): the root component, a "Skip to content"
  link and the router outlet. It draws no navigation, so each screen shows only its own header
  (L2-167 AC4).
- **`MainShell`** (`ride/src/app/main-shell/`, exists, not used): Telo Ride's shell with the app
  header and its navigation. No Telo Ride 1 route loads it; its removal is a change of its own.

No screen holds a link beyond those the requirements name: the bike status link and the start
button on The Class, **Done** on Class Done, Leave on Class Ride and "Back to the class" on the
page-not-found screen (L2-167 AC4). The bike status link opens `/connect`, which has no guard, so
a returning rider still reaches Connect Bike.

The acceptance test is `frontend/e2e/where-the-app-opens.spec.ts`. The page objects
`the-class.page.ts` and `connect-bike.page.ts` (`frontend/e2e/pages/`) own its selectors, and
`first-screen.ts` records every screen the app draws while it opens, so the test proves the other
screen was never drawn. A rider with a finished ride and no bike cannot be set up in the browser
until slice 32.1; the unit test of the guard covers that row.

## Requirements

The feature realizes the following level-2 (L2) requirement, which refines a level-1 (L1)
requirement cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-167` | `L1-014` | The app shall open Connect Bike when a new rider, with no remembered bike and no finished rides, opens it at `/`. The app shall open The Class when a rider with a remembered bike or at least one finished ride opens it at `/`, whether or not the bike is connected. The app shall open Connect Bike with the alert of L2-008 AC1 or L2-009 AC4 when a new rider opens it at `/` in a blocked browser. A screen shall have no menu, tab bar or navigation beyond the links the requirements name. |

## Diagrams

### System context

The rider opens Telo Ride 1, whose files a static host serves. No other system takes part in
choosing the first screen.

![C4 system context for opening the app](diagrams/c4-context.png)

### Containers

The Ride app loads from the static host and reads the remembered bike and the record from browser
storage. Those two records are all the choice depends on.

![C4 container view for opening the app](diagrams/c4-container.png)

### Components

`rideRoutes` runs `rememberedBikeGuard` on the empty path. The guard reads `REMEMBERED_BIKE` and
`FINISHED_RIDES`, which the `domain` library's stores implement over `localStorage`, and the router
then loads Connect Bike or The Class.

![C4 component view for opening the app](diagrams/c4-component.png)

### Class structure

`rideRoutes` is configuration, shown with the `<<config>>` stereotype. `rememberedBikeGuard`
depends on the `RememberedBike` and `FinishedRides` contracts, on `openingScreen()` for the rule
and on `BikeConnection` for the reconnect. `RideRecordStore` realizes `FinishedRides` (slice 32.1).

![Class diagram for opening the app](diagrams/class-structure.png)

### Behaviour: open as a new rider

With no remembered bike and no finished ride, the guard redirects to `/connect` (L2-167 AC1). In a
blocked browser Connect Bike shows its alert in place of the device card (L2-167 AC3).

![Sequence diagram for opening the app as a new rider](diagrams/sequence-open-as-a-new-rider.png)

### Behaviour: open as a returning rider

A remembered bike or at least one finished ride lets the navigation through, and The
Class shows whether or not the bike is connected (L2-167 AC2). A remembered bike also starts its
reconnection, which the guard does not wait for.

![Sequence diagram for opening the app as a returning rider](diagrams/sequence-open-as-a-returning-rider.png)
