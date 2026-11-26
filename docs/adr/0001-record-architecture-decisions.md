# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-15

## Context

Wattzup is rewritten from a Python prototype into a .NET backend and an Angular frontend. AGENTS.md
requires an ADR for any departure from a platform's best practice and before changing the areas an
ADR covers.

## Decision

Decisions are recorded in `docs/adr/` as numbered Markdown files `NNNN-kebab-title.md` with the
sections Context, Decision and Consequences, and a status of Proposed, Accepted or Superseded by
NNNN. An accepted ADR is not edited for substance; a new ADR supersedes it.

## Consequences

- Reviewers check a change against the ADRs it touches.
- The detailed designs link the ADRs they rely on.
