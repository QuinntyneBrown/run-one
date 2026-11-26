# 0046. Class Ride is at `/ride`, and only a connected bike opens it

- **Status:** Accepted, narrowed by [0049](0049-a-ride-is-shaped-like-a-race-for-one.md) (`/ride` shows Ibiza Flyover, then Class Ride)
- **Date:** 2026-11-23
- **Carries out:** [0040](0040-four-screens-and-no-menus.md) and [0042](0042-one-class-and-one-course-shipped-with-the-app.md) ("until slice 31.1 moves it to `/ride`")
- **Narrows:** [0038](0038-always-solo-no-ride-hub.md) (an address with `?session=…` no longer opens a ride by itself)

## Context

L2-087 puts Class Ride at `/ride` and says that, opened without a connected bike, The Class opens
instead (AC4). Until slice 31.1 the ride was at `classes/intervals-to-the-beat/ride`, the address
Telo Ride gave it, behind two guards: `blockedBrowserGuard` (slice 30.6), which sent a blocked
browser to `/`, and `rememberedBikeGuard`, which sent a rider with no remembered bike to
`/connect` and otherwise let the ride open while the bike was still reconnecting. A bookmark, a
typed address or a reload therefore started a ride with no bike: the clock ran, the plan stepped,
and the first target resistance was sent to nothing. ADR 0038 kept an address with `?session=…`
opening the ride for the same reason an address without one did.

## Decision

- **The route is `ride`.** `ride.routes.ts` loads `classRideRoutes` at `/ride`; the address has no
  class in it, because there is one class (L2-080 AC4). `classes/intervals-to-the-beat/ride` is no
  route and reaches Page not found, as every other `classes/…` address already did. It is not
  redirected: Telo Ride 1 has shipped to no rider who could hold the earlier address.
- **One guard: `connectedBikeGuard`.** It returns `true` when `BIKE_CONNECTION.ble()` is
  `connected` and a `UrlTree` for `/` otherwise, and calls nothing. It replaces both guards on
  this route. A blocked browser never has a connected bike, so L2-010 AC2 is met by the same
  line, and `blockedBrowserGuard` is removed with its unit test; the acceptance specs of L2-010 AC2
  stand unchanged. `rememberedBikeGuard` stays on `/`, where the redirected rider lands: a new
  rider goes on to Connect Bike (L2-167 AC3) and a remembered bike reconnects.
- **The start button is the only way in.** A page load never has a connected bike at the moment
  the router asks, so a bookmark, a typed address and a reload of `/ride` all open The Class. A
  ride is not carried across a reload; the browser asks before a tab mid-ride is closed or
  reloaded (L2-133 AC4), which is where that is said.
- **`/ride?session=…` opens The Class** like any other way of opening `/ride`. The parameter is
  still never read, no session is joined, and the class is ridden solo from The Class (ADR 0038's
  other decisions stand).
- **The carried-over ride in the course follows.** With "Ibiza Sunset Strip" chosen, the start
  button opens World loading at `/ride` with the bike connected. Its "Your bike isn’t connected."
  state is now reached only when the bike drops while the course loads. Slice 37.1 removes World
  loading.

## Consequences

- Nothing is sent to a bike that is not there, and no ride's clock runs for a rider who did not
  press the start button.
- The specs enter the ride as a rider does. The ones that opened the ride's address directly
  (World loading's, the static host's, always solo's) now open The Class, connect the bike and
  press Start class; the ones that needed World loading without a bike drop the bike there.
- A rider whose page reloads mid-ride loses the ride. Keeping a ride across a reload would need
  the ride's state on the device and a way back into `/ride` without the start button; nothing in
  L2 asks for it.
- `THE_CLASS_ID`, which only the route's path read, is removed.
