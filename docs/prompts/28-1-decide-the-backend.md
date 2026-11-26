# Feature: Slice 28.1 — Decide the backend

## Goal

Settle, in an ADR, whether Telo Ride 1 keeps `backend/` for the class catalogue or ships the one
class with the app (L2's open question 1, `docs/specs/L2.md`). No product code changes: the
slices that follow act on the decision.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: the decision, the docs it changes, a film
  and a PR. Go through every phase in one continuous run. Do not pause to report, ask for
  approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true.
- Where the repo's instructions say "stop and ask", treat this prompt as the confirmation in
  advance for everything in scope here. Choose the simplest option that fits the requirements,
  record it in the ADR, and keep going.
- When a check fails, find the root cause and fix it, then go on. Never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself. If that happens, finish everything
  else first, then report the blocker clearly.
- Keep track of progress (a todo list).

## Rules (read first, binding)

- Follow `AGENTS.md` exactly: the decision brings an ADR; add nothing to `backend/`; docs,
  designs and ADRs are exempt from ATDD and get no tests.
- Read `docs/lessons-learned.md` first and apply L149 (the specs stand over the journeys doc).
- Copy the house style of `docs/adr/`.

## Phase 1: Decide

- Read ADR 0019, 0022, 0025, 0026 and 0028, `docs/detailed-designs/platform/host-and-deliver/`,
  and L2-080, L2-131, L2-132, L2-135, L2-149 and L2-168.
- Write `docs/adr/0037-…md`: context, decision, consequences, the ADRs it supersedes, and which
  later slice removes each part of the backend if it goes. Add it to `docs/adr/README.md`.

## Phase 2: Bring the docs in line

- `AGENTS.md`, "Where things are": replace "not decided yet" with the decision.
- `docs/specs/L2.md`: close open question 1.
- `docs/detailed-journeys.md`: rows 28.1 and 28.8 and "What a slice waits for".

## Phase 3: Close the slice

- The film in `docs/videos/28-1-decide-the-backend/` (`docs/videos/README.md`), its row in the
  videos index, the entry in `docs/lessons-learned.md`, and **% complete** in
  `docs/detailed-journeys.md` and `docs/journeys.md`.

## Deferred

Removing the backend's code (28.3, 28.4, 28.8, 30.1) and choosing the static host (28.8).

## Done means

- The ADR is accepted and every doc above agrees with it.
- `node tools/verify/verify.mjs` still passes with `E2E_PORT=4310`.
- The work is on a branch with a PR to `main`, rebased on `origin/main`, CI green, merged.
- End with a short summary of the decision and what each later slice now does.
