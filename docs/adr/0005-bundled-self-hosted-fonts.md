# 0005. Bundled, self-hosted fonts

- **Status:** Accepted
- **Date:** 2026-11-15

## Context

The design uses Inter, Archivo (condensed, `wdth 72`) and JetBrains Mono. The Content-Security-Policy
allows same-origin resources only (L2-036), so fonts cannot come from a CDN (mocks open question 10).

## Decision

`frontend` bundles the three families as WOFF2 variable fonts under its assets, declares them
with `@font-face` in the global foundations, subsets them to Latin, and uses `font-display: swap`.
Their licences (SIL Open Font License 1.1) ship beside the files.

## Consequences

- The fonts count against the build size but not the 300 KB initial JavaScript budget.
- The mocks keep their local fallback stacks; the product renders the intended faces.
