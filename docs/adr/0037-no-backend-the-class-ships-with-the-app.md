# 0037. Telo Ride 1 has no backend: the class ships with the app

- **Status:** Accepted
- **Date:** 2026-11-22
- **Supersedes:** [0025](0025-thin-dotnet-backend.md), [0026](0026-api-serves-the-app.md), [0028](0028-class-catalogue-shipped-with-the-backend.md), [0029](0029-map-catalogue-shipped-with-the-backend.md), [0031](0031-sign-in-code-email-over-smtp.md), [0033](0033-same-origin-proof-instead-of-anti-forgery-tokens.md)

## Context

`backend/` is Telo Ride's thin .NET service (ADR 0025): email sign-in, rider progress, SignalR
for live races and group classes, feedback, and the class and map catalogues. `AGENTS.md` left
open whether Telo Ride 1 keeps it, and L2's open question 1 asked where the one class comes from.

Telo Ride 1 leaves out everything the backend does but the class catalogue: it has no sign-in, no
progression, no group classes, no races and no feedback (`AGENTS.md`, L1). What is left is one
class, Intervals to the Beat, which never changes between releases of the app.

The requirements already point one way:

- L2-149 AC1: the deployed frontend is static files served over HTTPS.
- L2-131: the app connects only to its own origin, and to YouTube for the class video.
- L2-132 and L2-168: the rider's record (ride count, best output, last output) is kept on the
  device and nowhere else.
- L2-080 AC5 and L2-135: the class shows without a network after a first visit, and a ride
  finishes without one.
- The backend's catalogue does not hold Intervals to the Beat; its plan is in the course's file.

A service kept for one read-only document would add a host to run, a database it does not need,
a second deploy and a request that can fail before the rider sees the home screen.

## Decision

- **Telo Ride 1 has no backend.** The app is static files. Nothing in it calls an API or opens a
  hub connection.
- **The class ships with the app.** Intervals to the Beat, with its plan, is data in the
  frontend: a typed constant in `domain`, validated by the same rules a catalogue answer was
  (slice 30.1). It is in the app's own files, so it shows offline after a first visit with the
  rest of the app (L2-080 AC5) and needs no cache of its own.
- **The rider's record stays on the device**, behind a contract in `api` with its implementation
  in `domain`'s `storage/` (slice 32.1).
- **`backend/` is removed, in the slices that already remove what it serves**, never extended:
  the hub with 28.3; sign-in, accounts, progress and recorded rides with 28.4; the class
  catalogue's client with 30.1; and the projects, their tests, the CI job, the .NET set-up and
  `docs/deployment.md` with 28.8, which also moves hosting to a static host (ADR 0022's choice,
  Azure Static Web Apps, stands again unless 28.8 finds a reason against it).
- **The `api` library keeps its name.** It holds contracts, types and injection tokens; its HTTP
  and SignalR clients go with the backend.

## Consequences

- One thing to deploy, and nothing to keep running. No database, no secrets, no sign-in email.
- A change to the class is a release of the app. With one class that is what a change is anyway.
- A rider's record does not follow them to another device. Telo Ride 1 has no sign-in, so nothing
  could carry it.
- L2's open question 1 is closed. `AGENTS.md` says the backend is being removed and that nothing
  is added to it.
- The superseded ADRs keep their status line until the slice that removes their code changes it.
- Until 28.8, `backend/` still builds and its tests still run in `verify` and CI, so each removal
  slice stays green.
