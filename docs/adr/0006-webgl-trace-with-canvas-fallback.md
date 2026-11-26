# 0006. WebGL power trace with a Canvas 2D fallback

- **Status:** Accepted
- **Date:** 2026-11-15

## Context

The specs called for a countdown ring drawn with WebGPU, falling back to WebGL2 and then Canvas 2D,
and for 150-sample sparklines. The design replaces both with numerals and a progress bar for the
countdown and a full-ride "Power vs. plan" trace (mocks open questions 5 and 8).

## Decision

The countdown is DOM text with a progress bar. The trace is drawn on one canvas with WebGL2, falling
back to Canvas 2D when WebGL2 or its shaders fail (L2-028). Both renderers sit behind one interface
in `frontend/src/app/core/`, draw at most once per animation frame, cap the pixel ratio at 2,
and stop while the tab is hidden. WebGPU is not used.

## Consequences

- One rendering path less to test; Canvas 2D is the reference the WebGL output is compared with.
- Diagnostics shows the active renderer.

> **Note (2026-11-17):** `frontend/src/app/core/` is now `frontend/projects/wattzup/src/app/core/`; the frontend became a workspace of three projects with ADR 0013. The decision above is unchanged.
