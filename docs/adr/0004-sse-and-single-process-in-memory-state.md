# 0004. Server-Sent Events and single-process in-memory state

- **Status:** Superseded by [0019](0019-no-backend.md) (no backend); previously amended by [0015](0015-sessions-kept-in-a-file.md) and [0017](0017-browser-edition.md)
- **Date:** 2026-11-15

## Context

The UI needs every state change pushed in real time (L2-015, L2-037). Wattzup runs on the one
machine next to the bike, for one rider.

## Decision

The backend is one process. `BikeStateStore` holds the state in memory, is its only writer, applies
changes under a short lock and publishes them by reference swap. The broadcaster pushes the full
state to each client over Server-Sent Events from a bounded per-client channel (50 messages, drop
newest for that client). Event-stream tokens, rate-limit counters, the command log, the power trace
history and the raw-packet ring buffer are in memory too. There is no database.

## Consequences

- A second instance or a database needs a new ADR.
- A restart loses the ride in progress; `status.json` keeps the last state for troubleshooting only.
- `EventSource` cannot send headers, hence the single-use event token of L2-035.
