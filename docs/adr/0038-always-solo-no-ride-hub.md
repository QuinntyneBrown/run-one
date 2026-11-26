# 0038. Telo Ride 1 is always solo: no ride hub

- **Status:** Accepted
- **Date:** 2026-11-22
- **Narrows:** [0004](0004-sse-and-single-process-in-memory-state.md), [0025](0025-thin-dotnet-backend.md), [0029](0029-map-catalogue-shipped-with-the-backend.md)

## Context

Telo Ride 1 is always solo, so the rider can pause, leave or finish (`AGENTS.md`, L1). The code
carried over from Telo Ride still held the group class: the group chip on a class card, the choice
between riding alone and with a group on Class Start, the group session's countdown on World
loading and on the class ride, the group board, and the ride hub client that carried them over
SignalR. Live races left with slice 28.2 (ADR 0036), but the hub's contracts and `backend/` still
held their sessions, bots, standings and results.

ADR 0025 gave the backend a SignalR hub for what one browser cannot do alone: riding with other
people. ADR 0004 described pushing state to the page in real time, which the hub had taken over.
ADR 0029 served the map catalogue to a race the app no longer has. ADR 0037 decided that Telo
Ride 1 has no backend and that the hub goes with this slice.

## Decision

- **No ride hub.** The app opens no hub connection and makes no request about a group session.
  `api` has no hub client, and `@microsoft/signalr` is no longer a dependency. In `backend/`, the
  hub, its filters and notifier, live sessions, group sessions, race sessions, bots, race results
  and the session ticker are removed, with `GET /api/classes/sessions`,
  `GET /api/classes/{id}/sessions`, `GET /api/maps` and `GET /api/maps/{mapId}/queue`. An address
  under `/hubs` is no longer the backend's.
- **A class is ridden solo.** The Class Library's cards carry no group chip, and Class Start has no
  choice between riding alone and with a group: it has Start class. The class ride always has
  Pause, waits for a lost bike, and has no board. Nothing asks whether the browser is online to
  offer a ride.
- **An address with `?session=…` rides the class solo.** `/classes/:id/ride?session=…`, as a
  bookmark or a link from Telo Ride would carry it, opens the class ride for that class alone: the
  parameter is not read, no session is joined, and nothing tells the rider a group was expected.
  The address is not redirected or rewritten.
  (Narrowed by [ADR 0046](0046-class-ride-at-ride-behind-a-connected-bike.md): the ride is at `/ride`, and opened
  by its address, with or without `?session=…`, it opens The Class, from which the class is ridden solo.)
- **The race results' tables go in a migration.** `RemoveLiveSessions` drops `SessionResults`,
  `SessionResultEntries` and the `SessionId` column of `Rides`. A submitted ride can no longer
  name the mode `online` or a session.
- **The map catalogue's file stays until 28.4.** `maps.json` and `IMapCatalogue` are still read
  when a ride is recorded and when progress is answered, for a map's stars and unlocks. They go
  with progression in slice 28.4, not here; only the catalogue's endpoints are removed now.

## Consequences

- One fewer library in the app, and no connection to keep alive, retry or close during a ride.
- A rider with a bookmarked group session rides the class alone, without a message.
- The App Service no longer needs web sockets (`docs/deployment.md`).
- `backend/` keeps classes, accounts, progress, rides, feedback and workouts, which later slices of
  journey 28 remove (ADR 0037).
- `AGENTS.md` still names SignalR and hub tests in its frontend, backend and E2E rules; those
  lines describe nothing that exists and are corrected with the backend's removal (28.8).
