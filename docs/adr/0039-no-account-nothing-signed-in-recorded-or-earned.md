# 0039. Telo Ride 1 has no account: nothing is signed in, recorded or earned

- **Status:** Accepted
- **Date:** 2026-11-23
- **Supersedes:** [0031](0031-sign-in-code-email-over-smtp.md), [0033](0033-same-origin-proof-instead-of-anti-forgery-tokens.md), and what [0025](0025-thin-dotnet-backend.md) still described of accounts and progress
- **Narrows:** [0029](0029-map-catalogue-shipped-with-the-backend.md)

## Context

Telo Ride 1 asks for no account, email, name or password and sets no cookie of its own (L2-132
AC1), and a finished ride sends no request (L2-132 AC3). The code carried over from Telo Ride still
signed the rider in with an emailed code (ADR 0031), kept a session cookie guarded by a same-origin
proof (ADR 0033), asked for a display name, and sent every finished ride to the backend, which
answered with XP, a level, a streak, stars and unlocks (ADR 0025). Feedback and the custom workout
were saved against the signed-in rider. ADR 0037 decided that Telo Ride 1 has no backend and that
accounts and progress go with this slice; ADR 0038 left the map catalogue's file to it.

## Decision

- **No sign-in and no account.** The app opens straight on its screens. The sign-in, code and
  display name screens, the auth guard, the session and its interceptor, the Display name, Sign out
  and Delete my account rows and their dialogs are removed. `/sign-in` and everything under it is
  page not found. The app sets no cookie.
- **Nothing is earned.** XP, rider levels, streaks, stars, unlocks and class tiers are removed: the
  header has no streak, level badge or XP bar; Profile has its title, the bike row and Ride
  settings; Home greets by the time of day, without a name; every class in the catalogue is open
  and a class carries no `opensAtLevel`; Results has no XP panel.
- **Nothing is recorded.** A finished class is sent nowhere. The ride outbox, its retries, its
  IndexedDB store and its "waiting offline" states are removed, with Diagnostics' "Rides waiting to
  send" fact. `RideRecorder` holds three numbers (seconds, joules, seconds on target) for Results'
  output and share on target, and nothing else.
- **No feedback and no custom workout.** Both needed an account, and Telo Ride 1 leaves both out:
  the feedback dialog, its store and its API, Custom Setup, the custom ride and its saving and
  restoring are removed. `/profile/custom` is page not found. Diagnostics, which the custom ride's
  bike status also opened, opens from the bike row of Profile and Settings, for a paired bike.
- **The only request is for the class catalogue.** The app asks `GET /api/classes` and nothing
  else, until slice 30.1 ships the class with the app.
- **The backend keeps the catalogue, health and hosting.** Accounts, authentication (the cookie,
  the ticket store, the same-origin proof, the email sender), progress, rides, workouts, feedback
  with its `feedback` command, and the map catalogue (`maps.json`, `IMapCatalogue`) are removed
  from all four projects. With no scheme left there is no authentication or authorization
  middleware and no fallback policy: every endpoint answers without a session, and an unknown
  address under `/api` or `/health` answers 404 `not_found`, not 401. The migration
  `RemoveAccountsAndProgress` drops `Riders`, `RiderSessions`, `SignInCodes`, `Rides`,
  `MapProgress`, `CustomWorkouts` and `FeedbackReports`; the first `migrate` of a deployed database
  deletes that data.
- **The rider's record is built on the device.** The ride count, best output and last output
  (L2-168) are kept in the browser by slice 32.1. Until then no ride is counted. Results shows the
  time, the output and the share on target, with no XP, until Class Done replaces it (32.2).

## Consequences

- A new browser needs nothing to ride: no email, no code, no name.
- A rider of Telo Ride loses nothing on their device, but Telo Ride 1 reads none of their progress,
  and a deployed database loses its accounts and rides at the next migration.
- No screen opens Diagnostics before a bike is paired, and no ride screen opens it: a ride's last
  command is no longer shown. Class Ride gets its own way in if a later slice needs one.
- Heart rate (the strap, its decoder and its stats) is now used by no screen; slice 28.5 removes
  it, as planned.
- `AGENTS.md` is out of date in these lines, corrected with the backend's removal (28.8): "Each
  service has a contract and an injection token in `api` … The SignalR client is one of those
  services"; "A contract refuses with an error whose `code` a screen branches on" names no sign-in
  refusal any more; the backend rules "Endpoints require authentication by default (fallback
  policy); keep intentional `[AllowAnonymous]` access explicit", "A person sees and changes only
  their own data and the groups they belong to" and "No log, metric or span carries a contact
  detail, a token, message text" describe accounts the backend no longer has; the backend test
  rules name `FakeTimeProvider` and hub tests, which are gone; and *Carried over from Telo Ride*
  still lists sign-in, progression and the custom workout as held in the code.
