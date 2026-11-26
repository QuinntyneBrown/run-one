# 0015. Sessions kept in a file, computed in Core

- **Status:** Superseded by [0019](0019-no-backend.md) (no backend: sessions are kept in IndexedDB and computed in `@wattzup/browser`); previously amended by [0016](0016-bike-only.md) and [0017](0017-browser-edition.md)
- **Date:** 2026-11-18
- **Amends:** [0004](0004-sse-and-single-process-in-memory-state.md)

## Context

The Magic Patterns frames *Session Summary* and *Progress* add a ride history (L1-015). Ending a
ride saves it as a *session*. A summary shows how the ride went and what changed since the last
attempt at the same class. Progress shows the trend on classes ridden more than once, the streak of
days ridden, a weekly goal and achievements.

The prototype builds the session in the browser (`recordFromRide` in `shared/sessions.ts`) and keeps
the sessions in `localStorage`, on top of a month of seeded rides. That does not fit Wattzup:

- A history must outlive a browser, a cleared site cache and a restart of the backend. The rider
  may also open Wattzup from another device in the house.
- Wattzup is one process on one machine next to the bike, and its state is in memory (ADR 0004).
  AGENTS.md asks for an ADR before adding a database.
- The rules for a session (cadence dips, time on target, best minute, averages) and for the figures
  over sessions (streaks, the weekly goal, the previous attempt, bests, achievements) are business
  rules. AGENTS.md puts business rules in `Wattzup.Core`. The engine already takes a sample of the
  bike each running second, and the browser may not be open, or may reconnect, when a ride ends.
- The design shows the average heart rate. Wattzup has no heart-rate sensor (ADR 0003).

## Decision

**The backend builds each session in `Wattzup.Core` when the workout ends, and keeps the sessions
in one JSON file. Core also computes every figure over them, and the API serves the results.**

- The workout engine keeps the power and cadence of each running second on the bike. When a
  workout ends (stopped, plan finished, or the bike shut off), and it ran for at least 60 s, Core
  builds the session (L2-081) and saves it. The id is published as `workout.session_id`, and
  `POST /api/workout/stop` answers with it.
- The file named by `Wattzup:Sessions:Path` (default `sessions.json`) holds
  `{"sessions":[…]}`, newest first, capped at the 500 newest. It is read once at start and written
  whole after each save: first to a temporary file in the same folder, then moved over the old one.
  A file that cannot be read is renamed to `<file>.unreadable`, so the next save never overwrites
  history unread. A failed write is logged and never blocks the end of a ride.
- Streaks, the weekly goal, the previous attempt, bests and achievements are computed in Core from
  the sessions and the time now (`TimeProvider`), in the local time zone of the machine next to
  the bike. `GET /api/sessions/{id}` and `GET /api/progress` serve them (L2-083, L2-087). The
  frontend only lays them out, plus a little geometry (the calendar grid, the chart scales).
- Achievements are written in terms of plan properties (an hour or more; a `hiit` or `intervals`
  plan; a `work` segment), never in terms of a class id, because nothing in the code names a class
  (ADR 0014).
- A session holds no heart rate. Nothing shows a heart-rate figure for it, because there is no
  sensor to measure one (ADR 0003).
- **Amending ADR 0004:** sessions are the one piece of state that outlives the process. Live
  state, the running workout and the event stream stay in memory.

## Consequences

- The history survives restarts, browsers and devices, and a crash while writing leaves either the
  old file or the new one. A person can copy or back up the file.
- Every rule has one implementation, tested once per row of its table in `Wattzup.Core.Tests`. A
  Progress page on a second device shows the same streak as the first.
- "Today" and "this week" use the backend machine's time zone. A browser in another time zone sees
  the backend's days. This is acceptable for one machine next to the bike.
- Rewriting the whole file per ride costs a few milliseconds for 500 sessions (about 4 MB). A much
  larger history, editing, deleting, exporting or syncing sessions would each need new
  requirements, and a database would need an ADR.
- Rides shorter than a minute leave no session, so a mistaken start does not count towards a
  streak.
- Treadmill runs are not recorded. Recording them later means a requirement and a change to the
  session record.
- Tests point `Wattzup:Sessions:Path` at a per-test temporary folder, and never write the content
  root's file.
