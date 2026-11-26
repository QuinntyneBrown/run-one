# 0002. Finite plans replace endless step cycles

- **Status:** Accepted
- **Date:** 2026-11-15

## Context

The prototype ran a list of `(level, seconds)` steps forever, counting cycles, and called a step an
effort when its level was 20 or more. The Magic Patterns design, which the mocks follow, has finite
plans: HIIT rounds of work and recover with an optional warm-up and cool-down, or one flat level,
with a total time, pause and resume, and phase decided by the kind of segment. The two disagree on
the workout model, the API and the state contract (mocks open questions 2, 3, 4 and 9).

## Decision

The design wins. A plan is `hiit` or `flat` (L2-010). The backend expands it into segments
`{kind, start, duration, level, cadence, round}` (L2-045) and runs it once, from 0 to the total
(L2-011). Work and steady segments are effort; warm-up, recover and cool-down are easy (L2-025).
Pause and resume are endpoints (L2-046). A flat block may last up to 180 minutes. The `steps` and
`cycle` fields leave the state contract (L2-014).

## Consequences

- `POST /api/workout` takes a plan, not a list of steps; the prototype's request body is no longer
  accepted.
- The expansion is a table of cases unit-tested in `Wattzup.Core.Tests`; the setup preview's
  helper in `frontend/src/app/core/` is tested against the same table.
- The 90-second shut-off and the 5-second resend rules are kept unchanged.

> **Note (2026-11-17):** `frontend/src/app/core/` is now `frontend/projects/wattzup/src/app/core/`; the frontend became a workspace of three projects with ADR 0013. The decision above is unchanged.
